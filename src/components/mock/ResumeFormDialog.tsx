import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileUp, Loader2 } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { TagInput } from '@/components/common/TagInput'
import { useAppStore } from '@/store/useAppStore'
import { parseResumeFile, RESUME_ACCEPT, type ExtractedResumeProject } from '@/lib/resumeParse'
import { cn } from '@/lib/utils'

interface ResumeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResumeFormDialog({ open, onOpenChange }: ResumeFormDialogProps) {
  const resume = useAppStore((s) => s.resume)
  const updateResume = useAppStore((s) => s.updateResume)
  const projects = useAppStore((s) => s.projects)
  const addProject = useAppStore((s) => s.addProject)
  const settings = useAppStore((s) => s.settings)
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [fileName, setFileName] = useState('')
  const [summary, setSummary] = useState('')
  const [education, setEducation] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [rawText, setRawText] = useState('')
  const [extractedProjects, setExtractedProjects] = useState<ExtractedResumeProject[]>([])
  const [importProjects, setImportProjects] = useState(true)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (open) {
      setSummary(resume.summary)
      setEducation(resume.education)
      setSkills(resume.skills)
      setRawText(resume.rawText)
      setFileName(resume.sourceFileName ?? '')
      setExtractedProjects([])
      setImportProjects(true)
      setParsing(false)
    }
  }, [open, resume])

  const handleFile = async (file: File | undefined) => {
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '简历解析失败')
    } finally {
      setParsing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const save = () => {
    if (!rawText.trim()) {
      toast.error('请先上传简历文件')
      return
    }
    updateResume({
      summary,
      education,
      skills,
      rawText,
      sourceFileName: fileName,
    })
    if (importProjects && extractedProjects.length > 0) {
      const existing = new Set(projects.map((p) => p.title.trim().toLowerCase()))
      let added = 0
      extractedProjects.forEach((p) => {
        if (existing.has(p.title.trim().toLowerCase())) return
        addProject(p)
        existing.add(p.title.trim().toLowerCase())
        added += 1
      })
      if (added > 0) toast.success(`简历已保存，并导入 ${added} 个项目`)
      else toast.success('简历已保存')
    } else {
      toast.success('简历已保存')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>上传简历</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <input
            ref={fileRef}
            type="file"
            accept={RESUME_ACCEPT}
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={parsing}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              void handleFile(e.dataTransfer.files?.[0])
            }}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors',
              dragOver ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
              parsing && 'pointer-events-none opacity-70',
            )}
          >
            {parsing ? (
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <FileUp className="mb-2 h-8 w-8 text-muted-foreground" />
            )}
            <p className="text-sm font-medium">
              {parsing ? '正在解析简历...' : '点击或拖拽上传简历'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              支持 PDF、Word（.docx）、Markdown、TXT、HTML
            </p>
            {fileName && !parsing && (
              <p className="mt-2 text-xs text-muted-foreground">当前文件：{fileName}</p>
            )}
          </button>

          {rawText && (
            <>
              <div className="space-y-2">
                <Label>个人摘要</Label>
                <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>教育背景</Label>
                <Input value={education} onChange={(e) => setEducation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>技能标签</Label>
                <TagInput tags={skills} onChange={setSkills} placeholder="可补充技能后回车" />
              </div>
              <div className="space-y-2">
                <Label>解析原文</Label>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
              {extractedProjects.length > 0 && (
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={importProjects}
                    onCheckedChange={(c) => setImportProjects(!!c)}
                  />
                  <span>
                    同时导入解析出的 {extractedProjects.length} 个项目
                    <span className="block text-xs text-muted-foreground">
                      {extractedProjects.map((p) => p.title).join('、')}
                    </span>
                  </span>
                </label>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={save} disabled={parsing || !rawText.trim()}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
