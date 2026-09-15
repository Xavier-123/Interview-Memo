import { cn } from '@/lib/utils'
import { getCountdownLabel, getUrgency, isUpcomingSoon, URGENCY_META, type Urgency } from '@/lib/urgency'
import type { InterviewStatus } from '@/types'

/**
 * 呼吸圆点：今天的面试外圈双层扩散波动（motion-reduce 下静止），其余仅实心点。
 */
export function LiveDot({ urgency, className }: { urgency: Urgency; className?: string }) {
  const meta = URGENCY_META[urgency]
  return (
    <span className={cn('relative inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center', className)}>
      {meta.live && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-70 motion-safe:animate-ping motion-reduce:hidden',
            meta.dot,
          )}
        />
      )}
      <span className={cn('relative inline-flex h-2 w-2 rounded-full ring-2 ring-background', meta.dot)} />
    </span>
  )
}

interface UpcomingIndicatorProps {
  scheduledAt: string
  status: InterviewStatus
  className?: string
  /** compact 只显示圆点 + 短文案 */
  compact?: boolean
}

/**
 * 仅在「待面试」且 3 天内时渲染，返回 null 表示无需突出。
 */
export function UpcomingIndicator({ scheduledAt, status, className, compact }: UpcomingIndicatorProps) {
  const urgency = getUrgency(scheduledAt, status)
  if (!isUpcomingSoon(urgency)) return null
  const meta = URGENCY_META[urgency]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-xs transition-colors',
        meta.badge,
        className,
      )}
    >
      <LiveDot urgency={urgency} />
      <span>{compact ? meta.label : getCountdownLabel(scheduledAt)}</span>
    </span>
  )
}

/** 供列表/卡片容器使用的高亮 class */
export function urgencyCardClass(scheduledAt: string, status: InterviewStatus): string {
  return URGENCY_META[getUrgency(scheduledAt, status)].card
}
