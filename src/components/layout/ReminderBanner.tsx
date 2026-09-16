import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UpcomingIndicator } from '@/components/common/UpcomingIndicator'
import { getCountdownLabel } from '@/lib/urgency'
import { useAppStore } from '@/store/useAppStore'
import type { AppState } from '@/store/useAppStore'
import { selectUpcomingInterviews24h } from '@/store/selectors'
import { cn } from '@/lib/utils'

const DISMISS_KEY = 'interview-memo:banner-dismissed'
/** 最近一场 ≤ 1 小时视为临期，横幅与该场标签升级为强提示样式 */
const IMMINENT_MINUTES = 60

export function ReminderBanner() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1')
  const [now, setNow] = useState(() => Date.now())
  const interviews = useAppStore((s) => s.interviews)
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const reviews = useAppStore((s) => s.reviews)

  const upcoming = useMemo(
    () => selectUpcomingInterviews24h({ interviews, jobs, companies, reviews } as AppState),
    [interviews, jobs, companies, reviews],
  )

  // 每 30s 重算一次倒计时，避免页面静置时「1 小时后」文案陈旧
  useEffect(() => {
    if (upcoming.length === 0) return
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [upcoming.length])

  if (dismissed || upcoming.length === 0) return null

  const nearest = upcoming[0]
  const minutesToNearest = Math.round((new Date(nearest.scheduledAt).getTime() - now) / 60_000)
  const imminent = minutesToNearest <= IMMINENT_MINUTES
  const nearestLabel = getCountdownLabel(nearest.scheduledAt, new Date(now))
  const headline = imminent
    ? minutesToNearest > 0
      ? `${nearestLabel}面试：${nearest.company?.name ?? ''} · ${nearest.round}`
      : `面试进行中：${nearest.company?.name ?? ''} · ${nearest.round}`
    : `24 小时内你有 ${upcoming.length} 场面试`

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div
      className={cn(
        'px-4 py-2',
        imminent
          ? 'border-b border-primary/30 bg-primary/10 dark:bg-primary/[0.18]'
          : 'border-b border-primary/20 bg-primary/[0.06] dark:bg-primary/[0.1]',
      )}
    >
      <div className="flex items-start gap-3">
        <Bell className={cn('mt-0.5 h-4 w-4 shrink-0 text-primary', imminent && 'motion-safe:animate-pulse')} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium', imminent && 'text-primary dark:text-primary')}>{headline}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {upcoming.map((i) => {
              const isNearest = i.id === nearest.id
              const highlight = isNearest && imminent
              return (
                <Link
                  key={i.id}
                  to={`/interviews/${i.id}`}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md border bg-background/80 px-2.5 py-1 text-xs transition-colors hover:border-primary/40',
                    highlight && 'border-primary/50 motion-safe:animate-[imminent-glow_2s_ease-in-out_infinite]',
                  )}
                >
                  <span className="font-medium">{i.company?.name}</span>
                  <span className="text-muted-foreground">{i.round}</span>
                  <UpcomingIndicator scheduledAt={i.scheduledAt} status={i.status} compact />
                  <span className={cn('tabular-nums text-muted-foreground', highlight && 'font-semibold text-primary dark:text-primary')}>
                    {getCountdownLabel(i.scheduledAt, new Date(now))}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
