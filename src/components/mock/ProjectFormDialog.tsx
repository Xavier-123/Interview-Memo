import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
import { TagInput } from '@/components/common/TagInput'
import { useAppStore } from '@/store/useAppStore'
import type { ResumeProject } from '@/types'

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: ResumeProject | null
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const addProject = useAppStore((s) => s.addProject)
  const updateProject = useAppStore((s) => s.updateProject)
  const [title, setTitle] = useState('')
  const [role, setRole] = useState('')
  const [period, setPeriod] = useState('')
  const [techStack, setTechStack] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [highlights, setHighlights] = useState('')
  const [challenges, setChallenges] = useState('')

  useEffect(() => {
    if (open && project) {
      setTitle(project.title)
      setRole(project.role)
      setPeriod(project.period)
      setTechStack(project.techStack)
      setDescription(project.description)
      setHighlights(project.highlights)
      setChallenges(project.challenges)
    } else if (open) {
      setTitle('')
      setRole('')
      setPeriod('')
      setTechStack([])
      setDescription('')
      setHighlights('')
      setChallenges('')
    }
  }, [open, project])

  const save = () => {
    if (!title.trim()) {
      toast.error('请填写项目名称')
      return
    }
    const data = {
      title: title.trim(),
      role: role.trim(),
      period: period.trim(),
      techStack,
      description: description.trim(),
      highlights: highlights.trim(),
      challenges: challenges.trim(),
    }
    if (project) {
      updateProject(project.id, data)
      toast.success('项目已更新')
    } else {
      addProject(data)
      toast.success('项目已添加')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? '编辑项目' : '新增项目'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>项目名称</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：RAG 问答系统" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>你的角色</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="核心开发 / 负责人" />
            </div>
            <div className="space-y-2">
              <Label>时间</Label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2024.01 - 2024.06" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>技术栈</Label>
            <TagInput tags={techStack} onChange={setTechStack} placeholder="输入技术后回车" />
          </div>
          <div className="space-y-2">
            <Label>项目描述</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="背景、目标、你的职责"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>亮点与成果</Label>
            <Textarea
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="量化指标、业务价值"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>难点与挑战</Label>
            <Textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="遇到的技术难题与解决方案"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={save}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
