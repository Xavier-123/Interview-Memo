import { useNavigate } from 'react-router-dom'
import { Bot, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Job } from '@/types'

interface JobRowActionsProps {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
  compact?: boolean
}

export function JobRowActions({ job, onEdit, onDelete, compact }: JobRowActionsProps) {
  const navigate = useNavigate()

  if (compact) {
    return (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="模拟面试"
          onClick={() => navigate(`/mock?jobId=${job.id}&mode=full&start=1`)}
        >
          <Bot className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(job)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(job)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => navigate(`/mock?jobId=${job.id}&mode=full&start=1`)}>
        模拟面试
      </Button>
      <Button variant="outline" size="sm" onClick={() => onEdit(job)}>编辑</Button>
      <Button variant="outline" size="sm" onClick={() => onDelete(job)}>删除</Button>
    </div>
  )
}
