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
  buildOpeningUserMessage,
  getSessionTitle,
  type MockInterviewContext,
} from '@/lib/mockInterview'
import { BuiltinMockEngine, getMockInterviewEngine } from '@/lib/mockEngine'
import { isLlmConfigured } from '@/lib/llm'
import { isMockServiceConfigured } from '@/lib/settings'
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
      educations: version.educations,
      experiences: version.experiences,
      otherInfo: version.otherInfo,
    } : resume
  }, [session?.resumeVersionId, resumeVersions, resume])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [fallbackToBuiltin, setFallbackToBuiltin] = useState(false)
  const openingRequested = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const interviewContext: MockInterviewContext = useMemo(
    () => ({
      mode: session?.mode ?? 'full',
      resume: selectedResume,
      projects: sessionProjects,
      company,
      job,
      roundHint: session?.roundHint,
    }),
    [session?.mode, session?.roundHint, selectedResume, sessionProjects, company, job],
  )

  const { activeEngine, activeEngineType } = useMemo(() => {
    if (fallbackToBuiltin) {
      return {
        activeEngine: new BuiltinMockEngine(settings.llm),
        activeEngineType: 'builtin' as const,
      }
    }
    const { engine, engineType } = getMockInterviewEngine(settings)
    return { activeEngine: engine, activeEngineType: engineType }
  }, [settings, fallbackToBuiltin])

  const requestAssistantReply = useCallback(
    async (messages: typeof session extends undefined ? never : NonNullable<typeof session>['messages']) => {
      if (!session) return

      setLoading(true)
      setStreamingText('')
      let accumulated = ''

      try {
        const reply = await activeEngine.sendMessage(interviewContext, messages, (delta) => {
          accumulated += delta
          setStreamingText(accumulated)
        })
        appendMockMessage(session.id, { role: 'assistant', content: reply })
        setStreamingText('')
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : 'AI 回复失败'
        // 如果当前使用的是外部服务且失败，尝试优雅降级到内置大模型
        if (activeEngineType === 'external' && !fallbackToBuiltin) {
          if (isLlmConfigured(settings.llm)) {
            toast.error(`外部多 Agent 服务异常 (${errMsg})，已为您自动切换到内置引擎重试`)
            setFallbackToBuiltin(true)
            try {
              accumulated = ''
              const builtinEngine = new BuiltinMockEngine(settings.llm)
              const fallbackReply = await builtinEngine.sendMessage(interviewContext, messages, (delta) => {
                accumulated += delta
                setStreamingText(accumulated)
              })
              appendMockMessage(session.id, { role: 'assistant', content: fallbackReply })
              setStreamingText('')
              return
            } catch (builtinErr) {
              toast.error(builtinErr instanceof Error ? builtinErr.message : '内置引擎重试亦失败')
            }
          } else {
            toast.error(`外部服务异常: ${errMsg}（未配置内置大模型 API，无法自动降级）`)
          }
        } else {
          toast.error(errMsg)
        }
      } finally {
        setLoading(false)
      }
    },
    [session, activeEngine, activeEngineType, fallbackToBuiltin, settings.llm, interviewContext, appendMockMessage],
  )

  useEffect(() => {
    if (!session || session.status !== 'active' || session.messages.length > 0 || openingRequested.current) return
    const isEngineReady = isLlmConfigured(settings.llm) || isMockServiceConfigured(settings)
    if (!isEngineReady) return

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
  }, [session, settings, appendMockMessage, requestAssistantReply])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages, streamingText])

  if (!session) {
    return <ErrorState title="模拟会话不存在" description="该会话可能已被删除。" />
  }

  const engineReady = isLlmConfigured(settings.llm) || isMockServiceConfigured(settings)
  if (!engineReady) {
    return (
      <ErrorState
        title="模拟面试引擎未配置"
        description="请先在设置中配置大模型 API 或外部模拟服务后再继续模拟。"
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
      const feedback = await activeEngine.generateFeedback(interviewContext, session.messages)
      completeMockSession(session.id, feedback)
      toast.success('模拟面试已结束')
    } catch (e) {
      // 尝试降级生成
      if (activeEngineType === 'external' && isLlmConfigured(settings.llm)) {
        try {
          toast.warning('外部服务反馈生成失败，正在使用内置模型兜底生成...')
          const builtinEngine = new BuiltinMockEngine(settings.llm)
          const fallbackFeedback = await builtinEngine.generateFeedback(interviewContext, session.messages)
          completeMockSession(session.id, fallbackFeedback)
          toast.success('模拟面试已结束（内置模型生成）')
          return
        } catch {
          // ignore
        }
      }
      toast.error(e instanceof Error ? e.message : '反馈生成失败')
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
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <Badge variant="outline">{MOCK_MODE_LABELS[session.mode]}</Badge>
              {session.roundHint && <Badge variant="secondary">{session.roundHint}</Badge>}
              {activeEngineType === 'external' ? (
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs font-normal">
                  ⚡ 外部多 Agent 驱动
                </Badge>
              ) : fallbackToBuiltin ? (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 text-xs font-normal">
                  ⚠️ 已自动降级为内置引擎
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs font-normal">
                  🤖 内置引擎
                </Badge>
              )}
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

          {loading && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border bg-muted/40 px-4 py-3 text-sm whitespace-pre-wrap">
                <p className="mb-1 text-xs font-medium opacity-70">面试官</p>
                {streamingText}
              </div>
            </div>
          )}

          {loading && !streamingText && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                面试官正在思考...
              </div>
            </div>
          )}

          {isCompleted && session.feedback && (
            <Card className="mt-6 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>面试总结与反馈</span>
                  <Badge variant="secondary">综合评分：{session.feedback.overallScore} / 5</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-foreground">总体评价</h4>
                  <p className="mt-1 text-muted-foreground">{session.feedback.summary}</p>
                </div>

                {session.feedback.strengths.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground">表现亮点</h4>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
                      {session.feedback.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {session.feedback.weaknesses.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground">待提升项</h4>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
                      {session.feedback.weaknesses.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {session.feedback.suggestedQuestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground">建议沉淀的面试题</h4>
                    <div className="mt-2 space-y-2">
                      {session.feedback.suggestedQuestions.map((q, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 rounded-md border bg-background p-2 text-xs"
                        >
                          <span className="font-medium">{q}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addQuestionToKnowledge(q)}
                          >
                            <BookOpen className="h-3.5 w-3.5 mr-1" />
                            入题库
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4 lg:px-6">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder={isCompleted ? '面试已结束' : '输入回答，按 Enter 发送，Shift+Enter 换行...'}
            disabled={loading || isCompleted}
            rows={2}
            className="resize-none"
          />
          <Button
            onClick={() => void handleSend()}
            disabled={!input.trim() || loading || isCompleted}
            className="h-10 shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
