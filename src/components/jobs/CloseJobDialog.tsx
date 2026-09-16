import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  JOB_CLOSE_REASON_LABELS,
  JOB_CLOSE_REASONS,
  type Job,
  type JobCloseReason,
  type JobStatus,
} from '@/types'

interface CloseJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: Job | null
  onConfirm: (reason: JobCloseReason) => void
}

function getDefaultReason(status?: JobStatus): JobCloseReason {
  if (status === 'written_test') return 'written_test_failed'
  if (status === 'round1' || status === 'round2' || status === 'hr') return 'interview_failed'
  if (status === 'offer' || status === 'offer_accepted') return 'offer_declined'
  return 'interview_failed'
}

export function CloseJobDialog({ open, onOpenChange, job, onConfirm }: CloseJobDialogProps) {
  const [reason, setReason] = useState<JobCloseReason>('interview_failed')

  useEffect(() => {
    if (job) {
      setReason(job.closeReason ?? getDefaultReason(job.status))
    }
  }, [job])

  const handleConfirm = () => {
    onConfirm(reason)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>结束求职流程</DialogTitle>
          <DialogDescription>
            标记「{job?.title ?? '岗位'}」为已结束，请选择流程结束的具体原因。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="close-reason">结束原因</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as JobCloseReason)}>
              <SelectTrigger id="close-reason" className="w-full">
                <SelectValue placeholder="请选择结束原因" />
              </SelectTrigger>
              <SelectContent>
                {JOB_CLOSE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {JOB_CLOSE_REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>
            确认结束
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
