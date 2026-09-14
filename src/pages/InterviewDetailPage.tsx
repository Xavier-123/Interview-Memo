import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Plus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { StarRating } from '@/components/common/StarRating'
import { TagChip } from '@/components/common/TagInput'
import { ErrorState } from '@/components/common/ErrorState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { InterviewFormDialog } from '@/components/interviews/InterviewFormDialog'
import { QuestionFormDialog } from '@/components/interviews/QuestionFormDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { MergeToKnowledgeDialog } from '@/components/interviews/MergeToKnowledgeDialog'
import { JobJdCard } from '@/components/jobs/JobJdCard'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Link2, Unlink } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatResumeVersionLabel, resolveJobContext } from '@/store/selectors'
import { formatDateTime } from '@/lib/date'
import type { Question } from '@/types'

export function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const interview = useAppStore((s) => s.interviews.find((i) => i.id === id))
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const knowledge = useAppStore((s) => s.knowledge)
  const resumes = useAppStore((s) => s.resumes)
  const resumeVersions = useAppStore((s) => s.resumeVersions)
  const resumeState = { resumes, resumeVersions }
  const removeInterview = useAppStore((s) => s.removeInterview)
  const removeQuestion = useAppStore((s) => s.removeQuestion)
  const markQuestionWeak = useAppStore((s) => s.markQuestionWeak)
  const promoteQuestionToKnowledge = useAppStore((s) => s.promoteQuestionToKnowledge)
  const unlinkQuestionFromKnowledge = useAppStore((s) => s.unlinkQuestionFromKnowledge)
  const addLearningItem = useAppStore((s) => s.addLearningItem)
  const toggleLearningItem = useAppStore((s) => s.toggleLearningItem)
  const removeLearningItem = useAppStore((s) => s.removeLearningItem)
  const allQuestions = useAppStore((s) => s.questions)
  const questions = useMemo(
    () => (id ? allQuestions.filter((q) => q.interviewId === id).sort((a, b) => a.order - b.order) : []),
    [allQuestions, id],
  )
  const weakQuestions = useMemo(() => questions.filter((q) => q.isWeak), [questions])

  const { job, company } = useMemo(
    () => (interview ? resolveJobContext({ jobs, companies }, interview.jobId) : { job: undefined, company: undefined }),
    [interview, jobs, companies],
  )

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [questionFormOpen, setQuestionFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [mergeQuestionId, setMergeQuestionId] = useState<string | null>(null)
  const [newLearning, setNewLearning] = useState('')

  if (!interview || !job) {
    return <ErrorState title="面试不存在" />
  }

  const openQuestionForm = (q?: Question) => {
    setEditingQuestion(q ?? null)
    setQuestionFormOpen(true)
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> 返回
      </Button>

      <PageHeader
        title={company?.name ?? ''}
        description={`${job.title} · ${interview.round} · ${formatDateTime(interview.scheduledAt)}`}
        actions={
          <>
            <StatusBadge status={interview.status} />
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>编辑</Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/interviews/${interview.id}/review`}>去复盘</Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>删除</Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><span className="text-muted-foreground">公司：</span>{company?.name}</div>
          <div><span className="text-muted-foreground">岗位：</span>{job.title}</div>
          <div><span className="text-muted-foreground">轮次：</span>{interview.round}</div>
          <div><span className="text-muted-foreground">时间：</span>{formatDateTime(interview.scheduledAt)}</div>
          <div><span className="text-muted-foreground">方式：</span>{interview.mode}</div>
          <div><span className="text-muted-foreground">面试官：</span>{interview.interviewer || '—'}</div>
          <div><span className="text-muted-foreground">投递简历：</span>{interview.jobId ? <Link to={job.resumeVersionId && resumeState.resumeVersions.some((v) => v.id === job.resumeVersionId) ? `/resumes/${resumeState.resumeVersions.find((v) => v.id === job.resumeVersionId)?.resumeId ?? ''}` : '/resumes'} className={job.resumeVersionId && resumeState.resumeVersions.some((v) => v.id === job.resumeVersionId) ? 'text-primary hover:underline' : 'text-destructive'}>{formatResumeVersionLabel(resumeState, job.resumeVersionId)}</Link> : '未关联简历'}</div>
        </CardContent>
      </Card>

      <JobJdCard jd={job.jd} />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">面试问题</h2>
        <Button size="sm" onClick={() => openQuestionForm()}><Plus className="h-4 w-4" /> 添加问题</Button>
      </div>

      <div className="mb-8 space-y-4">
        {questions.map((q, idx) => {
          const kItem = q.knowledgeId ? knowledge.find((k) => k.id === q.knowledgeId) : undefined
          return (
          <Card key={q.id}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">Q{idx + 1} {q.question}</p>
                  {kItem && (
                    <Link to={`/knowledge?focus=${kItem.id}`} className="mt-1 inline-block">
                      <Badge variant="secondary" className="text-xs">
                        题库 · 出现 {kItem.appearCount} 次
                        {q.archiveMethod ? ` · ${q.archiveMethod}` : ''}
                      </Badge>
                    </Link>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setMergeQuestionId(q.id)}>
                        <Link2 className="mr-2 h-4 w-4" /> 合并到已有题
                      </DropdownMenuItem>
                      {q.knowledgeId && (
                        <DropdownMenuItem onClick={() => { unlinkQuestionFromKnowledge(q.id); toast.success('已解除关联') }}>
                          <Unlink className="mr-2 h-4 w-4" /> 解除题库关联
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openQuestionForm(q)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { removeQuestion(q.id); toast.success('已删除') }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div><p className="text-muted-foreground">我的回答：</p><p className="whitespace-pre-wrap">{q.myAnswer || '—'}</p></div>
                <div><p className="text-muted-foreground">面试官反馈：</p><p className="whitespace-pre-wrap">{q.feedback || '—'}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StarRating value={q.rating} readonly />
                <div className="flex flex-wrap gap-1">{q.tags.map((t) => <TagChip key={t} tag={t} />)}</div>
                <Button
                  variant={q.isWeak ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => markQuestionWeak(q.id, !q.isWeak)}
                >
                  {q.isWeak ? '已标记没答好' : '标记没答好'}
                </Button>
                {q.isWeak && (
                  <Button variant="secondary" size="sm" onClick={() => { promoteQuestionToKnowledge(q.id); toast.success('已加入题库') }}>
                    <BookOpen className="h-4 w-4" /> 加入题库
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      {weakQuestions.length > 0 && (
        <Card className="mb-8 border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader><CardTitle className="text-red-700 dark:text-red-400">❌ 没答好的问题</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {weakQuestions.map((q) => (
              <div key={q.id} className="rounded-md border border-red-200 bg-background p-4 dark:border-red-900">
                <p className="font-medium">Q：{q.question}</p>
                <p className="mt-2 text-sm"><span className="text-muted-foreground">我的回答：</span>{q.myAnswer}</p>
                <p className="mt-2 text-sm"><span className="text-muted-foreground">正确理解：</span>{q.idealAnswer}</p>
                <p className="mt-2 text-sm"><span className="text-muted-foreground">需要补充：</span>{q.tags.join(' / ')}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>待学习知识</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {interview.learningItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <Checkbox checked={item.done} onCheckedChange={() => toggleLearningItem(interview.id, item.id)} />
              <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.text}</span>
              <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => removeLearningItem(interview.id, item.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="添加待学习项..."
              value={newLearning}
              onChange={(e) => setNewLearning(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newLearning.trim()) {
                  addLearningItem(interview.id, newLearning.trim())
                  setNewLearning('')
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                if (newLearning.trim()) {
                  addLearningItem(interview.id, newLearning.trim())
                  setNewLearning('')
                }
              }}
            >
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      <InterviewFormDialog open={editOpen} onOpenChange={setEditOpen} interview={interview} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除面试"
        description="确定删除此面试记录？"
        destructive
        onConfirm={() => { removeInterview(interview.id); toast.success('已删除'); navigate('/interviews') }}
      />

      <QuestionFormDialog
        open={questionFormOpen}
        onOpenChange={setQuestionFormOpen}
        interviewId={interview.id}
        questionCount={questions.length}
        question={editingQuestion}
        onMergeRequest={setMergeQuestionId}
      />

      {mergeQuestionId && (
        <MergeToKnowledgeDialog
          open={!!mergeQuestionId}
          onOpenChange={(open) => !open && setMergeQuestionId(null)}
          questionId={mergeQuestionId}
        />
      )}
    </div>
  )
}
