import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Banknote, Bot, Building2, MapPin, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useAppStore } from '@/store/useAppStore'
import { formatResumeVersionLabel, getCompanyName, selectJobNextInterview } from '@/store/selectors'
import { CloseJobDialog } from './CloseJobDialog'
import {
  JOB_CLOSE_REASON_LABELS,
  JOB_STATUS_LABELS,
  JOB_STATUS_META,
  JOB_STATUS_ORDER,
  type Job,
  type JobStatus,
} from '@/types'
import { formatDateTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import { UpcomingIndicator, urgencyCardClass } from '@/components/common/UpcomingIndicator'

interface JobCardProps {
  job: Job
  companyName: string
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
}

function SortableJobCard({ job, companyName, onEdit, onDelete }: JobCardProps) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: { job },
  })
  const nextInterview = useAppStore((s) => selectJobNextInterview(s, job.id))
  const resumes = useAppStore((s) => s.resumes)
  const resumeVersions = useAppStore((s) => s.resumeVersions)
  const resumeState = { resumes, resumeVersions }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={cn(
          'cursor-grab border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md active:cursor-grabbing',
          isDragging && 'opacity-40',
        )}
      >
        <CardContent className="p-3.5">
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{companyName}</span>
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground" onPointerDown={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/mock?jobId=${job.id}&mode=full&start=1`)}>
                  <Bot className="mr-2 h-4 w-4" /> 模拟面试
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(job)}>
                  <Pencil className="mr-2 h-4 w-4" /> 编辑
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(job)}>
                  <Trash2 className="mr-2 h-4 w-4" /> 删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm font-semibold leading-snug text-foreground">
            <Link
              to={`/jobs/${job.id}`}
              className="transition-colors hover:text-primary"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {job.title}
            </Link>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {job.location && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />{job.location}</span>
            )}
            {job.salaryText && (
              <span className="inline-flex items-center gap-1 font-medium text-foreground/80"><Banknote className="h-3 w-3 shrink-0 text-muted-foreground/70" />{job.salaryText}</span>
            )}
          </div>
          {nextInterview && (
            <div
              className={cn(
                'mt-2.5 rounded-lg border border-border/40 p-2 text-xs transition-colors',
                urgencyCardClass(nextInterview.scheduledAt, nextInterview.status),
              )}
            >
              <div className="flex items-center justify-between gap-1.5">
                <p className="font-medium text-foreground">下一轮：{nextInterview.round}</p>
                <UpcomingIndicator scheduledAt={nextInterview.scheduledAt} status={nextInterview.status} compact />
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(nextInterview.scheduledAt)}</p>
            </div>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {job.status === 'closed' && job.closeReason && (
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                  job.closeReason === 'offer_declined'
                    ? 'border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300'
                    : job.closeReason === 'other'
                    ? 'border border-zinc-500/25 bg-zinc-500/10 text-zinc-600 dark:border-zinc-500/30 dark:bg-zinc-500/15 dark:text-zinc-400'
                    : 'border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300',
                )}
              >
                {JOB_CLOSE_REASON_LABELS[job.closeReason]}
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-normal transition-colors',
                job.resumeVersionId
                  ? 'bg-muted/60 text-muted-foreground'
                  : 'border border-destructive/25 bg-destructive/10 text-destructive',
              )}
            >
              {formatResumeVersionLabel(resumeState, job.resumeVersionId)}
            </span>
            {job.tags.slice(0, 2).map((t) => (
              <span key={t} className="rounded-md bg-muted/40 px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
                #{t}
              </span>
            ))}
            {job.tags.length > 2 && (
              <span className="text-[10px] text-muted-foreground/70">+{job.tags.length - 2}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function JobCardPreview({ job, companyName }: { job: Job; companyName: string }) {
  return (
    <Card className="w-[260px] shadow-xl ring-1 ring-primary/20">
      <CardContent className="p-3.5">
        <p className="text-xs text-muted-foreground">{companyName}</p>
        <p className="mt-0.5 text-sm font-semibold">{job.title}</p>
      </CardContent>
    </Card>
  )
}

interface JobKanbanProps {
  jobs: Job[]
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
  onAdd: (status: JobStatus) => void
}

export function JobKanban({ jobs, onEdit, onDelete, onAdd }: JobKanbanProps) {
  const companies = useAppStore((s) => s.companies)
  const updateJobStatus = useAppStore((s) => s.updateJobStatus)
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [pendingCloseJob, setPendingCloseJob] = useState<Job | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const jobsByStatus = useMemo(() => {
    const map = {} as Record<JobStatus, Job[]>
    JOB_STATUS_ORDER.forEach((s) => { map[s] = [] })
    jobs.forEach((j) => map[j.status].push(j))
    return map
  }, [jobs])

  const onDragStart = (event: DragStartEvent) => {
    const job = jobs.find((j) => j.id === event.active.id)
    if (job) setActiveJob(job)
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveJob(null)
    const { active, over } = event
    if (!over) return
    // 碰撞检测可能解析到列内某张卡片（id 为岗位 id），此时取卡片所在的列
    const overId = over.id as string
    const targetStatus = JOB_STATUS_ORDER.includes(overId as JobStatus)
      ? (overId as JobStatus)
      : jobs.find((j) => j.id === overId)?.status
    if (!targetStatus) return
    const jobId = active.id as string
    const current = jobs.find((j) => j.id === jobId)
    if (!current || current.status === targetStatus) return

    if (targetStatus === 'closed') {
      setPendingCloseJob(current)
      return
    }

    updateJobStatus(jobId, targetStatus)
    toast.success(`已移动到「${JOB_STATUS_LABELS[targetStatus]}」`)
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {JOB_STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                jobs={jobsByStatus[status]}
                companies={companies}
                onEdit={onEdit}
                onDelete={onDelete}
                onAdd={() => onAdd(status)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <DragOverlay>{activeJob && <JobCardPreview job={activeJob} companyName={getCompanyName(companies, activeJob.companyId)} />}</DragOverlay>
      </DndContext>

      <CloseJobDialog
        open={!!pendingCloseJob}
        onOpenChange={(open) => {
          if (!open) setPendingCloseJob(null)
        }}
        job={pendingCloseJob}
        onConfirm={(reason) => {
          if (pendingCloseJob) {
            updateJobStatus(pendingCloseJob.id, 'closed', reason)
            toast.success(`已移动到「已结束 · ${JOB_CLOSE_REASON_LABELS[reason]}」`)
            setPendingCloseJob(null)
          }
        }}
      />
    </>
  )
}

function KanbanColumn({
  status,
  jobs,
  companies,
  onEdit,
  onDelete,
  onAdd,
}: {
  status: JobStatus
  jobs: Job[]
  companies: { id: string; name: string }[]
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
  onAdd: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-[280px] shrink-0 flex-col rounded-xl border border-border/60 bg-muted/25 transition-all duration-150',
        isOver && 'border-primary/50 bg-primary/[0.03] shadow-xs',
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', JOB_STATUS_META[status].dot)} />
          <span className="text-sm font-semibold tracking-tight">{JOB_STATUS_LABELS[status]}</span>
          <Badge variant="secondary" className="h-5 rounded-full px-1.5 text-[11px] font-medium text-muted-foreground">{jobs.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground" onClick={onAdd} aria-label="新增岗位">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2">
          {jobs.length === 0 ? (
            <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-border/40 p-4 text-center text-xs text-muted-foreground/60">
              拖拽岗位到这里
            </div>
          ) : (
            jobs.map((job) => (
              <SortableJobCard
                key={job.id}
                job={job}
                companyName={getCompanyName(companies, job.companyId)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}
