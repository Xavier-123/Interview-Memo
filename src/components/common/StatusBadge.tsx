import { INTERVIEW_STATUS_META, type InterviewStatus } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: InterviewStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = INTERVIEW_STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        meta.color,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}
