import { differenceInDays, parseISO } from 'date-fns'
import type { AppState } from '@/store/useAppStore'
import { resolveJobContext } from '@/store/selectors'
import type { Mastery } from '@/types'
import { formatRelative } from '@/lib/date'

export interface TagStat {
  tag: string
  askedCount: number
  interviewCount: number
  avgRating: number
  weakCount: number
  weakRate: number
  lastAskedAt?: string
  companies: string[]
}

export interface KnowledgeStat {
  knowledgeId: string
  title: string
  appearCount: number
  avgRating: number
  weakCount: number
  weakRate: number
  lastSeenAt?: string
  companies: string[]
  rounds: string[]
  mastery: Mastery
}

export interface RoundStat {
  round: string
  count: number
  avgRating: number
  weakRate: number
}

export interface CompanyStat {
  companyId: string
  companyName: string
  count: number
  avgRating: number
  weakRate: number
}

export interface RatingTrendPoint {
  date: string
  label: string
  avgRating: number
  count: number
}

export interface LearningPriority {
  knowledgeId?: string
  title: string
  score: number
  reason: string
  tags: string[]
  mastery: Mastery
  appearCount: number
}

function getQuestionContext(state: AppState, interviewId: string) {
  const interview = state.interviews.find((i) => i.id === interviewId)
  if (!interview) return null
  const { job, company } = resolveJobContext(state, interview.jobId)
  return { interview, job, company }
}

export function buildTagStats(state: AppState): TagStat[] {
  const map = new Map<string, { ratings: number[]; weak: number; interviews: Set<string>; companies: Set<string>; last?: string }>()
  for (const q of state.questions) {
    const ctx = getQuestionContext(state, q.interviewId)
    for (const tag of q.tags.length ? q.tags : ['未分类']) {
      if (!map.has(tag)) map.set(tag, { ratings: [], weak: 0, interviews: new Set(), companies: new Set() })
      const entry = map.get(tag)!
      entry.ratings.push(q.rating)
      if (q.isWeak) entry.weak++
      entry.interviews.add(q.interviewId)
      if (ctx?.company) entry.companies.add(ctx.company.name)
      const at = ctx?.interview.scheduledAt
      if (at && (!entry.last || at > entry.last)) entry.last = at
    }
  }
  return Array.from(map.entries())
    .map(([tag, v]) => ({
      tag,
      askedCount: v.ratings.length,
      interviewCount: v.interviews.size,
      avgRating: v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length,
      weakCount: v.weak,
      weakRate: v.weak / v.ratings.length,
      lastAskedAt: v.last,
      companies: Array.from(v.companies),
    }))
    .sort((a, b) => b.askedCount - a.askedCount)
}

export function buildKnowledgeStats(state: AppState): KnowledgeStat[] {
  const grouped = new Map<string, typeof state.questions>()
  for (const q of state.questions) {
    if (!q.knowledgeId) continue
    if (!grouped.has(q.knowledgeId)) grouped.set(q.knowledgeId, [])
    grouped.get(q.knowledgeId)!.push(q)
  }
  return Array.from(grouped.entries())
    .map(([knowledgeId, qs]) => {
      const k = state.knowledge.find((x) => x.id === knowledgeId)
      const companies = new Set<string>()
      const rounds = new Set<string>()
      qs.forEach((q) => {
        const ctx = getQuestionContext(state, q.interviewId)
        if (ctx?.company) companies.add(ctx.company.name)
        if (ctx?.interview) rounds.add(ctx.interview.round)
      })
      const weak = qs.filter((q) => q.isWeak).length
      return {
        knowledgeId,
        title: k?.title ?? qs[0].question,
        appearCount: k?.appearCount ?? qs.length,
        avgRating: qs.reduce((a, q) => a + q.rating, 0) / qs.length,
        weakCount: weak,
        weakRate: weak / qs.length,
        lastSeenAt: k?.lastSeenAt,
        companies: Array.from(companies),
        rounds: Array.from(rounds),
        mastery: k?.mastery ?? 'fair',
      }
    })
    .sort((a, b) => b.appearCount - a.appearCount)
}

export function buildRoundStats(state: AppState): RoundStat[] {
  const map = new Map<string, { ratings: number[]; weak: number }>()
  for (const q of state.questions) {
    const ctx = getQuestionContext(state, q.interviewId)
    const round = ctx?.interview.round ?? '未知'
    if (!map.has(round)) map.set(round, { ratings: [], weak: 0 })
    const e = map.get(round)!
    e.ratings.push(q.rating)
    if (q.isWeak) e.weak++
  }
  return Array.from(map.entries()).map(([round, v]) => ({
    round,
    count: v.ratings.length,
    avgRating: v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length,
    weakRate: v.weak / v.ratings.length,
  }))
}

export function buildCompanyStats(state: AppState): CompanyStat[] {
  const map = new Map<string, { name: string; ratings: number[]; weak: number }>()
  for (const q of state.questions) {
    const ctx = getQuestionContext(state, q.interviewId)
    if (!ctx?.company) continue
    if (!map.has(ctx.company.id)) map.set(ctx.company.id, { name: ctx.company.name, ratings: [], weak: 0 })
    const e = map.get(ctx.company.id)!
    e.ratings.push(q.rating)
    if (q.isWeak) e.weak++
  }
  return Array.from(map.entries())
    .map(([companyId, v]) => ({
      companyId,
      companyName: v.name,
      count: v.ratings.length,
      avgRating: v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length,
      weakRate: v.weak / v.ratings.length,
    }))
    .sort((a, b) => b.count - a.count)
}

export function buildRatingTrend(state: AppState): RatingTrendPoint[] {
  const byInterview = new Map<string, { date: string; ratings: number[] }>()
  for (const q of state.questions) {
    const ctx = getQuestionContext(state, q.interviewId)
    if (!ctx) continue
    const key = ctx.interview.id
    if (!byInterview.has(key)) byInterview.set(key, { date: ctx.interview.scheduledAt, ratings: [] })
    byInterview.get(key)!.ratings.push(q.rating)
  }
  return Array.from(byInterview.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((v) => ({
      date: v.date,
      label: v.date.slice(0, 10),
      avgRating: v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length,
      count: v.ratings.length,
    }))
}

function masteryPenalty(m: Mastery): number {
  if (m === 'poor') return 1
  if (m === 'fair') return 0.5
  return 0
}

export function buildLearningPriorities(state: AppState, limit = 20): LearningPriority[] {
  const stats = buildKnowledgeStats(state)
  const tagStats = buildTagStats(state).filter((t) => t.askedCount >= 1)
  const maxAppear = Math.max(1, ...stats.map((s) => s.appearCount), ...tagStats.map((t) => t.askedCount))
  const now = new Date()
  const items: LearningPriority[] = []

  for (const s of stats) {
    const k = state.knowledge.find((x) => x.id === s.knowledgeId)
    const recency = s.lastSeenAt ? Math.max(0, 1 - differenceInDays(now, parseISO(s.lastSeenAt)) / 30) : 0.3
    const score =
      s.weakRate * 0.4 +
      (s.appearCount / maxAppear) * 0.3 +
      recency * 0.2 +
      masteryPenalty(s.mastery) * 0.1
    const parts: string[] = [`被问 ${s.appearCount} 次`]
    if (s.weakCount > 0) parts.push(`${s.weakCount} 次没答好`)
    if (s.mastery === 'poor') parts.push('题库标记不熟')
    if (s.lastSeenAt) parts.push(`最近 ${formatRelative(s.lastSeenAt)}`)
    items.push({
      knowledgeId: s.knowledgeId,
      title: s.title,
      score,
      reason: parts.join('，'),
      tags: k?.tags ?? [],
      mastery: s.mastery,
      appearCount: s.appearCount,
    })
  }

  for (const t of tagStats) {
    if (t.weakRate < 0.3 && t.avgRating >= 3.5) continue
    const existing = items.find((i) => i.title === t.tag || i.tags.includes(t.tag))
    if (existing) continue
    const recency = t.lastAskedAt ? Math.max(0, 1 - differenceInDays(now, parseISO(t.lastAskedAt)) / 30) : 0.2
    const score = t.weakRate * 0.4 + (t.askedCount / maxAppear) * 0.3 + recency * 0.2 + 0.1
    items.push({
      title: t.tag,
      score,
      reason: `标签被问 ${t.askedCount} 次，失分率 ${Math.round(t.weakRate * 100)}%`,
      tags: [t.tag],
      mastery: t.weakRate > 0.5 ? 'poor' : 'fair',
      appearCount: t.askedCount,
    })
  }

  return items.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function buildOverviewKpis(state: AppState) {
  const qs = state.questions
  const archived = qs.filter((q) => q.knowledgeId).length
  const weak = qs.filter((q) => q.isWeak).length
  return {
    totalQuestions: qs.length,
    avgRating: qs.length ? qs.reduce((a, q) => a + q.rating, 0) / qs.length : 0,
    weakRate: qs.length ? weak / qs.length : 0,
    archivedCount: archived,
  }
}
