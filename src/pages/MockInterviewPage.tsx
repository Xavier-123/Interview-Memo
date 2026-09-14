import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Bot, FileUser, FolderKanban, Plus, Pencil, Trash2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ProjectFormDialog } from '@/components/mock/ProjectFormDialog'
import { StartMockDialog } from '@/components/mock/StartMockDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/useAppStore'
import { resolveJobContext } from '@/store/selectors'
import { isLlmConfigured } from '@/lib/llm'
import { getSessionTitle } from '@/lib/mockInterview'
import { MOCK_MODE_LABELS, type MockInterviewMode, type ResumeProject } from '@/types'
import { formatDateTime } from '@/lib/date'

export function MockInterviewPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const resumes = useAppStore((s) => s.resumes)
  const resumeVersions = useAppStore((s) => s.resumeVersions)
  const projects = useAppStore((s) => s.projects)
  const mockSessions = useAppStore((s) => s.mockSessions)
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const settings = useAppStore((s) => s.settings)
  const removeProject = useAppStore((s) => s.removeProject)
  const removeMockSession = useAppStore((s) => s.removeMockSession)

  const [projectOpen, setProjectOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ResumeProject | null>(null)
  const [deleteProject, setDeleteProject] = useState<ResumeProject | null>(null)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)

  const defaultMode = (searchParams.get('mode') as MockInterviewMode) || 'full'
  const defaultJobId = searchParams.get('jobId') ?? undefined

  useEffect(() => {
    if (searchParams.get('start') === '1') {
      setStartOpen(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const llmReady = isLlmConfigured(settings.llm)
  const canStart = llmReady && (resumeVersions.length > 0 || projects.length > 0)

  const sessions = useMemo(
    () =>
      [...mockSessions].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [mockSessions],
  )

  const openNewProject = () => {
    setEditingProject(null)
    setProjectOpen(true)
  }

  const openEditProject = (project: ResumeProject) => {
    setEditingProject(project)
    setProjectOpen(true)
  }

  const handleStart = (sessionId: string) => {
    navigate(`/mock/${sessionId}`)
  }

  const handleStartClick = () => {
    if (!llmReady) {
      toast.error('请先在设置中配置大模型 API')
      navigate('/settings')
      return
    }
    setStartOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="模拟面试"
        description="完整模拟或项目深挖，调用远程大模型进行多轮对话"
        actions={
          <Button onClick={handleStartClick} disabled={!canStart && llmReady}>
            <Play className="h-4 w-4" /> 开始模拟
          </Button>
        }
      />

      {!llmReady && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          <p>开始模拟前需配置大模型 API。你仍可先上传简历与项目。</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>前往设置</Button>
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileUser className="h-4 w-4" /> 我的简历
            </CardTitle>
            <Button variant="outline" size="sm" asChild><Link to="/resumes">管理简历</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {resumes.length > 0 ? <><p>{resumes.filter((item) => !item.archivedAt).length} 套可用简历 · {resumeVersions.length} 个历史版本</p><p className="text-muted-foreground">完整模拟会默认采用岗位实际投递版本，也可临时切换。</p></> : <p className="text-muted-foreground">尚未创建简历。可在简历模块维护多套版本。</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4" /> 我的项目
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openNewProject}>
              <Plus className="h-4 w-4" /> 新增
            </Button>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">添加项目后可进行项目深挖模拟。</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-xs text-muted-foreground">{project.role} · {project.period}</p>
                        {project.techStack.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {project.techStack.slice(0, 4).map((t) => (
                              <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditProject(project)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteProject(project)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">历史模拟</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="还没有模拟记录"
              description="点击「开始模拟」体验完整面试或项目深挖。"
              actionLabel="开始模拟"
              onAction={() => setStartOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const { job, company } = session.jobId
                  ? resolveJobContext({ jobs, companies }, session.jobId)
                  : {
                      job: undefined,
                      company: session.companyId
                        ? companies.find((c) => c.id === session.companyId)
                        : undefined,
                    }
                const sessionProjects = projects.filter((p) => session.projectIds.includes(p.id))
                const title = getSessionTitle(session.mode, company, job, sessionProjects)

                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{title}</p>
                        <Badge variant="outline">{MOCK_MODE_LABELS[session.mode]}</Badge>
                        <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                          {session.status === 'completed' ? '已完成' : '进行中'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(session.updatedAt)} · {session.messages.length} 条消息
                        {session.feedback ? ` · 评分 ${session.feedback.overallScore}/5` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/mock/${session.id}`}>
                          {session.status === 'completed' ? '查看' : '继续'}
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteSessionId(session.id)}>
                        删除
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectFormDialog open={projectOpen} onOpenChange={setProjectOpen} project={editingProject} />
      <StartMockDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        defaultMode={defaultMode}
        defaultJobId={defaultJobId}
        onStart={handleStart}
      />

      <ConfirmDialog
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
        title="删除项目"
        description={`确定删除「${deleteProject?.title}」吗？`}
        destructive
        onConfirm={() => {
          if (deleteProject) {
            removeProject(deleteProject.id)
            toast.success('项目已删除')
            setDeleteProject(null)
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteSessionId}
        onOpenChange={(open) => !open && setDeleteSessionId(null)}
        title="删除模拟记录"
        description="确定删除这条模拟面试记录吗？"
        destructive
        onConfirm={() => {
          if (deleteSessionId) {
            removeMockSession(deleteSessionId)
            toast.success('记录已删除')
            setDeleteSessionId(null)
          }
        }}
      />
    </div>
  )
}
