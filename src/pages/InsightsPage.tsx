import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Copy, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
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

const COLORS = ['hsl(232 60% 56%)', 'hsl(160 60% 45%)', 'hsl(45 90% 55%)', 'hsl(280 65% 60%)', 'hsl(0 72% 55%)']

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
        <PageHeader title="分析" description="复盘统计与薄弱项分析" />
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
      <PageHeader title="分析" description="找出高频考点与薄弱项，生成学习重点" />

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">复盘统计</TabsTrigger>
          <TabsTrigger value="weak">薄弱项分析</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="记录问题" value={kpis.totalQuestions} />
            <StatCard label="平均得分" value={kpis.avgRating.toFixed(1)} />
            <StatCard label="失分率" value={`${Math.round(kpis.weakRate * 100)}%`} />
            <StatCard label="已归档" value={kpis.archivedCount} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>最容易被问（标签 Top 10）</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAsked} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="tag" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="askedCount" radius={[0, 4, 4, 0]}>
                      {topAsked.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>最容易失分（失分率，至少 2 次）</CardTitle></CardHeader>
              <CardContent className="h-72">
                {topWeak.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">暂无足够数据</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topWeak.map((t) => ({ ...t, weakPct: Math.round(t.weakRate * 100) }))} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" unit="%" />
                      <YAxis type="category" dataKey="tag" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v}%`, '失分率']} />
                      <Bar dataKey="weakPct" fill="hsl(0 72% 55%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>得分趋势</CardTitle></CardHeader>
            <CardContent className="h-64">
              {ratingTrend.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">暂无趋势数据</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratingTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[1, 5]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgRating" stroke="hsl(232 60% 56%)" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>按轮次</CardTitle></CardHeader>
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
                        <TableCell>{r.count}</TableCell>
                        <TableCell>{r.avgRating.toFixed(1)}</TableCell>
                        <TableCell>{Math.round(r.weakRate * 100)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>按公司</CardTitle></CardHeader>
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
                        <TableCell>{c.count}</TableCell>
                        <TableCell>{c.avgRating.toFixed(1)}</TableCell>
                        <TableCell>{Math.round(c.weakRate * 100)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>高频题 Top</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {knowledgeStats.slice(0, 8).map((k) => (
                <Link
                  key={k.knowledgeId}
                  to={`/knowledge?focus=${k.knowledgeId}`}
                  className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-accent/50"
                >
                  <span>{k.title}</span>
                  <Badge variant="secondary">出现 {k.appearCount} 次 · 均分 {k.avgRating.toFixed(1)}</Badge>
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
                      <Badge variant="outline" className={MASTERY_META[p.mastery].color}>
                        {MASTERY_META[p.mastery].emoji} {MASTERY_META[p.mastery].label}
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
