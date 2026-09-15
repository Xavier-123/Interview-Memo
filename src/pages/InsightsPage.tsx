import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  BarChart3,
  Building2,
  Copy,
  FileQuestion,
  Flame,
  Layers,
  ListOrdered,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChartTooltip } from '@/components/common/ChartTooltip'
import { EmptyState } from '@/components/common/EmptyState'
import { StatCard } from '@/components/common/StatCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/store/useAppStore'
import type { AppState } from '@/store/useAppStore'
import {
  buildCompanyStats,
  buildKnowledgeStats,
  buildLearningPriorities,
  buildOverviewKpis,
  buildRatingTrend,
  buildRoundStats,
  buildTagStats,
} from '@/store/analytics'
import { isLlmConfigured, generateLearningAdvice } from '@/lib/llm'
import { MASTERY_META } from '@/types'
import { cn } from '@/lib/utils'

const AXIS_TICK = { fontSize: 11, fill: 'var(--muted-foreground)' } as const

function weakRateClass(rate: number) {
  if (rate >= 0.5) return 'text-destructive font-medium'
  if (rate >= 0.3) return 'text-amber-600 dark:text-amber-400 font-medium'
  return 'text-muted-foreground'
}

export function InsightsPage() {
  const updateKnowledge = useAppStore((s) => s.updateKnowledge)
  const addLearningItemsToNextInterview = useAppStore((s) => s.addLearningItemsToNextInterview)
  const settings = useAppStore((s) => s.settings)
  const questionCount = useAppStore((s) => s.questions.length)
  const questions = useAppStore((s) => s.questions)
  const knowledge = useAppStore((s) => s.knowledge)
  const interviews = useAppStore((s) => s.interviews)
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const reviews = useAppStore((s) => s.reviews)
  const [aiAdvice, setAiAdvice] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const slice = useMemo(
    () => ({ jobs, interviews, companies, reviews, questions, knowledge } as AppState),
    [jobs, interviews, companies, reviews, questions, knowledge],
  )

  const kpis = useMemo(() => buildOverviewKpis(slice), [slice])
  const tagStats = useMemo(() => buildTagStats(slice), [slice])
  const knowledgeStats = useMemo(() => buildKnowledgeStats(slice), [slice])
  const roundStats = useMemo(() => buildRoundStats(slice), [slice])
  const companyStats = useMemo(() => buildCompanyStats(slice), [slice])
  const ratingTrend = useMemo(() => buildRatingTrend(slice), [slice])
  const priorities = useMemo(() => buildLearningPriorities(slice, 15), [slice])

  const topAsked = tagStats.slice(0, 10)
  const topWeak = tagStats.filter((t) => t.askedCount >= 2).sort((a, b) => b.weakRate - a.weakRate).slice(0, 8)

  const handleAiAdvice = async () => {
    if (!isLlmConfigured(settings.llm)) {
      toast.error('请先在设置中配置大模型 API')
      return
    }
    setAiLoading(true)
    try {
      const advice = await generateLearningAdvice(
        settings.llm,
        priorities.slice(0, 8).map((p) => ({ title: p.title, reason: p.reason })),
      )
      setAiAdvice(advice)
    } catch {
      toast.error('AI 建议生成失败')
    } finally {
      setAiLoading(false)
    }
  }

  const handleBatchLearning = () => {
    addLearningItemsToNextInterview(
      priorities.slice(0, 5).map((p) => ({ text: p.title, knowledgeId: p.knowledgeId })),
    )
    toast.success('已加入下一场面试的待学习清单')
  }

  if (questionCount < 3) {
    return (
      <div>
        <PageHeader icon={BarChart3} title="分析" description="复盘统计与薄弱项分析" />
        <EmptyState
          icon={BarChart3}
          title="数据不足"
          description="至少记录 3 道面试问题后，才能生成统计分析"
          actionLabel="去记录面试"
          onAction={() => window.location.assign('/interviews')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader icon={BarChart3} title="分析" description="找出高频考点与薄弱项，生成学习重点" />

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">复盘统计</TabsTrigger>
          <TabsTrigger value="weak">薄弱项分析</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="记录问题" value={kpis.totalQuestions} icon={FileQuestion} tone="primary" />
            <StatCard label="平均得分" value={kpis.avgRating.toFixed(1)} icon={Star} tone="info" />
            <StatCard label="失分率" value={`${Math.round(kpis.weakRate * 100)}%`} icon={TrendingDown} tone="destructive" />
            <StatCard label="已归档" value={kpis.archivedCount} icon={Archive} tone="success" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-primary" />
                  最容易被问（标签 Top 10）
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAsked} layout="vertical" margin={{ left: 4, right: 16 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="tag"
                      width={88}
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<ChartTooltip valueFormatter={(v) => `${v} 次`} />}
                      cursor={{ fill: 'var(--muted)', fillOpacity: 0.5 }}
                    />
                    <Bar dataKey="askedCount" fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  最容易失分（失分率，至少 2 次）
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {topWeak.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">暂无足够数据</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topWeak.map((t) => ({ ...t, weakPct: Math.round(t.weakRate * 100) }))} layout="vertical" margin={{ left: 4, right: 16 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" unit="%" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="tag"
                        width={88}
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<ChartTooltip valueFormatter={(v) => `${v}%`} />}
                        cursor={{ fill: 'var(--muted)', fillOpacity: 0.5 }}
                      />
                      <Bar dataKey="weakPct" fill="var(--chart-5)" radius={[0, 6, 6, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                得分趋势
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {ratingTrend.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">暂无趋势数据</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratingTrend}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                    <YAxis domain={[1, 5]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v} 分`} />} />
                    <Line
                      type="monotone"
                      dataKey="avgRating"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  按轮次
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>轮次</TableHead>
                      <TableHead>题数</TableHead>
                      <TableHead>均分</TableHead>
                      <TableHead>失分率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roundStats.map((r) => (
                      <TableRow key={r.round}>
                        <TableCell>{r.round}</TableCell>
                        <TableCell className="tabular-nums">{r.count}</TableCell>
                        <TableCell className="tabular-nums">{r.avgRating.toFixed(1)}</TableCell>
                        <TableCell className={cn('tabular-nums', weakRateClass(r.weakRate))}>
                          {Math.round(r.weakRate * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  按公司
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>公司</TableHead>
                      <TableHead>题数</TableHead>
                      <TableHead>均分</TableHead>
                      <TableHead>失分率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyStats.map((c) => (
                      <TableRow key={c.companyId}>
                        <TableCell>{c.companyName}</TableCell>
                        <TableCell className="tabular-nums">{c.count}</TableCell>
                        <TableCell className="tabular-nums">{c.avgRating.toFixed(1)}</TableCell>
                        <TableCell className={cn('tabular-nums', weakRateClass(c.weakRate))}>
                          {Math.round(c.weakRate * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-primary" />
                高频题 Top
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {knowledgeStats.slice(0, 8).map((k) => (
                <Link
                  key={k.knowledgeId}
                  to={`/knowledge?focus=${k.knowledgeId}`}
                  className="flex items-center justify-between rounded-md border p-3 text-sm transition-all hover:border-primary/40 hover:bg-accent/30 hover:shadow-sm"
                >
                  <span className="min-w-0 truncate">{k.title}</span>
                  <Badge variant="secondary" className="shrink-0 font-normal">
                    出现 {k.appearCount} 次 · 均分 {k.avgRating.toFixed(1)}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weak" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleBatchLearning}>一键加入下一场待学习</Button>
            {isLlmConfigured(settings.llm) && (
              <Button variant="outline" onClick={handleAiAdvice} disabled={aiLoading}>
                <Sparkles className="h-4 w-4" /> {aiLoading ? '生成中...' : 'AI 学习建议'}
              </Button>
            )}
          </div>

          {aiAdvice && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">AI 学习建议</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(aiAdvice); toast.success('已复制') }}>
                  <Copy className="h-4 w-4" /> 复制
                </Button>
              </CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{aiAdvice}</p></CardContent>
            </Card>
          )}

          {priorities.map((p) => (
            <Card key={p.knowledgeId ?? p.title}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{p.title}</p>
                      <Badge variant="outline" className={cn('gap-1.5', MASTERY_META[p.mastery].color)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', MASTERY_META[p.mastery].dot)} />
                        {MASTERY_META[p.mastery].label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>)}
                    </div>
                    <Progress value={Math.min(100, p.score * 100)} className="mt-3 h-1.5" />
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {p.knowledgeId && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/knowledge?focus=${p.knowledgeId}`}>查看题库</Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        addLearningItemsToNextInterview([{ text: p.title, knowledgeId: p.knowledgeId }])
                        toast.success('已加入待学习')
                      }}
                    >
                      加入待学习
                    </Button>
                    {p.knowledgeId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateKnowledge(p.knowledgeId!, { mastery: 'good', lastReviewedAt: new Date().toISOString() })
                          toast.success('已标记为熟练')
                        }}
                      >
                        标记已掌握
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
