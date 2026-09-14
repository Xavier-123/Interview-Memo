import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Loader2, Send, Square } from 'lucide-react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/store/useAppStore'
import { resolveJobContext } from '@/store/selectors'
import {
  buildMockSystemPrompt,
  buildOpeningUserMessage,
  formatTranscript,
  getSessionTitle,
  toChatMessages,
} from '@/lib/mockInterview'
import { generateMockFeedback, isLlmConfigured, streamOrText } from '@/lib/llm'
import { MOCK_MODE_LABELS } from '@/types'
import { cn } from '@/lib/utils'

export function MockSessionPage() {
  const { id } = useParams<{ id: string }>()
  const session = useAppStore((s) => s.mockSessions.find((item) => item.id === id))
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const projects = useAppStore((s) => s.projects)
  const resume = useAppStore((s) => s.resume)
  const resumeVersions = useAppStore((s) => s.resumeVersions)
  const settings = useAppStore((s) => s.settings)
  const appendMockMessage = useAppStore((s) => s.appendMockMessage)
  const completeMockSession = useAppStore((s) => s.completeMockSession)
  const addKnowledge = useAppStore((s) => s.addKnowledge)

  const { job, company } = useMemo(() => {
    if (!session) return { job: undefined, company: undefined }
    if (session.companyId) {
      return {
        job: session.jobId ? jobs.find((j) => j.id === session.jobId) : undefined,
        company: companies.find((c) => c.id === session.companyId),
      }
    }
    return session.jobId ? resolveJobContext({ jobs, companies }, session.jobId) : { job: undefined, company: undefined }
  }, [session, jobs, companies])
  const sessionProjects = useMemo(() => {
    const version = session?.resumeVersionId ? resumeVersions.find((item) => item.id === session.resumeVersionId) : undefined
    if (session?.mode === 'full' && version) {
      return version.projectSnapshots.map((project, index) => ({
        ...project,
        id: project.sourceProjectId ?? `${version.id}-project-${index}`,
        createdAt: version.createdAt,
        updatedAt: version.createdAt,
      }))
    }
    return projects.filter((p) => session?.projectIds.includes(p.id))
  }, [projects, session, resumeVersions])
  const selectedResume = useMemo(() => {
    const version = session?.resumeVersionId ? resumeVersions.find((item) => item.id === session.resumeVersionId) : undefined
    return version ? {
      summary: version.summary,
      education: version.education,
      skills: version.skills,
      rawText: version.rawText,
      sourceFileName: version.sourceFileName,
      updatedAt: version.createdAt,
    } : resume
  }, [session?.resumeVersionId, resumeVersions, resume])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const openingRequested = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const systemPrompt = useMemo(() => {
    if (!session) return ''
    return buildMockSystemPrompt({
      mode: session.mode,
      resume: selectedResume,
      projects: sessionProjects,
      company,
      job,
      roundHint: session.roundHint,
    })
  }, [session, selectedResume, sessionProjects, company, job])

  const requestAssistantReply = useCallback(
    async (messages: typeof session extends undefined ? never : NonNullable<typeof session>['messages']) => {
      if (!session || !isLlmConfigured(settings.llm)) return

      setLoading(true)
      setStreamingText('')
      try {
        const chatMessages = toChatMessages(systemPrompt, messages)
        let accumulated = ''
        const reply = await streamOrText(settings.llm, chatMessages, (delta) => {
          accumulated += delta
          setStreamingText(accumulated)
        })
        appendMockMessage(session.id, { role: 'assistant', content: reply })
        setStreamingText('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'AI 回复失败')
      } finally {
        setLoading(false)
      }
    },
    [session, settings.llm, systemPrompt, appendMockMessage],
  )

  useEffect(() => {
    if (!session || session.status !== 'active' || session.messages.length > 0 || openingRequested.current) return
    if (!isLlmConfigured(settings.llm)) return

    openingRequested.current = true
    const opening = buildOpeningUserMessage(session.mode)
    appendMockMessage(session.id, { role: 'user', content: opening.content })

    const openingMessage = {
      id: 'opening',
      role: 'user' as const,
      content: opening.content,
      createdAt: new Date().toISOString(),
    }
    void requestAssistantReply([openingMessage])
  }, [session, settings.llm, appendMockMessage, requestAssistantReply])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages, streamingText])

  if (!session) {
    return <ErrorState title="模拟会话不存在" description="该会话可能已被删除。" />
  }

  if (!isLlmConfigured(settings.llm)) {
    return (
      <ErrorState
        title="大模型未配置"
        description="请先在设置中配置 API 后再继续模拟。"
        showBack={false}
      />
    )
  }

  const title = getSessionTitle(session.mode, company, job, sessionProjects)
  const isCompleted = session.status === 'completed'

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading || isCompleted) return

    appendMockMessage(session.id, { role: 'user', content: text })
    setInput('')
    const nextMessages = [
      ...session.messages,
      { id: 'temp', role: 'user' as const, content: text, createdAt: new Date().toISOString() },
    ]
    await requestAssistantReply(nextMessages)
  }

  const handleFinish = async () => {
    if (session.messages.length < 2) {
      toast.error('对话太少，无法生成反馈')
      return
    }
    setFeedbackLoading(true)
    try {
      const feedback = await generateMockFeedback(
        settings.llm,
        formatTranscript(session.messages),
        MOCK_MODE_LABELS[session.mode],
      )
      completeMockSession(session.id, feedback)
      toast.success('模拟面试已结束')
    } catch {
      toast.error('反馈生成失败')
    } finally {
      setFeedbackLoading(false)
    }
  }

  const addQuestionToKnowledge = (question: string) => {
    addKnowledge({
      title: question,
      category: '其他',
      subcategory: '模拟面试',
      idealAnswer: '',
      myAnswer: '',
      mastery: 'fair',
      appearCount: 0,
      tags: ['模拟面试'],
      sourceQuestionIds: [],
      aliases: [],
      notes: `来自模拟面试：${title}`,
    })
    toast.success('已加入题库')
  }

  return (
    <div className="-m-4 flex h-[calc(100vh-3.5rem)] flex-col lg:-m-6">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/mock"><ArrowLeft className="h-4 w-4" /> 返回</Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate font-medium">{title}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{MOCK_MODE_LABELS[session.mode]}</Badge>
              {session.roundHint && <Badge variant="secondary">{session.roundHint}</Badge>}
            </div>
          </div>
        </div>
        {!isCompleted && (
          <Button variant="outline" size="sm" onClick={handleFinish} disabled={feedbackLoading || loading}>
            {feedbackLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
            结束面试
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-4 lg:px-6">
        <div className="mx-auto max-w-3xl space-y-4 py-4">
          {session.messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'border bg-muted/40',
                )}
              >
                <p className="mb-1 text-xs font-medium opacity-70">
                  {message.role === 'user' ? '你' : '面试官'}
                </p>
                {message.content}
              </div>
            </div>
          ))}

          {streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border bg-muted/40 px-4 py-3 text-sm whitespace-pre-wrap">
                <p className="mb-1 text-xs font-medium opacity-70">面试官</p>
                {streamingText}
              </div>
            </div>
          )}

          {loading && !streamingText && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> 面试官思考中...
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {session.feedback && (
        <div className="border-t bg-muted/20 px-4 py-4 lg:px-6">
          <Card className="mx-auto max-w-3xl">
            <CardHeader>
              <CardTitle className="text-base">
                面试反馈 · {session.feedback.overallScore}/5
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>{session.feedback.summary}</p>
              {session.feedback.strengths.length > 0 && (
                <div>
                  <p className="font-medium">优点</p>
                  <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                    {session.feedback.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {session.feedback.weaknesses.length > 0 && (
                <div>
                  <p className="font-medium">待改进</p>
                  <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                    {session.feedback.weaknesses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {session.feedback.suggestedQuestions.length > 0 && (
                <div>
                  <p className="font-medium">建议沉淀的问题</p>
                  <div className="mt-2 space-y-2">
                    {session.feedback.suggestedQuestions.map((q) => (
                      <div key={q} className="flex items-start justify-between gap-2 rounded-md border p-3">
                        <p className="text-muted-foreground">{q}</p>
                        <Button variant="outline" size="sm" onClick={() => addQuestionToKnowledge(q)}>
                          <BookOpen className="h-4 w-4" /> 加入题库
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isCompleted && (
        <div className="border-t px-4 py-3 lg:px-6">
          <div className="mx-auto flex max-w-3xl gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的回答..."
              rows={2}
              className="min-h-[56px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
            />
            <Button onClick={() => void handleSend()} disabled={loading || !input.trim()} className="self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
