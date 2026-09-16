import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  CalendarClock,
  ClipboardList,
  Filter,
  GraduationCap,
  History,
  LayoutDashboard,
  Trophy,
  XCircle,
} from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ChartTooltip } from '@/components/common/ChartTooltip'
import { EmptyState } from '@/components/common/EmptyState'
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
import { chartColor } from '@/lib/chart-colors'
import { MASTERY_META } from '@/types'
import { UpcomingIndicator, urgencyCardClass } from '@/components/common/UpcomingIndicator'
import { getUrgency, isUpcomingSoon } from '@/lib/urgency'
import { cn } from '@/lib/utils'

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
        icon={LayoutDashboard}
        title={getGreeting()}
        description={`${userName ? `${userName}，` : ''}你的求职进度一目了然`}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="已投递" value={kpis.applied} icon={Briefcase} tone="primary" to="/jobs" />
        <StatCard label="面试中" value={kpis.interviewing} icon={CalendarClock} tone="info" to="/interviews?status=scheduled" />
        <StatCard label="Offer" value={kpis.offer} icon={Trophy} tone="success" to="/jobs" />
        <StatCard label="已结束" value={kpis.closed} icon={XCircle} tone="muted" to="/jobs" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                最近面试
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recent.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="暂无面试记录"
                  description="创建第一场面试后，这里会展示最近的动态"
                />
              ) : (
                recent.map((interview) => (
                  <div
                    key={interview.id}
                    className={cn(
                      'flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition-all hover:border-border hover:bg-accent/20 hover:shadow-xs sm:flex-row sm:items-center sm:justify-between',
                      urgencyCardClass(interview.scheduledAt, interview.status),
                    )}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{interview.company?.name}</p>
                        <UpcomingIndicator scheduledAt={interview.scheduledAt} status={interview.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{interview.job?.title}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/85">{interview.round}</span> · {formatDateTime(interview.scheduledAt)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={interview.status} />
                        {interview.interviewer && (
                          <span className="text-[11px] text-muted-foreground/80">面试官：{interview.interviewer}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg font-normal hover:border-primary/40" asChild>
                      <Link to={`/interviews/${interview.id}`}>查看详情</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                求职漏斗
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={76}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    />
                    <Tooltip
                      content={<ChartTooltip valueFormatter={(v) => `${v} 个`} />}
                      cursor={{ fill: 'var(--muted)', fillOpacity: 0.5 }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                      {funnel.map((_, index) => (
                        <Cell key={index} fill={chartColor(index)} />
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
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                即将到来的面试
              </CardTitle>
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
                          'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider',
                          highlightGroup ? 'text-foreground' : 'text-muted-foreground/80',
                        )}
                      >
                        {label}
                      </p>
                      <div className="space-y-2.5">
                        {items.map((i) => (
                          <Link
                            key={i.id}
                            to={`/interviews/${i.id}`}
                            className={cn(
                              'group block rounded-xl border border-border/60 bg-card/60 p-3.5 transition-all hover:border-primary/40 hover:bg-accent/30 hover:shadow-xs',
                              urgencyCardClass(i.scheduledAt, i.status),
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold tabular-nums tracking-tight text-foreground">{formatTime(i.scheduledAt)}</p>
                              <UpcomingIndicator scheduledAt={i.scheduledAt} status={i.status} compact />
                            </div>
                            <p className="mt-1 text-sm font-medium text-foreground/90">{i.company?.name} · {i.job?.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{i.round}</p>
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
                <GraduationCap className="h-4 w-4 text-primary" />
                学习重点
                {reviewDueCount > 0 && (
                  <Link to="/knowledge?due=1">
                    <Badge className="rounded-full bg-warning px-2 text-[11px] text-warning-foreground hover:bg-warning/90">待复习 {reviewDueCount}</Badge>
                  </Link>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:text-foreground" asChild>
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
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm transition-all hover:border-border hover:bg-accent/40"
                  >
                    <span className="truncate font-medium text-foreground/90">{p.title}</span>
                    <Badge variant="outline" className={cn('gap-1.5 rounded-full border-border/60 font-normal', MASTERY_META[p.mastery].color)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', MASTERY_META[p.mastery].dot)} />
                      {MASTERY_META[p.mastery].label}
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
