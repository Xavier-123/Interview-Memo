import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { InterviewFormDialog } from '@/components/interviews/InterviewFormDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/useAppStore'
import type { AppState } from '@/store/useAppStore'
import { enrichInterviews, formatResumeVersionLabel } from '@/store/selectors'
import { formatDate, formatDateTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import { UpcomingIndicator, urgencyCardClass } from '@/components/common/UpcomingIndicator'
import { INTERVIEW_ROUNDS, INTERVIEW_STATUS_META, type Interview, type InterviewStatus } from '@/types'

export function InterviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const companies = useAppStore((s) => s.companies)
  const interviews = useAppStore((s) => s.interviews)
  const jobs = useAppStore((s) => s.jobs)
  const reviews = useAppStore((s) => s.reviews)
  const resumes = useAppStore((s) => s.resumes)
  const resumeVersions = useAppStore((s) => s.resumeVersions)
  const resumeState = { resumes, resumeVersions }
  const baseEnriched = useMemo(
    () => enrichInterviews({ interviews, jobs, companies, reviews, resumes, resumeVersions } as AppState, interviews),
    [interviews, jobs, companies, reviews, resumes, resumeVersions],
  )
  const [companyFilter, setCompanyFilter] = useState('all')
  const [roundFilter, setRoundFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Interview | null>(null)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormOpen(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  // 支持从总览统计卡等入口带状态过滤跳转（如 /interviews?status=scheduled）
  useEffect(() => {
    const status = searchParams.get('status')
    if (status && status !== 'all') {
      setStatusFilter(status)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const enriched = useMemo(() => {
    return baseEnriched
      .filter((i) => {
        if (companyFilter !== 'all' && i.company?.id !== companyFilter) return false
        if (roundFilter !== 'all' && i.round !== roundFilter) return false
        if (statusFilter !== 'all' && i.status !== statusFilter) return false
        return true
      })
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  }, [baseEnriched, companyFilter, roundFilter, statusFilter])

  return (
    <div>
      <PageHeader
        icon={ClipboardList}
        title="面试管理"
        description="所有面试记录，按时间排序"
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4" /> 新增面试
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="公司" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部公司</SelectItem>
            {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={roundFilter} onValueChange={setRoundFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="轮次" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部轮次</SelectItem>
            {INTERVIEW_ROUNDS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {(Object.keys(INTERVIEW_STATUS_META) as InterviewStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{INTERVIEW_STATUS_META[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {enriched.length === 0 ? (
        <EmptyState icon={ClipboardList} title="暂无面试" actionLabel="新增面试" onAction={() => setFormOpen(true)} />
      ) : (
        <div className="space-y-2">
          {enriched.map((i) => (
            <Link
              key={i.id}
              to={`/interviews/${i.id}`}
              className={cn(
                'flex flex-col gap-3 rounded-lg border p-4 transition-all hover:border-primary/40 hover:bg-accent/30 hover:shadow-sm sm:flex-row sm:items-center sm:gap-4',
                urgencyCardClass(i.scheduledAt, i.status),
              )}
            >
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center self-start rounded-lg bg-muted/70">
                <span className="text-lg font-semibold leading-none tabular-nums">
                  {formatDate(i.scheduledAt, 'dd')}
                </span>
                <span className="mt-1 text-[11px] text-muted-foreground">
                  {formatDate(i.scheduledAt, 'EEE')}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{i.company?.name}</p>
                  <Badge variant="secondary" className="font-normal">{i.round}</Badge>
                  <UpcomingIndicator scheduledAt={i.scheduledAt} status={i.status} />
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {i.job?.title} · {formatDateTime(i.scheduledAt)}
                </p>
                <p className={cn('mt-1 text-xs', i.resumeVersion ? 'text-muted-foreground/80' : 'text-amber-600 dark:text-amber-400')}>
                  简历：{formatResumeVersionLabel(resumeState, i.job?.resumeVersionId)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {i.hasReview && <Badge variant="secondary">已复盘</Badge>}
                <StatusBadge status={i.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <InterviewFormDialog open={formOpen} onOpenChange={setFormOpen} interview={editing} />
    </div>
  )
}
