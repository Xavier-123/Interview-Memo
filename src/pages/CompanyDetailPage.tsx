import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { JobStatusBadge } from '@/components/common/JobStatusBadge'
import { ErrorState } from '@/components/common/ErrorState'
import { StarRating } from '@/components/common/StarRating'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/useAppStore'
import { formatDateTime } from '@/lib/date'

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const company = useAppStore((s) => s.companies.find((c) => c.id === id))
  const allJobs = useAppStore((s) => s.jobs)
  const allInterviews = useAppStore((s) => s.interviews)
  const jobs = useMemo(() => (id ? allJobs.filter((j) => j.companyId === id) : []), [allJobs, id])
  const interviews = useMemo(() => {
    if (!id) return []
    const jobIds = new Set(allJobs.filter((j) => j.companyId === id).map((j) => j.id))
    return allInterviews
      .filter((i) => jobIds.has(i.jobId))
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  }, [allJobs, allInterviews, id])
  const [expandedJdId, setExpandedJdId] = useState<string | null>(null)

  if (!company) return <ErrorState title="公司不存在" />

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> 返回
      </Button>

      <PageHeader icon={Building2} title={company.name} description={`${company.industry} · ${company.location}`} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">公司评价</p>
            <StarRating value={Math.round(company.rating)} readonly />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">岗位数</p>
            <p className="text-2xl font-semibold">{jobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">技术方向</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {company.techDirections.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>备注</CardTitle></CardHeader>
        <CardContent><p className="text-sm whitespace-pre-wrap">{company.notes || '暂无备注'}</p></CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>岗位列表</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无岗位</p>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      <Link to={`/jobs/${j.id}`} className="hover:text-primary hover:underline">
                        {j.title}
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">{j.salaryText} · {j.location}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {j.jd.trim() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedJdId(expandedJdId === j.id ? null : j.id)}
                      >
                        {expandedJdId === j.id ? '收起 JD' : '查看 JD'}
                      </Button>
                    )}
                    <JobStatusBadge status={j.status} />
                  </div>
                </div>
                {expandedJdId === j.id && (
                  <p className="mt-3 whitespace-pre-wrap border-t pt-3 text-sm">{j.jd}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>面试时间线</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {interviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无面试</p>
          ) : (
            interviews.map((i) => {
              const job = allJobs.find((j) => j.id === i.jobId)
              return (
              <Link
                key={i.id}
                to={`/interviews/${i.id}`}
                className="flex items-center justify-between rounded-md border p-3 transition-all hover:border-primary/40 hover:bg-accent/30 hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium">{job?.title}</p>
                  <p className="text-xs text-muted-foreground">{i.round} · {formatDateTime(i.scheduledAt)}</p>
                </div>
                <StatusBadge status={i.status} />
              </Link>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
