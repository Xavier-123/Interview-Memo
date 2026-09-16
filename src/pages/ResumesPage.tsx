import { useMemo, useState } from 'react'
import { FileText, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ResumeVersionFormDialog } from '@/components/resumes/ResumeVersionFormDialog'
import { ProjectFormDialog } from '@/components/mock/ProjectFormDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/useAppStore'
import { formatDateTime } from '@/lib/date'
import type { Resume, ResumeProject } from '@/types'

export function ResumesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const resumes = useAppStore((s) => s.resumes)
  const versions = useAppStore((s) => s.resumeVersions)
  const projects = useAppStore((s) => s.projects)
  const jobs = useAppStore((s) => s.jobs)
  const removeResume = useAppStore((s) => s.removeResume)
  const removeProject = useAppStore((s) => s.removeProject)
  const setResumeArchived = useAppStore((s) => s.setResumeArchived)
  const [createOpen, setCreateOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ResumeProject | null>(null)
  const [deleteProject, setDeleteProject] = useState<ResumeProject | null>(null)
  const [deleteResume, setDeleteResume] = useState<Resume | null>(null)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setCreateOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const sorted = useMemo(() => [...resumes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [resumes])

  return <div>
    <PageHeader icon={FileText} title="简历" description="维护多套简历与不可变版本" actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> 新建简历</Button>} />
    {sorted.length === 0 ? <EmptyState icon={FileText} title="还没有简历" description="创建第一套简历并上传 v1。" actionLabel="新建简历" onAction={() => setCreateOpen(true)} /> : <div className="space-y-3">
      {sorted.map((resume) => {
        const resumeVersions = versions.filter((v) => v.resumeId === resume.id).sort((a, b) => b.version - a.version)
        const latest = resumeVersions[0]
        const versionIds = new Set(resumeVersions.map((version) => version.id))
        const jobCount = jobs.filter((job) => !!job.resumeVersionId && versionIds.has(job.resumeVersionId)).length
        return <Card key={resume.id} className={resume.archivedAt ? 'opacity-70' : ''}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0"><div><CardTitle className="flex items-center gap-2"><Link to={`/resumes/${resume.id}`} className="hover:underline">{resume.name}</Link>{resume.archivedAt && <Badge variant="outline">已归档</Badge>}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{resumeVersions.length} 个版本 · {jobCount} 个关联岗位 · 更新于 {formatDateTime(resume.updatedAt)}</p></div><div className="flex gap-1"><Button variant="ghost" size="sm" asChild><Link to={`/resumes/${resume.id}`}><Pencil className="h-4 w-4" /> 管理</Link></Button><Button variant="ghost" size="sm" onClick={() => setResumeArchived(resume.id, !resume.archivedAt)}>{resume.archivedAt ? '恢复' : '归档'}</Button><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteResume(resume)}><Trash2 className="h-4 w-4" /></Button></div></CardHeader>
          <CardContent>{latest ? <div className="rounded-md border p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><Badge>v{latest.version}</Badge>{latest.sourceFileName && <span className="text-muted-foreground">{latest.sourceFileName}</span>}</div><p className="mt-2 line-clamp-2">{latest.summary || latest.rawText}</p></div> : <p className="text-sm text-muted-foreground">暂无版本</p>}</CardContent>
        </Card>
      })}
    </div>}
    <Card className="mt-6"><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="flex items-center gap-2 text-base"><FolderKanban className="h-4 w-4" /> 共享项目库</CardTitle><Button variant="outline" size="sm" onClick={() => { setEditingProject(null); setProjectOpen(true) }}><Plus className="h-4 w-4" /> 新增项目</Button></CardHeader><CardContent>{projects.length === 0 ? <p className="text-sm text-muted-foreground">暂无共享项目。创建简历版本时可选择项目并冻结快照。</p> : <div className="space-y-2">{projects.map((project) => <div key={project.id} className="flex items-start justify-between rounded-md border p-3"><div><p className="font-medium">{project.title}</p><p className="text-xs text-muted-foreground">{project.role} · {project.period}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditingProject(project); setProjectOpen(true) }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteProject(project)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>}</CardContent></Card>
    <ResumeVersionFormDialog open={createOpen} onOpenChange={setCreateOpen} createNewResume />
    <ProjectFormDialog open={projectOpen} onOpenChange={setProjectOpen} project={editingProject} />
    <ConfirmDialog open={!!deleteResume} onOpenChange={(open) => !open && setDeleteResume(null)} title="删除简历" description="仅当该简历的所有版本都未被岗位或模拟会话引用时才可永久删除。" destructive onConfirm={() => { if (deleteResume && !removeResume(deleteResume.id)) toast.error('该简历已有引用，请先归档'); else toast.success('简历已删除'); setDeleteResume(null) }} />
    <ConfirmDialog open={!!deleteProject} onOpenChange={(open) => !open && setDeleteProject(null)} title="删除共享项目" description="已冻结在简历版本中的项目快照不会受影响。" destructive onConfirm={() => { if (deleteProject) removeProject(deleteProject.id); setDeleteProject(null); toast.success('共享项目已删除，历史快照已保留') }} />
  </div>
}
