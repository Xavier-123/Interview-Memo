import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { StarRating } from '@/components/common/StarRating'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
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
  const items = useMemo(
    () => selectCompletedInterviewsForReview({ interviews, jobs, companies, reviews } as AppState),
    [interviews, jobs, companies, reviews],
  )

  return (
    <div>
      <PageHeader title="面试复盘" description="结构化复盘，形成学习闭环" />
      <div className="space-y-2">
        {items.map((i) => (
          <Link
            key={i.id}
            to={`/interviews/${i.id}/review`}
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
          >
            <div>
              <p className="font-medium">{i.company?.name} · {i.job?.title}</p>
              <p className="text-sm text-muted-foreground">{i.round} · {formatDateTime(i.scheduledAt)}</p>
            </div>
            <span className="text-sm text-muted-foreground">{i.hasReview ? '✅ 已复盘' : '待复盘'}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
