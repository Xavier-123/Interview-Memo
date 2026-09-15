import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/common/TagInput'
import { useAppStore } from '@/store/useAppStore'
import type { AppState } from '@/store/useAppStore'
import { resolveJobContext, selectReviewQueue } from '@/store/selectors'
import { MASTERY_META, type Knowledge, type Mastery } from '@/types'
import { getDefaultKnowledgeCategory } from '@/lib/settings'
import { formatDate, formatDateTime } from '@/lib/date'
import { cn } from '@/lib/utils'

export function KnowledgePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const knowledge = useAppStore((s) => s.knowledge)
  const settings = useAppStore((s) => s.settings)
  const addKnowledge = useAppStore((s) => s.addKnowledge)
  const updateKnowledge = useAppStore((s) => s.updateKnowledge)
  const interviews = useAppStore((s) => s.interviews)
  const questions = useAppStore((s) => s.questions)
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const categories = settings.knowledgeCategories

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [masteryFilter, setMasteryFilter] = useState<string>('all')
  const [dueOnly, setDueOnly] = useState(searchParams.get('due') === '1')
  const [selected, setSelected] = useState<Knowledge | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)

  const defaultCat = getDefaultKnowledgeCategory(settings)
  const [form, setForm] = useState({
    title: '',
    category: defaultCat.category,
    subcategory: defaultCat.subcategory,
    idealAnswer: '',
    myAnswer: '',
    mastery: 'fair' as Mastery,
    tags: [] as string[],
    notes: '',
  })

  const reviewQueue = useMemo(
    () => selectReviewQueue({ knowledge, settings } as AppState),
    [knowledge, settings],
  )
  const dueIds = useMemo(() => new Set(reviewQueue.map((k) => k.id)), [reviewQueue])

  const openEdit = (k: Knowledge) => {
    setSelected(k)
    setIsNew(false)
    setForm({
      title: k.title,
      category: k.category,
      subcategory: k.subcategory,
      idealAnswer: k.idealAnswer,
      myAnswer: k.myAnswer,
      mastery: k.mastery,
      tags: k.tags,
      notes: k.notes,
    })
    setDrawerOpen(true)
  }

  const openNew = () => {
    const cat = getDefaultKnowledgeCategory(settings)
    setSelected(null)
    setIsNew(true)
    setForm({
      title: '',
      category: cat.category,
      subcategory: cat.subcategory,
      idealAnswer: '',
      myAnswer: '',
      mastery: 'fair',
      tags: [],
      notes: '',
    })
    setDrawerOpen(true)
  }

  useEffect(() => {
    const focus = searchParams.get('focus')
    if (focus) {
      const k = knowledge.find((x) => x.id === focus)
      if (k) openEdit(k)
      setSearchParams({})
      return
    }
    if (searchParams.get('new') === '1') {
      openNew()
      setSearchParams({})
      return
    }
    if (searchParams.get('due') === '1') {
      setDueOnly(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams, knowledge])

  const filtered = useMemo(() => {
    return knowledge.filter((k) => {
      const matchSearch = !search || k.title.toLowerCase().includes(search.toLowerCase())
      const matchCat = category === 'all' || k.category === category
      const matchMastery = masteryFilter === 'all' || k.mastery === masteryFilter
      const matchDue = !dueOnly || dueIds.has(k.id)
      return matchSearch && matchCat && matchMastery && matchDue
    })
  }, [knowledge, search, category, masteryFilter, dueOnly, dueIds])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    knowledge.forEach((k) => { counts[k.category] = (counts[k.category] ?? 0) + 1 })
    return counts
  }, [knowledge])

  const recordReview = (id: string, mastery: Mastery) => {
    updateKnowledge(id, { mastery, lastReviewedAt: new Date().toISOString() })
    toast.success('复习记录已更新')
  }

  const save = () => {
    if (!form.title.trim()) {
      toast.error('请填写标题')
      return
    }
    if (isNew) {
      addKnowledge({ ...form, appearCount: 0, sourceQuestionIds: [], aliases: [] })
      toast.success('已添加')
    } else if (selected) {
      updateKnowledge(selected.id, form)
      toast.success('已更新')
    }
    setDrawerOpen(false)
  }

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="题库 / 知识库"
        description="个人面试题库，追踪掌握程度"
        actions={<Button onClick={openNew}><Plus className="h-4 w-4" /> 新增题目</Button>}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 lg:w-56">
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">分类</p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                category === 'all' ? 'bg-primary/10 font-medium text-primary' : 'hover:text-foreground',
              )}
            >
              全部 <Badge variant="secondary">{knowledge.length}</Badge>
            </button>
            {Object.entries(categories).map(([cat, subs]) => (
              <div key={cat}>
                <button
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                    category === cat ? 'bg-primary/10 font-medium text-primary' : 'hover:text-foreground',
                  )}
                >
                  {cat} <Badge variant="secondary">{categoryCounts[cat] ?? 0}</Badge>
                </button>
                {category === cat && (
                  <div className="ml-3 space-y-0.5 border-l pl-2">
                    {subs.map((sub) => (
                      <p key={sub} className="px-2 py-1 text-xs text-muted-foreground">{sub}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-4 flex flex-wrap gap-3">
            <SearchInput value={search} onChange={setSearch} className="sm:w-64" />
            <Select value={masteryFilter} onValueChange={setMasteryFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="掌握度" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="good">熟练</SelectItem>
                <SelectItem value="fair">一般</SelectItem>
                <SelectItem value="poor">不熟</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={dueOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDueOnly((v) => !v)}
            >
              待复习 {reviewQueue.length}
            </Button>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={BookOpen} title="暂无题目" actionLabel="新增题目" onAction={openNew} />
          ) : (
            <div className="space-y-2">
              {filtered.map((k) => (
                <div
                  key={k.id}
                  className="flex flex-col gap-2 rounded-lg border p-4 transition-all hover:border-primary/40 hover:bg-accent/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <button type="button" onClick={() => openEdit(k)} className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{k.title}</p>
                      {dueIds.has(k.id) && <Badge variant="destructive">待复习</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{k.category} / {k.subcategory}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {k.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>)}
                    </div>
                  </button>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className={cn('flex items-center gap-1.5', MASTERY_META[k.mastery].color)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', MASTERY_META[k.mastery].dot)} />
                        {MASTERY_META[k.mastery].label}
                      </span>
                      <span>出现 {k.appearCount} 次</span>
                      {k.lastSeenAt && <span>最近 {formatDate(k.lastSeenAt)}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                        onClick={() => recordReview(k.id, 'good')}
                      >
                        记住了
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        onClick={() => recordReview(k.id, 'fair')}
                      >
                        模糊
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => recordReview(k.id, 'poor')}
                      >
                        忘了
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{isNew ? '新增题目' : '编辑题目'}</SheetTitle></SheetHeader>
          <div className="mt-6 grid gap-4">
            <div className="space-y-2"><Label>问题</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>分类</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(categories).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>子分类</Label>
                <Input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2"><Label>标准答案</Label><Textarea value={form.idealAnswer} onChange={(e) => setForm({ ...form, idealAnswer: e.target.value })} rows={4} /></div>
            <div className="space-y-2"><Label>我的答案</Label><Textarea value={form.myAnswer} onChange={(e) => setForm({ ...form, myAnswer: e.target.value })} rows={3} /></div>
            <div className="space-y-2">
              <Label>掌握程度</Label>
              <Select value={form.mastery} onValueChange={(v) => setForm({ ...form, mastery: v as Mastery })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      熟练
                    </span>
                  </SelectItem>
                  <SelectItem value="fair">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      一般
                    </span>
                  </SelectItem>
                  <SelectItem value="poor">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      不熟
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>标签</Label><TagInput tags={form.tags} onChange={(tags) => setForm({ ...form, tags })} /></div>
            <div className="space-y-2"><Label>备注</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            {!isNew && selected && (
              <>
                {selected.aliases.length > 0 && (
                  <div className="space-y-2">
                    <Label>别名表述</Label>
                    <div className="flex flex-wrap gap-1">
                      {selected.aliases.map((a) => (
                        <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>出现记录</Label>
                  <div className="space-y-2">
                    {selected.sourceQuestionIds.map((qid) => {
                      const q = questions.find((x) => x.id === qid)
                      if (!q) return null
                      const iv = interviews.find((i) => i.id === q.interviewId)
                      const { job, company } = iv
                        ? resolveJobContext({ jobs, companies }, iv.jobId)
                        : { job: undefined, company: undefined }
                      return (
                        <Link
                          key={qid}
                          to={`/interviews/${q.interviewId}`}
                          className="block rounded-md border p-2 text-sm transition-colors hover:bg-accent/50"
                        >
                          <p className="font-medium">{company?.name} · {job?.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {iv?.round} · {iv ? formatDateTime(iv.scheduledAt) : ''} · 评分 {q.rating}/5
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{q.question}</p>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
            <Button onClick={save}>保存</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
