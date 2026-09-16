import { useMemo, useState } from 'react'
import { ArrowLeft, Archive, FileText, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ResumeVersionFormDialog } from '@/components/resumes/ResumeVersionFormDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/useAppStore'
import { formatDateTime } from '@/lib/date'

export function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const resume = useAppStore((s) => s.resumes.find((item) => item.id === id))
  const allVersions = useAppStore((s) => s.resumeVersions)
  const versions = useMemo(
    () => allVersions.filter((item) => item.resumeId === id).sort((a, b) => b.version - a.version),
    [allVersions, id],
  )
  const jobs = useAppStore((s) => s.jobs)
  const sessions = useAppStore((s) => s.mockSessions)
  const setResumeVersionArchived = useAppStore((s) => s.setResumeVersionArchived)
  const removeResumeVersion = useAppStore((s) => s.removeResumeVersion)
  const [versionOpen, setVersionOpen] = useState(false)
  const [sourceVersionId, setSourceVersionId] = useState<string | null>(null)
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null)
  const sourceVersion = useMemo(() => versions.find((item) => item.id === sourceVersionId), [versions, sourceVersionId])
  if (!resume) return <ErrorState title="简历不存在" />
  return <div>
    <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> 返回</Button>
    <PageHeader icon={FileText} title={resume.name} description={`${versions.length} 个版本`} actions={<><Button onClick={() => { setSourceVersionId(versions[0]?.id ?? null); setVersionOpen(true) }}>基于最新版本新建</Button><Button variant="outline" onClick={() => useAppStore.getState().setResumeArchived(resume.id, !resume.archivedAt)}>{resume.archivedAt ? '恢复简历' : '归档简历'}</Button></>} />
    <div className="space-y-4">{versions.map((version) => { const linkedJobs = jobs.filter((job) => job.resumeVersionId === version.id); const linkedSessions = sessions.filter((session) => session.resumeVersionId === version.id); return <Card key={version.id} className={version.archivedAt ? 'opacity-70' : ''}><CardHeader className="flex flex-row items-start justify-between space-y-0"><div><CardTitle className="flex items-center gap-2"><Badge>v{version.version}</Badge>{version.archivedAt && <Badge variant="outline">已归档</Badge>}<span className="text-sm font-normal text-muted-foreground">{formatDateTime(version.createdAt)}</span></CardTitle><p className="mt-2 text-sm">{version.summary || '暂无摘要'}</p></div><div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => { setSourceVersionId(version.id); setVersionOpen(true) }}><Pencil className="h-4 w-4" /> 基于此新建</Button><Button variant="ghost" size="icon" onClick={() => setResumeVersionArchived(version.id, !version.archivedAt)}><Archive className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteVersionId(version.id)}><Trash2 className="h-4 w-4" /></Button></div></CardHeader><CardContent className="space-y-3 text-sm">{version.educations?.length ? <div><span className="text-muted-foreground">教育背景：</span>{version.educations.map((e, i) => <p key={i}>{e.startMonth} - {e.isCurrent ? '至今' : e.endMonth} · {e.school} · {e.major} · {e.degree === '其它' ? e.customDegree : e.degree}</p>)}</div> : <div><span className="text-muted-foreground">教育：</span>{version.education || '—'}</div>}{version.experiences?.length ? <div><span className="text-muted-foreground">公司经历：</span>{version.experiences.map((e, i) => <div key={i} className="mt-1 rounded border p-2"><p className="font-medium">{e.company} · {e.role}（{e.startMonth} - {e.isCurrent ? '至今' : e.endMonth}）</p><p>{e.description}</p>{e.projects.map((p, j) => <p key={j} className="ml-3 text-xs">项目：{p.title}{p.role ? ` · ${p.role}` : ''}</p>)}</div>)}</div> : null}<div><span className="text-muted-foreground">技能：</span>{version.skills.length ? version.skills.join('、') : '—'}</div><div><span className="text-muted-foreground">来源文件：</span>{version.sourceFileName || '—'}</div>{version.projectSnapshots.length > 0 && <details><summary className="cursor-pointer text-muted-foreground">查看 {version.projectSnapshots.length} 个项目快照</summary><div className="mt-2 space-y-2">{version.projectSnapshots.map((project, index) => <div key={`${project.sourceProjectId ?? project.title}-${index}`} className="rounded-md border p-3"><p className="font-medium">{project.title}</p><p className="text-xs text-muted-foreground">{project.role || '—'} · {project.period || '—'}{project.techStack.length ? ` · ${project.techStack.join(' / ')}` : ''}</p>{project.description && <p className="mt-2 whitespace-pre-wrap">{project.description}</p>}{project.highlights && <p className="mt-1"><span className="text-muted-foreground">亮点：</span>{project.highlights}</p>}{project.challenges && <p className="mt-1"><span className="text-muted-foreground">难点：</span>{project.challenges}</p>}</div>)}</div></details>}<details><summary className="cursor-pointer text-muted-foreground">查看简历原文</summary><p className="mt-2 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">{version.rawText}</p></details><div className="flex flex-wrap gap-2">{linkedJobs.map((job) => <Link key={job.id} to={`/jobs/${job.id}`}><Badge variant="secondary">岗位：{job.title}</Badge></Link>)}{linkedSessions.length > 0 && <Badge variant="outline">模拟 {linkedSessions.length} 次</Badge>}</div></CardContent></Card>})}</div>
    <ResumeVersionFormDialog open={versionOpen} onOpenChange={setVersionOpen} resumeId={resume.id} sourceVersion={sourceVersion} />
    <ConfirmDialog open={!!deleteVersionId} onOpenChange={(open) => !open && setDeleteVersionId(null)} title="删除简历版本" description="被岗位或模拟会话引用的版本不能删除，只能归档。" destructive onConfirm={() => { if (deleteVersionId && !removeResumeVersion(deleteVersionId)) toast.error('该版本已有引用，请先归档'); else toast.success('版本已删除'); setDeleteVersionId(null) }} />
  </div>
}
