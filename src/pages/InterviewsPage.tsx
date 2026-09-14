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
import { formatDateTime } from '@/lib/date'
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
                'flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between',
                urgencyCardClass(i.scheduledAt, i.status),
              )}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted-foreground">{formatDateTime(i.scheduledAt).split(' ')[0]}</p>
                  <UpcomingIndicator scheduledAt={i.scheduledAt} status={i.status} />
                </div>
                <p className="font-medium">{i.company?.name}</p>
                <p className="text-sm text-muted-foreground">{i.job?.title}</p>
                <p className="text-sm">{i.round}</p>
                <p className={i.resumeVersion ? 'text-sm text-primary' : 'text-sm text-destructive'}>简历：{formatResumeVersionLabel(resumeState, i.job?.resumeVersionId)}</p>
              </div>
              <div className="flex items-center gap-2">
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
