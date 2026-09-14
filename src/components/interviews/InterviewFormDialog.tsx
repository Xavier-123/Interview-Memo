import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/store/useAppStore'
import type { Interview, InterviewMode, InterviewRound, InterviewStatus } from '@/types'
import { INTERVIEW_ROUNDS } from '@/types'
import { toast } from 'sonner'

interface InterviewFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  interview?: Interview | null
  defaultJobId?: string
  defaultDate?: string
}

const rounds = INTERVIEW_ROUNDS
const modes: InterviewMode[] = ['视频', '电话', '现场']
const statuses: InterviewStatus[] = ['scheduled', 'completed', 'pending_feedback', 'passed', 'failed', 'cancelled']
const statusLabels: Record<InterviewStatus, string> = {
  scheduled: '待面试',
  completed: '已完成',
  pending_feedback: '等待反馈',
  passed: '已通过',
  failed: '未通过',
  cancelled: '已取消',
}

export function InterviewFormDialog({
  open,
  onOpenChange,
  interview,
  defaultJobId,
  defaultDate,
}: InterviewFormDialogProps) {
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const addInterview = useAppStore((s) => s.addInterview)
  const updateInterview = useAppStore((s) => s.updateInterview)
  const [jobId, setJobId] = useState('')
  const [round, setRound] = useState<InterviewRound>('一面')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('60')
  const [mode, setMode] = useState<InterviewMode>('视频')
  const [interviewer, setInterviewer] = useState('')
  const [status, setStatus] = useState<InterviewStatus>('scheduled')
  const [notes, setNotes] = useState('')
  const [syncJobStatus, setSyncJobStatus] = useState(true)

  useEffect(() => {
    if (open) {
      if (interview) {
        setJobId(interview.jobId)
        setRound(interview.round)
        setScheduledAt(interview.scheduledAt.slice(0, 16))
        setDuration(String(interview.duration))
        setMode(interview.mode)
        setInterviewer(interview.interviewer)
        setStatus(interview.status)
        setNotes(interview.notes)
      } else {
        setJobId(defaultJobId ?? jobs[0]?.id ?? '')
        setRound('一面')
        setScheduledAt(defaultDate ?? '')
        setDuration('60')
        setMode('视频')
        setInterviewer('')
        setStatus('scheduled')
        setNotes('')
        setSyncJobStatus(true)
      }
    }
  }, [open, interview, defaultJobId, defaultDate, jobs])

  const handleSubmit = () => {
    if (!jobId || !scheduledAt) {
      toast.error('请选择岗位和面试时间')
      return
    }
    const data = {
      jobId,
      round,
      scheduledAt: new Date(scheduledAt).toISOString(),
      duration: parseInt(duration, 10) || 60,
      mode,
      interviewer,
      status,
      notes,
    }
    if (interview) {
      updateInterview(interview.id, data)
      toast.success('面试已更新')
    } else {
      addInterview(data, syncJobStatus)
      toast.success('面试已创建')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{interview ? '编辑面试' : '新增面试'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>岗位</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger><SelectValue placeholder="选择岗位" /></SelectTrigger>
              <SelectContent>
                {jobs.map((j) => {
                  const company = companies.find((c) => c.id === j.companyId)
                  return (
                    <SelectItem key={j.id} value={j.id}>
                      {company?.name} · {j.title}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>轮次</Label>
              <Select value={round} onValueChange={(v) => setRound(v as InterviewRound)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rounds.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>方式</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as InterviewMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {modes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>面试时间</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>时长（分钟）</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>面试官</Label>
              <Input value={interviewer} onChange={(e) => setInterviewer(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as InterviewStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          {!interview && (
            <div className="flex items-center gap-2">
              <Checkbox id="sync" checked={syncJobStatus} onCheckedChange={(c) => setSyncJobStatus(!!c)} />
              <Label htmlFor="sync">同步更新岗位状态</Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit}>{interview ? '保存' : '创建'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
