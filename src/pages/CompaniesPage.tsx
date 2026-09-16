import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Banknote, Building2, Briefcase, SignalHigh, Star } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { JobStatusBadge } from '@/components/common/JobStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from '@/components/common/TagInput'
import { useAppStore } from '@/store/useAppStore'
import { selectCompanyProgress } from '@/store/selectors'
import type { Company } from '@/types'
import { cn } from '@/lib/utils'

const AVATAR_COLORS = [
  'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
]

const avatarColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Company | null
}) {
  const addCompany = useAppStore((s) => s.addCompany)
  const updateCompany = useAppStore((s) => s.updateCompany)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [rating, setRating] = useState('4')
  const [techDirections, setTechDirections] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open && company) {
      setName(company.name)
      setIndustry(company.industry)
      setLocation(company.location)
      setWebsite(company.website ?? '')
      setRating(String(company.rating))
      setTechDirections(company.techDirections)
      setNotes(company.notes)
    } else if (open) {
      setName('')
      setIndustry('')
      setLocation('')
      setWebsite('')
      setRating('4')
      setTechDirections([])
      setNotes('')
    }
  }, [open, company])

  const save = () => {
    if (!name.trim()) {
      toast.error('请填写公司名称')
      return
    }
    const data = {
      name: name.trim(),
      industry: industry || '其他',
      location: location || '未知',
      website: website || undefined,
      rating: parseFloat(rating) || 3,
      techDirections,
      notes,
    }
    if (company) {
      updateCompany(company.id, data)
      toast.success('公司已更新')
    } else {
      addCompany(data)
      toast.success('公司已创建')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{company ? '编辑公司' : '新增公司'}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2"><Label>名称</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>行业</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} /></div>
            <div className="space-y-2"><Label>地点</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>网站</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
            <div className="space-y-2"><Label>评分 (1-5)</Label><Input type="number" min={1} max={5} step={0.5} value={rating} onChange={(e) => setRating(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>技术方向</Label><TagInput tags={techDirections} onChange={setTechDirections} placeholder="大模型, Agent..." /></div>
          <div className="space-y-2"><Label>备注</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={save}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const companies = useAppStore((s) => s.companies)
  const jobs = useAppStore((s) => s.jobs)
  const removeCompany = useAppStore((s) => s.removeCompany)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormOpen(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  return (
    <div>
      <PageHeader
        icon={Building2}
        title="公司管理"
        description="维护公司维度信息，关联多个岗位和面试"
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="h-4 w-4" /> 新增公司</Button>}
      />

      {companies.length === 0 ? (
        <EmptyState icon={Building2} title="暂无公司" actionLabel="新增公司" onAction={() => setFormOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companies.map((c) => {
            const companyJobs = jobs.filter((j) => j.companyId === c.id)
            const progress = selectCompanyProgress({ jobs }, c.id)
            const salaries = companyJobs.map((j) => j.salaryText).filter(Boolean)
            return (
              <Card key={c.id} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-base font-semibold',
                        avatarColor(c.name),
                      )}
                      aria-hidden
                    >
                      {c.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/companies/${c.id}`} className="font-semibold hover:text-primary">{c.name}</Link>
                      <p className="truncate text-sm text-muted-foreground">{c.industry} · {c.location}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 text-sm tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {c.rating}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <p className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      岗位 {companyJobs.length} 个
                    </p>
                    <p className="flex items-center gap-1.5">
                      <SignalHigh className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      进度 {progress ? <JobStatusBadge status={progress} /> : <span className="text-muted-foreground">暂无岗位</span>}
                    </p>
                    {salaries[0] && (
                      <p className="flex items-center gap-1.5 tabular-nums">
                        <Banknote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {salaries[0]}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.techDirections.slice(0, 3).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" asChild><Link to={`/companies/${c.id}`}>详情</Link></Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditing(c); setFormOpen(true) }}>编辑</Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(c)}>删除</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CompanyFormDialog open={formOpen} onOpenChange={setFormOpen} company={editing} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="删除公司"
        description={`确定删除「${deleteTarget?.name}」及其所有岗位和面试？`}
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            removeCompany(deleteTarget.id)
            toast.success('已删除')
          }
        }}
      />
    </div>
  )
}
