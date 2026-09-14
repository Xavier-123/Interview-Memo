import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/store/useAppStore'
import { resolveJobContext } from '@/store/selectors'
import { hasResumeContent } from '@/lib/mockInterview'
import { isLlmConfigured } from '@/lib/llm'
import type { InterviewRound, MockInterviewMode } from '@/types'

interface StartMockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: MockInterviewMode
  defaultJobId?: string
  onStart: (sessionId: string) => void
}

const rounds: InterviewRound[] = ['一面', '二面', '三面', 'HR面', '加面', '笔试']

export function StartMockDialog({
  open,
  onOpenChange,
  defaultMode = 'full',
  defaultJobId,
  onStart,
}: StartMockDialogProps) {
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const projects = useAppStore((s) => s.projects)
  const resume = useAppStore((s) => s.resume)
  const resumes = useAppStore((s) => s.resumes)
  const resumeVersions = useAppStore((s) => s.resumeVersions)
  const settings = useAppStore((s) => s.settings)
  const createMockSession = useAppStore((s) => s.createMockSession)
  const [mode, setMode] = useState<MockInterviewMode>(defaultMode)
  const [jobId, setJobId] = useState('')
  const [roundHint, setRoundHint] = useState<InterviewRound>('一面')
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [resumeVersionId, setResumeVersionId] = useState('none')

  useEffect(() => {
    if (open) {
      setMode(defaultMode)
      setJobId(defaultJobId ?? jobs[0]?.id ?? '')
      setRoundHint('一面')
      setSelectedProjectIds(projects.slice(0, 1).map((p) => p.id))
      const bound = jobs.find((job) => job.id === (defaultJobId ?? jobs[0]?.id))?.resumeVersionId
      setResumeVersionId(bound ?? 'none')
    }
  }, [open, defaultMode, defaultJobId, jobs, projects])

  const selectedJob = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId])
  const selectedCompany = useMemo(
    () => (selectedJob ? resolveJobContext({ jobs, companies }, selectedJob.id).company : undefined),
    [jobs, companies, selectedJob],
  )

  const selectableVersions = useMemo(() => {
    const boundId = selectedJob?.resumeVersionId
    return resumeVersions.filter((version) => {
      const parent = resumes.find((resume) => resume.id === version.resumeId)
      return (!parent?.archivedAt && !version.archivedAt) || version.id === boundId
    })
  }, [resumeVersions, resumes, selectedJob?.resumeVersionId])

  const changeJob = (nextJobId: string) => {
    setJobId(nextJobId)
    setResumeVersionId(jobs.find((job) => job.id === nextJobId)?.resumeVersionId ?? 'none')
  }

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    )
  }

  const handleStart = () => {
    if (!isLlmConfigured(settings.llm)) {
      toast.error('请先在设置中配置大模型 API')
      return
    }

    if (mode === 'full') {
      if (!jobId) {
        toast.error('请选择岗位')
        return
      }
      if (resumeVersionId === 'none' && !hasResumeContent(resume) && projects.length === 0) {
        toast.error('完整模拟需要上传简历或至少一个项目')
        return
      }
      if (!selectedJob?.jd?.trim()) {
        toast.warning('该岗位 JD 为空，模拟将主要基于简历与项目')
      }
      const sessionId = createMockSession({
        mode: 'full',
        companyId: selectedJob?.companyId,
        jobId,
        projectIds: projects.map((p) => p.id),
        resumeVersionId: resumeVersionId === 'none' ? undefined : resumeVersionId,
        roundHint,
      })
      onStart(sessionId)
      onOpenChange(false)
      return
    }

    if (selectedProjectIds.length === 0) {
      toast.error('请至少选择一个项目')
      return
    }
    const sessionId = createMockSession({
      mode: 'project',
      projectIds: selectedProjectIds,
    })
    onStart(sessionId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>开始模拟面试</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as MockInterviewMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="full">完整模拟</TabsTrigger>
            <TabsTrigger value="project">项目深挖</TabsTrigger>
          </TabsList>

          <TabsContent value="full" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              基于公司信息、JD 与你上传的简历/项目进行真实流程模拟。
            </p>
            <div className="space-y-2">
              <Label>选择岗位</Label>
              <Select value={jobId} onValueChange={changeJob}>
                <SelectTrigger><SelectValue placeholder="选择岗位" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => {
                    const company = companies.find((c) => c.id === job.companyId)
                    return (
                      <SelectItem key={job.id} value={job.id}>
                        {company?.name} · {job.title}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedCompany && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <p className="font-medium">{selectedCompany.name}</p>
                <p className="text-muted-foreground">{selectedCompany.industry} · {selectedCompany.location}</p>
                {selectedJob && !selectedJob.jd?.trim() && (
                  <p className="mt-2 text-amber-600">该岗位尚未填写 JD</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>模拟轮次</Label>
              <Select value={roundHint} onValueChange={(v) => setRoundHint(v as InterviewRound)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rounds.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>使用简历版本</Label>
              <Select value={resumeVersionId} onValueChange={setResumeVersionId}>
                <SelectTrigger><SelectValue placeholder="未关联简历" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未关联简历（使用共享资料）</SelectItem>
                  {resumes.flatMap((resume) => selectableVersions.filter((version) => version.resumeId === resume.id).map((version) => (
                    <SelectItem key={version.id} value={version.id}>{resume.name} · v{version.version}{version.archivedAt ? ' · 已归档' : ''}</SelectItem>
                  )))}
                </SelectContent>
              </Select>
              {resumeVersionId === 'none' && !hasResumeContent(resume) && projects.length === 0 && <p className="text-xs text-destructive">请选择一个简历版本或先维护共享资料</p>}
            </div>
          </TabsContent>

          <TabsContent value="project" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              面试官只会围绕你勾选的项目追问，不会引入其他经历。
            </p>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">请先在下方添加至少一个项目。</p>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <label
                    key={project.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selectedProjectIds.includes(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <div>
                      <p className="font-medium">{project.title}</p>
                      <p className="text-xs text-muted-foreground">{project.role} · {project.period}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleStart}>开始模拟</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
