import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { InterviewFormDialog } from '@/components/interviews/InterviewFormDialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppStore } from '@/store/useAppStore'
import type { AppState } from '@/store/useAppStore'
import { enrichInterviews } from '@/store/selectors'
import { INTERVIEW_STATUS_META } from '@/types'
import { cn } from '@/lib/utils'
import { LiveDot, UpcomingIndicator } from '@/components/common/UpcomingIndicator'
import { getUrgency, isUpcomingSoon, URGENCY_META } from '@/lib/urgency'
import { isToday } from 'date-fns'

type ViewMode = 'month' | 'week' | 'day'

export function CalendarPage() {
  const interviews = useAppStore((s) => s.interviews)
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const reviews = useAppStore((s) => s.reviews)
  const settings = useAppStore((s) => s.settings)
  const enriched = useMemo(
    () => enrichInterviews({ interviews, jobs, companies, reviews } as AppState, interviews),
    [interviews, jobs, companies, reviews],
  )
  const [view, setView] = useState<ViewMode>('month')
  const [current, setCurrent] = useState(new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [defaultDate, setDefaultDate] = useState('')

  const getEventsForDay = (day: Date) =>
    enriched.filter((i) => isSameDay(parseISO(i.scheduledAt), day))

  const navigate = (dir: -1 | 1) => {
    if (view === 'month') setCurrent(dir === 1 ? addMonths(current, 1) : subMonths(current, 1))
    else if (view === 'week') setCurrent(dir === 1 ? addWeeks(current, 1) : subWeeks(current, 1))
    else setCurrent(dir === 1 ? addDays(current, 1) : addDays(current, -1))
  }

  const openNew = (day: Date) => {
    const d = new Date(day)
    d.setHours(14, 0, 0, 0)
    setDefaultDate(format(d, "yyyy-MM-dd'T'HH:mm"))
    setFormOpen(true)
  }

  const weekStartsOn = settings.weekStartsOn

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(current), { weekStartsOn })
    const end = endOfWeek(endOfMonth(current), { weekStartsOn })
    return eachDayOfInterval({ start, end })
  }, [current, weekStartsOn])

  const weekDays = useMemo(() => {
    const start = startOfWeek(current, { weekStartsOn })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [current, weekStartsOn])

  return (
    <div>
      <PageHeader title="面试日历" description="Month / Week / Day 视图" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrent(new Date())}>今天</Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          <span className="ml-2 text-sm font-medium">
            {format(current, view === 'day' ? 'yyyy年M月d日 EEEE' : 'yyyy年M月', { locale: zhCN })}
          </span>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="month">月</TabsTrigger>
            <TabsTrigger value="week">周</TabsTrigger>
            <TabsTrigger value="day">日</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'month' && (
        <div className="rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const events = getEventsForDay(day)
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'group min-h-24 border-b border-r p-1 transition-colors hover:bg-accent/30',
                    !isSameMonth(day, current) && 'bg-muted/20 text-muted-foreground',
                    isToday(day) && 'bg-primary/[0.04] dark:bg-primary/[0.08]',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium tabular-nums',
                        isToday(day) && 'bg-primary text-primary-foreground',
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => openNew(day)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="mt-1 space-y-1">
                    {events.slice(0, 2).map((e) => (
                      <EventChip key={e.id} event={e} />
                    ))}
                    {events.length > 2 && <p className="text-[10px] text-muted-foreground">+{events.length - 2} 更多</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn('rounded-lg border p-2', isToday(day) && 'border-primary/60 bg-primary/[0.04] dark:bg-primary/[0.08]')}
            >
              <p className={cn('mb-2 text-xs font-medium', isToday(day) && 'text-primary')}>
                {format(day, 'M/d EEE', { locale: zhCN })}
                {isToday(day) && ' · 今天'}
              </p>
              {getEventsForDay(day).map((e) => <EventChip key={e.id} event={e} />)}
              <Button variant="ghost" size="sm" className="mt-1 w-full text-xs" onClick={() => openNew(day)}>
                <Plus className="h-3 w-3" /> 添加
              </Button>
            </div>
          ))}
        </div>
      )}

      {view === 'day' && (
        <div className="rounded-lg border p-4">
          {getEventsForDay(current).length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">当天暂无面试</p>
              <Button className="mt-4" onClick={() => openNew(current)}><Plus className="h-4 w-4" /> 新增面试</Button>
            </div>
          ) : (
            getEventsForDay(current).map((e) => (
              <Link
                key={e.id}
                to={`/interviews/${e.id}`}
                className={cn(
                  'mb-3 block rounded-lg border p-4 transition-colors hover:bg-accent/50',
                  URGENCY_META[getUrgency(e.scheduledAt, e.status)].card,
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{format(parseISO(e.scheduledAt), 'HH:mm')} · {e.company?.name}</p>
                  <UpcomingIndicator scheduledAt={e.scheduledAt} status={e.status} />
                </div>
                <p className="text-sm text-muted-foreground">{e.job?.title} · {e.round}</p>
              </Link>
            ))
          )}
        </div>
      )}

      <InterviewFormDialog open={formOpen} onOpenChange={setFormOpen} defaultDate={defaultDate} />
    </div>
  )
}

function EventChip({
  event,
}: {
  event: {
    id: string
    scheduledAt: string
    round: string
    status: keyof typeof INTERVIEW_STATUS_META
    company?: { name: string }
    job?: { title: string }
    interviewer: string
  }
}) {
  const meta = INTERVIEW_STATUS_META[event.status]
  const urgency = getUrgency(event.scheduledAt, event.status)
  const soon = isUpcomingSoon(urgency)
  const urgencyMeta = URGENCY_META[urgency]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={`/interviews/${event.id}`}
          className={cn(
            'block rounded border bg-card px-1.5 py-1 text-[10px] leading-tight transition-shadow hover:shadow-sm',
            soon && urgencyMeta.card,
            urgency === 'today' && 'border-primary/40',
          )}
        >
          <div className="flex items-center gap-1">
            {soon ? (
              <LiveDot urgency={urgency} className="h-1.5 w-1.5 [&>span]:h-1.5 [&>span]:w-1.5" />
            ) : (
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />
            )}
            <span className={cn('tabular-nums', soon && cn('font-medium', urgencyMeta.text))}>
              {format(parseISO(event.scheduledAt), 'HH:mm')}
            </span>
          </div>
          <p className="truncate font-medium">{event.company?.name}</p>
          <p className="truncate text-muted-foreground">{event.round}</p>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{event.job?.title}</p>
        <p className="text-xs text-muted-foreground">面试官：{event.interviewer || '—'}</p>
      </TooltipContent>
    </Tooltip>
  )
}
