import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { JobKanban } from '@/components/jobs/JobKanban'
import { JobTable } from '@/components/jobs/JobTable'
import { JobFormDialog } from '@/components/jobs/JobFormDialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/useAppStore'
import type { AppState } from '@/store/useAppStore'
import { selectAllTags } from '@/store/selectors'
import type { Job, JobStatus } from '@/types'
import { Briefcase } from 'lucide-react'

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const removeJob = useAppStore((s) => s.removeJob)
  const questions = useAppStore((s) => s.questions)
  const knowledge = useAppStore((s) => s.knowledge)
  const allTags = useMemo(
    () => selectAllTags({ jobs, questions, knowledge } as AppState),
    [jobs, questions, knowledge],
  )

  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<JobStatus>('applied')
  const [deleteJob, setDeleteJob] = useState<Job | null>(null)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormOpen(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const company = companies.find((c) => c.id === j.companyId)
      const matchSearch =
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        company?.name.toLowerCase().includes(search.toLowerCase())
      const matchCompany = companyFilter === 'all' || j.companyId === companyFilter
      const matchTag = tagFilter === 'all' || j.tags.includes(tagFilter)
      const matchType = typeFilter === 'all' || j.jobType === typeFilter
      return matchSearch && matchCompany && matchTag && matchType
    })
  }, [jobs, companies, search, companyFilter, tagFilter, typeFilter])

  const openCreate = (status?: JobStatus) => {
    setEditingJob(null)
    setDefaultStatus(status ?? 'applied')
    setFormOpen(true)
  }

  const openEdit = (job: Job) => {
    setEditingJob(job)
    setFormOpen(true)
  }

  const handleDelete = (job: Job) => setDeleteJob(job)

  return (
    <div>
      <PageHeader
        icon={Briefcase}
        title="岗位管理"
        description="看板与表格双模式，拖拽更新求职进度"
        actions={
          <Button onClick={() => openCreate()}>
            <Plus className="h-4 w-4" /> 新增岗位
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="搜索岗位或公司..." className="sm:w-64" />
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="公司" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部公司</SelectItem>
            {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="标签" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部标签</SelectItem>
            {allTags.map((t) => <SelectItem key={t} value={t}>#{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="算法">算法</SelectItem>
            <SelectItem value="后端">后端</SelectItem>
            <SelectItem value="全栈">全栈</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="暂无岗位" description="开始添加你的第一个目标岗位" actionLabel="新增岗位" onAction={() => openCreate()} />
      ) : (
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">看板</TabsTrigger>
            <TabsTrigger value="table">表格</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban">
            <JobKanban jobs={filtered} onEdit={openEdit} onDelete={handleDelete} onAdd={openCreate} />
          </TabsContent>
          <TabsContent value="table">
            <JobTable jobs={filtered} onEdit={openEdit} onDelete={handleDelete} />
          </TabsContent>
        </Tabs>
      )}

      <JobFormDialog open={formOpen} onOpenChange={setFormOpen} job={editingJob} defaultStatus={defaultStatus} />

      <ConfirmDialog
        open={!!deleteJob}
        onOpenChange={() => setDeleteJob(null)}
        title="删除岗位"
        description={`确定删除「${deleteJob?.title}」？相关面试记录也将被删除。`}
        destructive
        confirmLabel="删除"
        onConfirm={() => {
          if (deleteJob) {
            removeJob(deleteJob.id)
            toast.success('岗位已删除')
          }
        }}
      />
    </div>
  )
}
