import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function formatDate(iso: string, pattern = 'yyyy/MM/dd'): string {
  return format(parseISO(iso), pattern, { locale: zhCN })
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'yyyy/MM/dd HH:mm', { locale: zhCN })
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm', { locale: zhCN })
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: zhCN })
}

export function getUpcomingLabel(iso: string): string {
  const date = parseISO(iso)
  if (isToday(date)) return '今天'
  if (isTomorrow(date)) return '明天'
  return formatRelative(iso)
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}
