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
import { MapPin, MoreHorizontal, Trash2, Pencil, Bot } from 'lucide-react'
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
import { JOB_STATUS_LABELS, JOB_STATUS_ORDER, type Job, type JobStatus } from '@/types'
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
      <Card className={cn('cursor-grab transition-shadow hover:shadow-md active:cursor-grabbing', isDragging && 'opacity-50')}>
        <CardContent className="p-3">
          <div className="mb-2 flex items-start justify-between">
            <p className="text-xs font-medium text-muted-foreground">🏢 {companyName}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6" onPointerDown={(e) => e.stopPropagation()}>
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
          <p className="text-sm font-medium leading-snug">
            <Link
              to={`/jobs/${job.id}`}
              className="hover:text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {job.title}
            </Link>
          </p>
          <Badge variant={job.resumeVersionId ? 'secondary' : 'destructive'} className="mt-2 text-[10px]">{formatResumeVersionLabel(resumeState, job.resumeVersionId)}</Badge>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</p>
            <p>💰 {job.salaryText}</p>
          </div>
          {nextInterview && (
            <div
              className={cn(
                'mt-2 rounded-md bg-accent/50 px-2 py-1 text-xs',
                urgencyCardClass(nextInterview.scheduledAt, nextInterview.status),
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p>下一轮：{nextInterview.round}</p>
                <UpcomingIndicator scheduledAt={nextInterview.scheduledAt} status={nextInterview.status} compact />
              </div>
              <p className="text-muted-foreground">{formatDateTime(nextInterview.scheduledAt)}</p>
            </div>
          )}
          {job.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {job.tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="outline" className="text-[10px] font-normal">#{t}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function JobCardPreview({ job, companyName }: { job: Job; companyName: string }) {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{companyName}</p>
        <p className="text-sm font-medium">{job.title}</p>
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
    const jobId = active.id as string
    const newStatus = over.id as JobStatus
    const job = jobs.find((j) => j.id === jobId)
    if (job && job.status !== newStatus && JOB_STATUS_ORDER.includes(newStatus)) {
      updateJobStatus(jobId, newStatus)
      toast.success(`已移动到「${JOB_STATUS_LABELS[newStatus]}」`)
      if (JOB_STATUS_ORDER.indexOf(newStatus) >= JOB_STATUS_ORDER.indexOf('applied') && !job.resumeVersionId) {
        toast.warning('该岗位尚未关联投递简历，可在编辑岗位时补录')
      }
    }
  }

  return (
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
        'flex w-[280px] shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors',
        isOver && 'border-primary bg-accent/20',
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{JOB_STATUS_LABELS[status]}</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">{jobs.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAdd}>
          +
        </Button>
      </div>
      <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2">
          {jobs.map((job) => (
            <SortableJobCard
              key={job.id}
              job={job}
              companyName={getCompanyName(companies, job.companyId)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
