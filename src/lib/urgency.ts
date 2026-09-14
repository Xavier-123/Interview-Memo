import { differenceInCalendarDays, differenceInMinutes, isToday, isTomorrow, parseISO } from 'date-fns'
import { formatTime } from '@/lib/date'
import type { InterviewStatus } from '@/types'

export type Urgency = 'past' | 'today' | 'tomorrow' | 'soon' | 'later'

/** 仅对「待面试」且尚未开始的面试计算紧迫度，其余返回 past。 */
export function getUrgency(scheduledAt: string, status?: InterviewStatus, now = new Date()): Urgency {
  if (status && status !== 'scheduled') return 'past'
  const date = parseISO(scheduledAt)
  if (date.getTime() < now.getTime()) return 'past'
  if (isToday(date)) return 'today'
  if (isTomorrow(date)) return 'tomorrow'
  if (differenceInCalendarDays(date, now) <= 3) return 'soon'
  return 'later'
}

export function isUpcomingSoon(urgency: Urgency): boolean {
  return urgency === 'today' || urgency === 'tomorrow' || urgency === 'soon'
}

/** 倒计时文案：「2 小时后 14:00」「明天 10:30」「3 天后」 */
export function getCountdownLabel(scheduledAt: string, now = new Date()): string {
  const date = parseISO(scheduledAt)
  const minutes = differenceInMinutes(date, now)
  if (minutes <= 0) return '进行中'
  if (minutes < 60) return `${minutes} 分钟后`
  if (isToday(date)) return `${Math.floor(minutes / 60)} 小时后 · ${formatTime(scheduledAt)}`
  if (isTomorrow(date)) return `明天 ${formatTime(scheduledAt)}`
  return `${differenceInCalendarDays(date, now)} 天后 · ${formatTime(scheduledAt)}`
}

interface UrgencyMeta {
  label: string
  /** 卡片容器：左侧色条 + 轻微底色 */
  card: string
  /** 圆点颜色 */
  dot: string
  /** 文案颜色 */
  text: string
  /** 是否启用呼吸动效 */
  live: boolean
}

export const URGENCY_META: Record<Urgency, UrgencyMeta> = {
  today: {
    label: '今天',
    card: 'border-l-2 border-l-primary bg-primary/[0.04] dark:bg-primary/[0.08]',
    dot: 'bg-primary',
    text: 'text-primary',
    live: true,
  },
  tomorrow: {
    label: '明天',
    card: 'border-l-2 border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    live: false,
  },
  soon: {
    label: '3 天内',
    card: 'border-l-2 border-l-amber-400/70',
    dot: 'bg-amber-400',
    text: 'text-amber-700 dark:text-amber-400',
    live: false,
  },
  later: {
    label: '',
    card: '',
    dot: 'bg-muted-foreground/50',
    text: 'text-muted-foreground',
    live: false,
  },
  past: {
    label: '',
    card: '',
    dot: 'bg-muted-foreground/40',
    text: 'text-muted-foreground',
    live: false,
  },
}
