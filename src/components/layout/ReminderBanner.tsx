import { useMemo, useState } from 'react'
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

export function ReminderBanner() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1')
  const interviews = useAppStore((s) => s.interviews)
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const reviews = useAppStore((s) => s.reviews)

  const upcoming = useMemo(
    () => selectUpcomingInterviews24h({ interviews, jobs, companies, reviews } as AppState),
    [interviews, jobs, companies, reviews],
  )

  if (dismissed || upcoming.length === 0) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="border-b border-primary/20 bg-primary/[0.06] px-4 py-2 dark:bg-primary/[0.1]">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">24 小时内你有 {upcoming.length} 场面试</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {upcoming.map((i) => (
              <Link
                key={i.id}
                to={`/interviews/${i.id}`}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md border bg-background/80 px-2.5 py-1 text-xs transition-colors hover:border-primary/40',
                )}
              >
                <span className="font-medium">{i.company?.name}</span>
                <span className="text-muted-foreground">{i.round}</span>
                <UpcomingIndicator scheduledAt={i.scheduledAt} status={i.status} compact />
                <span className="tabular-nums text-muted-foreground">{getCountdownLabel(i.scheduledAt)}</span>
              </Link>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
