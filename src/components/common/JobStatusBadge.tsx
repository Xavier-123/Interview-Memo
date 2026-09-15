import { JOB_STATUS_LABELS, JOB_STATUS_META } from '@/types'
import type { JobStatus } from '@/types'
import { cn } from '@/lib/utils'

interface JobStatusBadgeProps {
  status: JobStatus
  className?: string
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const meta = JOB_STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.color,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {JOB_STATUS_LABELS[status]}
    </span>
  )
}
