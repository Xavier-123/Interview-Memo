import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
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
import { TagInput } from '@/components/common/TagInput'
import { DatePicker } from '@/components/ui/date-picker'
import { useAppStore } from '@/store/useAppStore'
import {
  JOB_CLOSE_REASON_LABELS,
  JOB_CLOSE_REASONS,
  JOB_STATUS_LABELS,
  JOB_STATUS_ORDER,
  type Job,
  type JobCloseReason,
  type JobPriority,
  type JobStatus,
  type JobType,
} from '@/types'
import { toast } from 'sonner'

interface JobFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job?: Job | null
  defaultStatus?: JobStatus
}

const jobTypes: JobType[] = ['算法', '后端', '全栈', '前端', '数据', '其他']
const priorities: JobPriority[] = ['high', 'medium', 'low']
const priorityLabels: Record<JobPriority, string> = { high: '高', medium: '中', low: '低' }

export function JobFormDialog({ open, onOpenChange, job, defaultStatus = 'applied' }: JobFormDialogProps) {
  const companies = useAppStore((s) => s.companies)
  const resumes = useAppStore((s) => s.resumes)
  const resumeVersions = useAppStore((s) => s.resumeVersions)
  const addCompany = useAppStore((s) => s.addCompany)
  const addJob = useAppStore((s) => s.addJob)
  const updateJob = useAppStore((s) => s.updateJob)
  const addInterview = useAppStore((s) => s.addInterview)
  const [companyId, setCompanyId] = useState('')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [title, setTitle] = useState('')
  const [salaryText, setSalaryText] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState<JobType>('算法')
  const [status, setStatus] = useState<JobStatus>(defaultStatus)
  const [closeReason, setCloseReason] = useState<JobCloseReason>('interview_failed')
  const [priority, setPriority] = useState<JobPriority>('medium')
  const [tags, setTags] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [jd, setJd] = useState('')
  const [source, setSource] = useState('')
  const [appliedAt, setAppliedAt] = useState('')
  const [resumeVersionId, setResumeVersionId] = useState('none')
  const [createInterview, setCreateInterview] = useState(false)
  const [interviewDate, setInterviewDate] = useState('')

  useEffect(() => {
    if (open) {
      if (job) {
        setCompanyId(job.companyId)
        setTitle(job.title)
        setSalaryText(job.salaryText)
        setLocation(job.location)
        setJobType(job.jobType)
        setStatus(job.status)
        setCloseReason(job.closeReason ?? 'interview_failed')
        setPriority(job.priority)
        setTags(job.tags)
        setDescription(job.description)
        setJd(job.jd ?? '')
        setSource(job.source ?? '')
        setAppliedAt(job.appliedAt ? format(parseISO(job.appliedAt), 'yyyy-MM-dd') : '')
        setResumeVersionId(job.resumeVersionId ?? 'none')
      } else {
        setCompanyId(companies[0]?.id ?? '')
        setTitle('')
        setSalaryText('')
        setLocation('')
        setJobType('算法')
        setStatus(defaultStatus)
        setCloseReason('interview_failed')
        setPriority('medium')
        setTags([])
        setDescription('')
        setJd('')
        setSource('')
        setAppliedAt('')
        setResumeVersionId('none')
        setCreateInterview(false)
        setInterviewDate('')
      }
      setShowNewCompany(false)
      setNewCompanyName('')
    }
  }, [open, job, defaultStatus, companies])

  const handleSubmit = () => {
    let cid = companyId
    if (showNewCompany && newCompanyName.trim()) {
      cid = addCompany({
        name: newCompanyName.trim(),
        industry: '其他',
        location: location || '未知',
        rating: 3,
        techDirections: tags.slice(0, 3),
        notes: '',
      })
    }
    if (!cid || !title.trim()) {
      toast.error('请填写公司和岗位名称')
      return
    }

    const data = {
      companyId: cid,
      title: title.trim(),
      salaryText: salaryText || '面议',
      location: location || '未知',
      jobType,
      status,
      closeReason: status === 'closed' ? closeReason : undefined,
      priority,
      tags,
      description,
      jd,
      source: source.trim() || undefined,
      appliedAt: appliedAt
        ? new Date(appliedAt).toISOString()
        : status === 'applied' && !job?.appliedAt
          ? new Date().toISOString()
          : job?.appliedAt,
      resumeVersionId: resumeVersionId === 'none' ? undefined : resumeVersionId,
    }

    if (job) {
      updateJob(job.id, data)
      toast.success('岗位已更新')
    } else {
      const jobId = addJob(data)
      if (createInterview && interviewDate) {
        addInterview(
          {
            jobId,
            round: '一面',
            scheduledAt: new Date(interviewDate).toISOString(),
            duration: 60,
            mode: '视频',
            interviewer: '',
            status: 'scheduled',
            notes: '',
          },
          true,
        )
      }
      toast.success('岗位已创建')
    }
    if (JOB_STATUS_ORDER.indexOf(status) >= JOB_STATUS_ORDER.indexOf('applied') && resumeVersionId === 'none') {
      toast.warning('该岗位尚未关联投递简历，可稍后补录')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{job ? '编辑岗位' : '新增岗位'}</DialogTitle>
        </DialogHeader>
        <div className="scrollbar-thin grid flex-1 gap-4 overflow-y-auto px-6 py-4">
          {!showNewCompany ? (
            <div className="space-y-2">
              <Label>公司</Label>
              <div className="flex gap-2">
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue placeholder="选择公司" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" type="button" onClick={() => setShowNewCompany(true)}>新建</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>新建公司</Label>
              <div className="flex gap-2">
                <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="公司名称" />
                <Button variant="outline" type="button" onClick={() => setShowNewCompany(false)}>取消</Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>岗位名称</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="大模型算法工程师" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>薪资</Label>
              <Input value={salaryText} onChange={(e) => setSalaryText(e.target.value)} placeholder="30-40K" />
            </div>
            <div className="space-y-2">
              <Label>地点</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="北京" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>投递简历</Label>
            <Select value={resumeVersionId} onValueChange={setResumeVersionId}>
              <SelectTrigger><SelectValue placeholder="选择简历版本" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">暂不关联</SelectItem>
                {resumes.filter((r) => !r.archivedAt || resumeVersions.some((v) => v.resumeId === r.id && v.id === job?.resumeVersionId)).flatMap((resume) =>
                  resumeVersions
                    .filter((version) => version.resumeId === resume.id && (!version.archivedAt || version.id === job?.resumeVersionId))
                    .sort((a, b) => b.version - a.version)
                    .map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        {resume.name} · v{version.version}{version.archivedAt ? ' · 已归档' : ''}
                      </SelectItem>
                    )),
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">可先不关联，之后在岗位编辑中补录。</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>类型</Label>
              <Select value={jobType} onValueChange={(v) => setJobType(v as JobType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {jobTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{JOB_STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>优先级</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as JobPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {status === 'closed' && (
            <div className="space-y-2">
              <Label>结束原因</Label>
              <Select value={closeReason} onValueChange={(v) => setCloseReason(v as JobCloseReason)}>
                <SelectTrigger><SelectValue placeholder="请选择结束原因" /></SelectTrigger>
                <SelectContent>
                  {JOB_CLOSE_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {JOB_CLOSE_REASON_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>投递来源</Label>
              <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Boss / 内推 / 官网" />
            </div>
            <div className="space-y-2">
              <Label>投递日期</Label>
              <DatePicker value={appliedAt} onChange={setAppliedAt} placeholder="选择投递日期" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>标签</Label>
            <TagInput tags={tags} onChange={setTags} />
          </div>
          <div className="space-y-2">
            <Label>描述</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>JD</Label>
            <Textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={8}
              placeholder="粘贴完整招聘 JD（岗位职责、任职要求等）"
              className="text-xs"
            />
          </div>
          {!job && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Checkbox id="createInterview" checked={createInterview} onCheckedChange={(c) => setCreateInterview(!!c)} />
                <Label htmlFor="createInterview">同时创建首场面试</Label>
              </div>
              {createInterview && (
                <DatePicker
                  showTime
                  value={interviewDate}
                  onChange={setInterviewDate}
                  placeholder="选择面试时间"
                />
              )}
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit}>{job ? '保存' : '创建'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
