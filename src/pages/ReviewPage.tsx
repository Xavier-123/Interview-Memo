import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, CircleDashed, GraduationCap, NotebookPen } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StarRating } from '@/components/common/StarRating'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/store/useAppStore'
import type { AppState } from '@/store/useAppStore'
import {
  generateReviewSummary,
  resolveJobContext,
  selectCompletedInterviewsForReview,
  selectReviewForInterview,
  selectReviewQueue,
} from '@/store/selectors'
import { formatDateTime } from '@/lib/date'
import { JobJdCard } from '@/components/jobs/JobJdCard'

export function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const interview = useAppStore((s) => s.interviews.find((i) => i.id === id))
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const upsertReview = useAppStore((s) => s.upsertReview)
  const existingReview = useAppStore((s) => (id ? selectReviewForInterview(s, id) : undefined))
  const allQuestions = useAppStore((s) => s.questions)
  const weakQuestions = useMemo(
    () => (id ? allQuestions.filter((q) => q.interviewId === id && q.isWeak) : []),
    [allQuestions, id],
  )

  const { job, company } = useMemo(
    () => (interview ? resolveJobContext({ jobs, companies }, interview.jobId) : { job: undefined, company: undefined }),
    [interview, jobs, companies],
  )

  const [overall, setOverall] = useState(4)
  const [difficulty, setDifficulty] = useState(4)
  const [techMatch, setTechMatch] = useState(4)
  const [jobMatch, setJobMatch] = useState(4)
  const [wentWell, setWentWell] = useState('')
  const [toImprove, setToImprove] = useState('')
  const [interviewerFocus, setInterviewerFocus] = useState('')
  const [frequentQuestions, setFrequentQuestions] = useState('')
  const [nextPrep, setNextPrep] = useState('')
  const [summary, setSummary] = useState('')
  const [summaryEdited, setSummaryEdited] = useState(false)

  useEffect(() => {
    if (existingReview) {
      setOverall(existingReview.overall)
      setDifficulty(existingReview.difficulty)
      setTechMatch(existingReview.techMatch)
      setJobMatch(existingReview.jobMatch)
      setWentWell(existingReview.wentWell)
      setToImprove(existingReview.toImprove)
      setInterviewerFocus(existingReview.interviewerFocus)
      setFrequentQuestions(existingReview.frequentQuestions)
      setNextPrep(existingReview.nextPrep)
      setSummary(existingReview.summary)
      setSummaryEdited(true)
    }
  }, [existingReview])

  useEffect(() => {
    if (!summaryEdited && interview) {
      const auto = generateReviewSummary(
        { overall, toImprove, nextPrep },
        weakQuestions,
        interview.learningItems,
      )
      setSummary(auto)
    }
  }, [overall, toImprove, nextPrep, weakQuestions, interview, summaryEdited])

  if (!interview || !job) {
    return <ErrorState title="面试不存在" />
  }

  const handleSave = () => {
    upsertReview(interview.id, {
      overall,
      difficulty,
      techMatch,
      jobMatch,
      wentWell,
      toImprove,
      interviewerFocus,
      frequentQuestions,
      nextPrep,
      summary,
    })
    toast.success('复盘已保存')
  }

  return (
    <div>
      <PageHeader
        icon={NotebookPen}
        title="面试复盘"
        description={`${company?.name} · ${job.title} · ${interview.round} · ${formatDateTime(interview.scheduledAt)}`}
        actions={
          <>
            <Button variant="outline" asChild><Link to={`/interviews/${interview.id}`}>面试详情</Link></Button>
            <Button onClick={handleSave}>保存复盘</Button>
          </>
        }
      />

      <JobJdCard jd={job.jd} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: '本次面试总体评价', value: overall, set: setOverall },
          { label: '面试难度', value: difficulty, set: setDifficulty },
          { label: '技术匹配度', value: techMatch, set: setTechMatch },
          { label: '岗位匹配度', value: jobMatch, set: setJobMatch },
        ].map(({ label, value, set }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="mb-2 text-sm text-muted-foreground">{label}</p>
              <StarRating value={value} onChange={set} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>面试表现</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {[
            { label: '做得好的地方', value: wentWell, set: setWentWell },
            { label: '需要改进的地方', value: toImprove, set: setToImprove },
            { label: '面试官重点关注', value: interviewerFocus, set: setInterviewerFocus },
            { label: '高频技术问题', value: frequentQuestions, set: setFrequentQuestions },
            { label: '下次面试需要重点准备', value: nextPrep, set: setNextPrep },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-2">
              <Label>{label}</Label>
              <Textarea value={value} onChange={(e) => set(e.target.value)} rows={3} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>本次面试学习总结</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={summary}
            onChange={(e) => { setSummary(e.target.value); setSummaryEdited(true) }}
            rows={6}
            className="font-mono text-sm"
          />
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setSummaryEdited(false)}>
            重新自动生成
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function ReviewListPage() {
  const interviews = useAppStore((s) => s.interviews)
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const reviews = useAppStore((s) => s.reviews)
  const knowledge = useAppStore((s) => s.knowledge)
  const items = useMemo(
    () => selectCompletedInterviewsForReview({ interviews, jobs, companies, reviews } as AppState),
    [interviews, jobs, companies, reviews],
  )
  const dueItems = useMemo(
    () => selectReviewQueue({ knowledge } as unknown as AppState),
    [knowledge],
  )
  const pendingCount = items.filter((i) => !i.hasReview).length
  const reviewedCount = items.length - pendingCount

  return (
    <div>
      <PageHeader icon={NotebookPen} title="面试复盘" description="结构化复盘，形成学习闭环" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">待复盘</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">已复盘</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{reviewedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">待复习题目</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{dueItems.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {items.map((i) => (
          <Link
            key={i.id}
            to={`/interviews/${i.id}/review`}
            className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-all hover:border-primary/40 hover:bg-accent/30 hover:shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{i.company?.name} · {i.job?.title}</p>
              <p className="text-sm text-muted-foreground">{i.round} · {formatDateTime(i.scheduledAt)}</p>
            </div>
            {i.hasReview ? (
              <Badge
                variant="outline"
                className="shrink-0 gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              >
                <CheckCircle2 className="h-3 w-3" /> 已复盘
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="shrink-0 gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400"
              >
                <CircleDashed className="h-3 w-3" /> 待复盘
              </Badge>
            )}
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            艾宾浩斯复习队列
          </CardTitle>
          <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:text-foreground" asChild>
            <Link to="/knowledge?due=1">去复习</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {dueItems.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">暂无到期待复习的题目，保持节奏 ✨</p>
          ) : (
            <>
              {dueItems.slice(0, 6).map((k) => (
                <Link
                  key={k.id}
                  to={`/knowledge?focus=${k.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm transition-all hover:border-border hover:bg-accent/40"
                >
                  <span className="truncate font-medium text-foreground/90">{k.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{k.category} / {k.subcategory}</span>
                </Link>
              ))}
              {dueItems.length > 6 && (
                <p className="text-xs text-muted-foreground">还有 {dueItems.length - 6} 道待复习题目，见题库</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
