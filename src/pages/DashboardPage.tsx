import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/useAppStore'
import type { AppState } from '@/store/useAppStore'
import {
  selectFunnel,
  selectKpis,
  selectRecentInterviews,
  selectReviewQueue,
  selectUpcomingInterviews,
} from '@/store/selectors'
import { buildLearningPriorities } from '@/store/analytics'
import { formatDateTime, formatTime, getGreeting, getUpcomingLabel } from '@/lib/date'
import { MASTERY_META } from '@/types'
import { UpcomingIndicator, urgencyCardClass } from '@/components/common/UpcomingIndicator'
import { getUrgency, isUpcomingSoon } from '@/lib/urgency'
import { cn } from '@/lib/utils'

const CHART_COLORS = ['hsl(232 60% 56%)', 'hsl(160 60% 45%)', 'hsl(45 90% 55%)', 'hsl(280 65% 60%)', 'hsl(0 72% 55%)', 'hsl(232 40% 70%)']

export function DashboardPage() {
  const jobs = useAppStore((s) => s.jobs)
  const interviews = useAppStore((s) => s.interviews)
  const companies = useAppStore((s) => s.companies)
  const reviews = useAppStore((s) => s.reviews)
  const questions = useAppStore((s) => s.questions)
  const knowledge = useAppStore((s) => s.knowledge)
  const userName = useAppStore((s) => s.settings.userName)

  const slice = useMemo(
    () => ({ jobs, interviews, companies, reviews, questions, knowledge } as AppState),
    [jobs, interviews, companies, reviews, questions, knowledge],
  )

  const kpis = useMemo(() => selectKpis(slice), [slice])
  const funnel = useMemo(() => selectFunnel(slice), [slice])
  const recent = useMemo(() => selectRecentInterviews(slice, 5), [slice])
  const upcoming = useMemo(() => selectUpcomingInterviews(slice), [slice])
  const priorities = useMemo(() => buildLearningPriorities(slice, 5), [slice])
  const reviewDueCount = useMemo(() => selectReviewQueue(slice).length, [slice])

  const groupedUpcoming = useMemo(() => {
    const groups: Record<string, typeof upcoming> = {}
    upcoming.forEach((i) => {
      const label = getUpcomingLabel(i.scheduledAt)
      if (!groups[label]) groups[label] = []
      groups[label].push(i)
    })
    return groups
  }, [upcoming])

  return (
    <div>
      <PageHeader
        title={`${getGreeting()} 👋`}
        description={`${userName}，你的求职进度一目了然`}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="已投递" value={kpis.applied} icon={Briefcase} />
        <StatCard label="面试中" value={kpis.interviewing} icon={Calendar} />
        <StatCard label="Offer" value={kpis.offer} icon={CheckCircle2} />
        <StatCard label="已结束" value={kpis.closed} icon={XCircle} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>最近面试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recent.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">暂无面试记录</p>
              ) : (
                recent.map((interview) => (
                  <div
                    key={interview.id}
                    className={cn(
                      'flex flex-col gap-3 rounded-lg border p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between',
                      urgencyCardClass(interview.scheduledAt, interview.status),
                    )}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{interview.company?.name}</p>
                        <UpcomingIndicator scheduledAt={interview.scheduledAt} status={interview.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{interview.job?.title}</p>
                      <p className="mt-1 text-sm">
                        {interview.round} · {formatDateTime(interview.scheduledAt)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={interview.status} />
                        {interview.interviewer && (
                          <span className="text-xs text-muted-foreground">面试官：{interview.interviewer}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/interviews/${interview.id}`}>查看详情</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>求职漏斗</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="label" width={70} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {funnel.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>即将到来的面试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcoming.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">暂无待面试安排</p>
              ) : (
                Object.entries(groupedUpcoming).map(([label, items]) => {
                  const groupUrgency = getUrgency(items[0].scheduledAt, items[0].status)
                  const highlightGroup = isUpcomingSoon(groupUrgency)
                  return (
                    <div key={label}>
                      <p
                        className={cn(
                          'mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide',
                          highlightGroup ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {label}
                      </p>
                      <div className="space-y-3">
                        {items.map((i) => (
                          <Link
                            key={i.id}
                            to={`/interviews/${i.id}`}
                            className={cn(
                              'block rounded-lg border p-3 transition-colors hover:border-primary/50 hover:bg-accent/50',
                              urgencyCardClass(i.scheduledAt, i.status),
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium tabular-nums">{formatTime(i.scheduledAt)}</p>
                              <UpcomingIndicator scheduledAt={i.scheduledAt} status={i.status} compact />
                            </div>
                            <p className="text-sm">{i.company?.name} · {i.job?.title}</p>
                            <p className="text-xs text-muted-foreground">{i.round}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                学习重点
                {reviewDueCount > 0 && (
                  <Link to="/knowledge?due=1">
                    <Badge variant="destructive">待复习 {reviewDueCount}</Badge>
                  </Link>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/insights">分析页</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {priorities.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无薄弱项，继续记录面试问题</p>
              ) : (
                priorities.map((p) => (
                  <Link
                    key={p.knowledgeId ?? p.title}
                    to={p.knowledgeId ? `/knowledge?focus=${p.knowledgeId}` : '/insights'}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                  >
                    <span className="truncate">{p.title}</span>
                    <Badge variant="outline" className={MASTERY_META[p.mastery].color}>
                      {MASTERY_META[p.mastery].emoji}
                    </Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
