import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, ArrowUpDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { JobStatusBadge } from '@/components/common/JobStatusBadge'
import { useAppStore } from '@/store/useAppStore'
import { formatResumeVersionLabel, getCompanyName } from '@/store/selectors'
import { JobRowActions } from '@/components/jobs/JobRowActions'
import type { Job } from '@/types'
import { cn } from '@/lib/utils'

interface JobTableProps {
  jobs: Job[]
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
}

export function JobTable({ jobs, onEdit, onDelete }: JobTableProps) {
  const companies = useAppStore((s) => s.companies)
  const resumes = useAppStore((s) => s.resumes)
  const resumeVersions = useAppStore((s) => s.resumeVersions)
  const resumeState = { resumes, resumeVersions }
  const [sortKey, setSortKey] = useState<'title' | 'status'>('title')

  const sorted = [...jobs].sort((a, b) => {
    if (sortKey === 'status') return a.status.localeCompare(b.status)
    return a.title.localeCompare(b.title)
  })

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => setSortKey('title')}>
                <span className="inline-flex items-center gap-1">
                  岗位
                  {sortKey === 'title' ? (
                    <ArrowUp className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                  )}
                </span>
              </TableHead>
              <TableHead>公司</TableHead>
              <TableHead>地点</TableHead>
              <TableHead>薪资</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => setSortKey('status')}>
                <span className="inline-flex items-center gap-1">
                  状态
                  {sortKey === 'status' ? (
                    <ArrowUp className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                  )}
                </span>
              </TableHead>
              <TableHead>投递简历</TableHead>
              <TableHead>标签</TableHead>
              <TableHead className="w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">
                  <Link to={`/jobs/${job.id}`} className="hover:text-primary hover:underline">
                    {job.title}
                  </Link>
                </TableCell>
                <TableCell>{getCompanyName(companies, job.companyId)}</TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell className="tabular-nums">{job.salaryText}</TableCell>
                <TableCell><JobStatusBadge status={job.status} closeReason={job.closeReason} /></TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-normal',
                      job.resumeVersionId ? 'text-muted-foreground' : 'border-destructive/40 text-destructive',
                    )}
                  >
                    {formatResumeVersionLabel(resumeState, job.resumeVersionId)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {job.tags.slice(0, 2).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <JobRowActions job={job} onEdit={onEdit} onDelete={onDelete} compact />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-3 md:hidden">
        {sorted.map((job) => (
          <div key={job.id} className="rounded-lg border p-4">
            <p className="font-medium">
              <Link to={`/jobs/${job.id}`} className="hover:text-primary hover:underline">
                {job.title}
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">{getCompanyName(companies, job.companyId)}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{job.location}</span>
              <span>{job.salaryText}</span>
            </div>
            <div className="mt-2"><JobStatusBadge status={job.status} closeReason={job.closeReason} /></div>
            <Badge
              variant="outline"
              className={cn(
                'mt-2 font-normal',
                job.resumeVersionId ? 'text-muted-foreground' : 'border-destructive/40 text-destructive',
              )}
            >
              {formatResumeVersionLabel(resumeState, job.resumeVersionId)}
            </Badge>
            <div className="mt-3">
              <JobRowActions job={job} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
