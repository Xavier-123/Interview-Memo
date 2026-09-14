import { useEffect, useRef, useState } from 'react'
import { FileUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { TagInput } from '@/components/common/TagInput'
import { useAppStore } from '@/store/useAppStore'
import { parseResumeFile, RESUME_ACCEPT, type ExtractedResumeProject } from '@/lib/resumeParse'
import type { ResumeVersion } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeId?: string
  sourceVersion?: ResumeVersion | null
  createNewResume?: boolean
  onCreated?: (resumeId: string) => void
}

export function ResumeVersionFormDialog({ open, onOpenChange, resumeId, sourceVersion, createNewResume, onCreated }: Props) {
  const projects = useAppStore((s) => s.projects)
  const settings = useAppStore((s) => s.settings)
  const createResume = useAppStore((s) => s.createResume)
  const createResumeVersion = useAppStore((s) => s.createResumeVersion)
  const addProject = useAppStore((s) => s.addProject)
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [education, setEducation] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [rawText, setRawText] = useState('')
  const [fileName, setFileName] = useState('')
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [extractedProjects, setExtractedProjects] = useState<ExtractedResumeProject[]>([])
  const [importProjects, setImportProjects] = useState(true)
  const [parsing, setParsing] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(createNewResume ? '' : '')
    setSummary(sourceVersion?.summary ?? '')
    setEducation(sourceVersion?.education ?? '')
    setSkills(sourceVersion?.skills ?? [])
    setRawText(sourceVersion?.rawText ?? '')
    setFileName(sourceVersion?.sourceFileName ?? '')
    setSelectedProjectIds(sourceVersion?.projectSnapshots.map((p) => p.sourceProjectId).filter(Boolean) as string[] ?? [])
    setExtractedProjects([])
    setImportProjects(true)
  }, [open, sourceVersion, createNewResume])

  const handleFile = async (file?: File) => {
    if (!file) return
    setParsing(true)
    try {
      const parsed = await parseResumeFile(file, settings.llm)
      setFileName(parsed.sourceFileName)
      setSummary(parsed.summary)
      setEducation(parsed.education)
      setSkills(parsed.skills)
      setRawText(parsed.rawText)
      setExtractedProjects(parsed.projects)
      toast.success(`已解析 ${file.name}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '简历解析失败')
    } finally {
      setParsing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const toggleProject = (id: string) => {
    setSelectedProjectIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const save = () => {
    if (!rawText.trim()) {
      toast.error('请先上传或填写简历原文')
      return
    }
    let projectIds = selectedProjectIds
    if (importProjects && extractedProjects.length > 0) {
      const existing = new Set(projects.map((p) => p.title.trim().toLowerCase()))
      const importedIds: string[] = []
      extractedProjects.forEach((project) => {
        const key = project.title.trim().toLowerCase()
        const existingProject = projects.find((item) => item.title.trim().toLowerCase() === key)
        if (existingProject) {
          importedIds.push(existingProject.id)
          return
        }
        const id = addProject(project)
        importedIds.push(id)
        existing.add(key)
      })
      projectIds = Array.from(new Set([...projectIds, ...importedIds]))
    }
    const retainedProjectSnapshots = (sourceVersion?.projectSnapshots ?? []).filter(
      (snapshot) => !snapshot.sourceProjectId || !projects.some((project) => project.id === snapshot.sourceProjectId),
    )
    const data = { summary, education, skills, rawText, sourceFileName: fileName, projectIds, retainedProjectSnapshots }
    if (createNewResume) {
      if (!name.trim()) {
        toast.error('请填写简历名称')
        return
      }
      const result = createResume({ ...data, name: name.trim() })
      onCreated?.(result.resumeId)
      toast.success('简历已创建（v1）')
    } else if (resumeId) {
      const versionId = createResumeVersion(resumeId, data)
      if (!versionId) {
        toast.error('无法创建版本：简历可能已归档')
        return
      }
      toast.success('新版本已创建')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{createNewResume ? '新建简历' : `基于 v${sourceVersion?.version ?? ''} 新建版本`}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          {createNewResume && <div className="space-y-2"><Label>简历名称</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="大模型工程版" /></div>}
          <input ref={fileRef} type="file" accept={RESUME_ACCEPT} className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />
          <Button type="button" variant="outline" disabled={parsing} onClick={() => fileRef.current?.click()}>
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} {parsing ? '正在解析...' : '上传 / 替换简历文件'}
          </Button>
          {fileName && <p className="text-xs text-muted-foreground">来源：{fileName}</p>}
          <div className="space-y-2"><Label>个人摘要</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} /></div>
          <div className="space-y-2"><Label>教育背景</Label><Input value={education} onChange={(e) => setEducation(e.target.value)} /></div>
          <div className="space-y-2"><Label>技能标签</Label><TagInput tags={skills} onChange={setSkills} placeholder="技能，回车添加" /></div>
          <div className="space-y-2"><Label>简历原文</Label><Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={10} className="font-mono text-xs" /></div>
          <div className="space-y-2"><Label>项目快照</Label>
            {projects.length === 0 ? <p className="text-sm text-muted-foreground">暂无共享项目</p> : projects.map((project) => (
              <label key={project.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                <Checkbox checked={selectedProjectIds.includes(project.id)} onCheckedChange={() => toggleProject(project.id)} />
                <span><span className="font-medium">{project.title}</span><span className="block text-xs text-muted-foreground">{project.role} · {project.period}</span></span>
              </label>
            ))}
          </div>
          {extractedProjects.length > 0 && <label className="flex items-start gap-2 text-sm"><Checkbox checked={importProjects} onCheckedChange={(checked) => setImportProjects(!!checked)} /><span>导入解析出的 {extractedProjects.length} 个项目并冻结到版本</span></label>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button onClick={save} disabled={parsing}>保存版本</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
