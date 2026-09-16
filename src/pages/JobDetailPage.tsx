import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bot, Briefcase, Calendar, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { JobStatusBadge } from '@/components/common/JobStatusBadge'
import { ErrorState } from '@/components/common/ErrorState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { JobFormDialog } from '@/components/jobs/JobFormDialog'
import { JobJdCard } from '@/components/jobs/JobJdCard'
import { InterviewFormDialog } from '@/components/interviews/InterviewFormDialog'
import { UpcomingIndicator } from '@/components/common/UpcomingIndicator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/store/useAppStore'
import type { AppState } from '@/store/useAppStore'
import { formatResumeVersionLabel, resolveJobContext, selectJobInterviews } from '@/store/selectors'
import type { JobPriority } from '@/types'
import { formatDate, formatDateTime } from '@/lib/date'

const priorityLabels: Record<JobPriority, string> = { high: '高', medium: '中', low: '低' }

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const job = useAppStore((s) => s.jobs.find((j) => j.id === id))
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const interviews = useAppStore((s) => s.interviews)
  const reviews = useAppStore((s) => s.reviews)
  const removeJob = useAppStore((s) => s.removeJob)
  const resumes = useAppStore((s) => s.resumes)
  const resumeVersions = useAppStore((s) => s.resumeVersions)
  const resumeState = { resumes, resumeVersions }

  const [editOpen, setEditOpen] = useState(false)
  const [interviewOpen, setInterviewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { company } = useMemo(
    () => (job ? resolveJobContext({ jobs, companies }, job.id) : { job: undefined, company: undefined }),
    [job, jobs, companies],
  )

  const jobInterviews = useMemo(() => {
    if (!id) return []
    return selectJobInterviews({ jobs, companies, interviews, reviews } as AppState, id)
  }, [id, jobs, companies, interviews, reviews])

  if (!job) {
    return <ErrorState title="岗位不存在" />
  }

  const handleDelete = () => {
    removeJob(job.id)
    toast.success('岗位已删除')
    navigate('/jobs')
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> 返回
      </Button>

      <PageHeader
        icon={Briefcase}
        title={job.title}
        description={`${company?.name ?? '未知公司'} · ${job.location}${job.salaryText ? ` · ${job.salaryText}` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setInterviewOpen(true)}>
              <Plus className="h-4 w-4" /> 新增面试
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/mock?jobId=${job.id}&mode=full&start=1`)}
            >
              <Bot className="h-4 w-4" /> 模拟面试
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> 编辑
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> 删除
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {company && (
          <Link to={`/companies/${company.id}`} className="text-sm text-primary hover:underline">
            {company.name}
          </Link>
        )}
        <JobStatusBadge status={job.status} closeReason={job.closeReason} />
        <Badge variant="outline">{job.jobType}</Badge>
        <Badge variant="outline">优先级 {priorityLabels[job.priority]}</Badge>
        <Badge variant={job.resumeVersionId ? 'secondary' : 'destructive'}>{formatResumeVersionLabel(resumeState, job.resumeVersionId)}</Badge>
        {job.resumeVersionId && <Link to={`/resumes/${resumeState.resumeVersions.find((v) => v.id === job.resumeVersionId)?.resumeId ?? ''}`} className="text-sm text-primary hover:underline">查看简历</Link>}
        {job.source && <Badge variant="outline">来源 {job.source}</Badge>}
        {job.appliedAt && <Badge variant="outline">投递 {formatDate(job.appliedAt)}</Badge>}
        {job.tags.map((t) => (
          <Badge key={t} variant="outline">#{t}</Badge>
        ))}
      </div>

      {job.description && (
        <Card className="mb-6">
          <CardHeader><CardTitle>岗位简介</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{job.description}</p>
          </CardContent>
        </Card>
      )}

      <JobJdCard jd={job.jd} defaultOpen />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> 面试时间线
          </CardTitle>
          <Badge variant="secondary">{jobInterviews.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobInterviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无面试记录</p>
          ) : (
            jobInterviews.map((iv) => (
              <Link
                key={iv.id}
                to={`/interviews/${iv.id}`}
                className="flex flex-col gap-2 rounded-md border p-3 transition-colors hover:border-primary/40 hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{iv.round}</p>
                    <UpcomingIndicator scheduledAt={iv.scheduledAt} status={iv.status} compact />
                    {iv.hasReview && <Badge variant="secondary">已复盘</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDateTime(iv.scheduledAt)} · {iv.mode}</p>
                </div>
                <StatusBadge status={iv.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <JobFormDialog open={editOpen} onOpenChange={setEditOpen} job={job} />
      <InterviewFormDialog open={interviewOpen} onOpenChange={setInterviewOpen} defaultJobId={job.id} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除岗位"
        description="将级联删除其下的面试、题目和复盘，此操作不可撤销。"
        destructive
        confirmLabel="删除"
        onConfirm={handleDelete}
      />
    </div>
  )
}
