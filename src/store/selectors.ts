import type {
  Company,
  ExportData,
  Interview,
  Job,
  JobStatus,
  Knowledge,
  Mastery,
  Question,
  Review,
  Resume,
  ResumeVersion,
  Settings,
} from '@/types'
import type { AppState } from './useAppStore'
import { getDefaultKnowledgeCategory } from '@/lib/settings'
import { differenceInDays, parseISO } from 'date-fns'

export interface Kpis {
  applied: number
  interviewing: number
  offer: number
  closed: number
}

export interface FunnelItem {
  stage: JobStatus
  label: string
  count: number
}

export interface EnrichedInterview extends Interview {
  job?: Job
  company?: Company
  hasReview: boolean
  resumeVersion?: ResumeVersion
  resume?: Resume
}

export function selectKpis(state: AppState): Kpis {
  const jobs = state.jobs
  return {
    applied: jobs.length,
    interviewing: jobs.filter((j) =>
      ['screening', 'written_test', 'round1', 'round2', 'hr'].includes(j.status),
    ).length,
    offer: jobs.filter((j) => j.status === 'offer').length,
    closed: jobs.filter((j) => j.status === 'closed').length,
  }
}

export function selectFunnel(state: AppState): FunnelItem[] {
  const labels: Record<JobStatus, string> = {
    applied: '已投递',
    screening: '简历通过',
    written_test: '笔试',
    round1: '一面',
    round2: '二面',
    hr: 'HR',
    offer: 'Offer',
    closed: '已结束',
  }
  const stages: JobStatus[] = ['applied', 'screening', 'written_test', 'round1', 'round2', 'hr', 'offer']
  return stages.map((stage) => ({
    stage,
    label: labels[stage],
    count: state.jobs.filter((j) => {
      const order = ['applied', 'screening', 'written_test', 'round1', 'round2', 'hr', 'offer', 'closed']
      return order.indexOf(j.status) >= order.indexOf(stage)
    }).length,
  }))
}

export function getCompanyName(
  companies: Pick<Company, 'id' | 'name'>[],
  companyId: string,
  fallback = '未知公司',
): string {
  return companies.find((c) => c.id === companyId)?.name ?? fallback
}

export function resolveJobContext(
  state: Pick<AppState, 'jobs' | 'companies'>,
  jobId: string,
): { job?: Job; company?: Company } {
  const job = state.jobs.find((j) => j.id === jobId)
  const company = job ? state.companies.find((c) => c.id === job.companyId) : undefined
  return { job, company }
}

export function enrichInterview(state: AppState, interview: Interview): EnrichedInterview {
  const { job, company } = resolveJobContext(state, interview.jobId)
  const hasReview = state.reviews.some((r) => r.interviewId === interview.id)
  const resumeVersion = job?.resumeVersionId
    ? (state.resumeVersions ?? []).find((version) => version.id === job.resumeVersionId)
    : undefined
  const resume = resumeVersion ? (state.resumes ?? []).find((item) => item.id === resumeVersion.resumeId) : undefined
  return { ...interview, job, company, hasReview, resumeVersion, resume }
}

export function enrichInterviews(
  state: AppState,
  interviews: Interview[],
): EnrichedInterview[] {
  return interviews.map((i) => enrichInterview(state, i))
}

export function selectUpcomingInterviews(state: AppState): EnrichedInterview[] {
  const now = new Date()
  return state.interviews
    .filter((i) => i.status === 'scheduled' && new Date(i.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .map((i) => enrichInterview(state, i))
}

export function selectUpcomingInterviews24h(state: AppState): EnrichedInterview[] {
  const now = new Date()
  const in24h = now.getTime() + 24 * 60 * 60 * 1000
  const filtered = state.interviews.filter(
    (i) =>
      i.status === 'scheduled' &&
      new Date(i.scheduledAt).getTime() >= now.getTime() &&
      new Date(i.scheduledAt).getTime() <= in24h,
  )
  return enrichInterviews(state, filtered).sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )
}

export const selectAllEnrichedInterviews = (state: AppState) => enrichInterviews(state, state.interviews)

export const selectDashboardRecent = (state: AppState) => selectRecentInterviews(state, 5)

export function selectRecentInterviews(state: AppState, limit = 5): EnrichedInterview[] {
  return [...state.interviews]
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, limit)
    .map((i) => enrichInterview(state, i))
}

export function selectJobInterviews(state: AppState, jobId: string): EnrichedInterview[] {
  return state.interviews
    .filter((i) => i.jobId === jobId)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .map((i) => enrichInterview(state, i))
}

export function selectJobNextInterview(state: AppState, jobId: string): Interview | undefined {
  const now = new Date()
  return state.interviews
    .filter((i) => i.jobId === jobId && i.status === 'scheduled' && new Date(i.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]
}

export function selectCompanyProgress(state: Pick<AppState, 'jobs'>, companyId: string): JobStatus | undefined {
  const order: JobStatus[] = ['applied', 'screening', 'written_test', 'round1', 'round2', 'hr', 'offer', 'closed']
  const jobs = state.jobs.filter((j) => j.companyId === companyId)
  if (jobs.length === 0) return undefined
  return jobs.reduce((max, j) => (order.indexOf(j.status) > order.indexOf(max) ? j.status : max), 'applied' as JobStatus)
}

export function selectPoorKnowledge(state: AppState, limit = 5): Knowledge[] {
  return state.knowledge
    .filter((k) => k.mastery === 'poor')
    .sort((a, b) => (b.appearCount ?? 0) - (a.appearCount ?? 0))
    .slice(0, limit)
}

const REVIEW_INTERVAL_DAYS: Record<Mastery, number> = {
  poor: 3,
  fair: 7,
  good: 21,
}

export function selectReviewQueue(state: AppState): Knowledge[] {
  const now = new Date()
  return state.knowledge
    .filter((k) => {
      const baseline = k.lastReviewedAt ?? k.lastSeenAt
      if (!baseline) return true
      const days = differenceInDays(now, parseISO(baseline))
      return days >= REVIEW_INTERVAL_DAYS[k.mastery]
    })
    .sort((a, b) => {
      const aBase = a.lastReviewedAt ?? a.lastSeenAt ?? ''
      const bBase = b.lastReviewedAt ?? b.lastSeenAt ?? ''
      if (!aBase && bBase) return -1
      if (aBase && !bBase) return 1
      if (!aBase || !bBase) return 0
      return new Date(aBase).getTime() - new Date(bBase).getTime()
    })
}

export function selectKnowledgeByCategory(state: AppState): Record<string, Knowledge[]> {
  const grouped: Record<string, Knowledge[]> = {}
  for (const k of state.knowledge) {
    if (!grouped[k.category]) grouped[k.category] = []
    grouped[k.category].push(k)
  }
  return grouped
}

export function selectAllTags(state: AppState): string[] {
  const tags = new Set<string>()
  state.jobs.forEach((j) => j.tags.forEach((t) => tags.add(t)))
  state.questions.forEach((q) => q.tags.forEach((t) => tags.add(t)))
  state.knowledge.forEach((k) => k.tags.forEach((t) => tags.add(t)))
  return Array.from(tags).sort()
}

export function selectInterviewQuestions(state: AppState, interviewId: string): Question[] {
  return state.questions
    .filter((q) => q.interviewId === interviewId)
    .sort((a, b) => a.order - b.order)
}

export function selectWeakQuestions(state: AppState, interviewId: string): Question[] {
  return selectInterviewQuestions(state, interviewId).filter((q) => q.isWeak)
}

export function selectReviewForInterview(state: AppState, interviewId: string): Review | undefined {
  return state.reviews.find((r) => r.interviewId === interviewId)
}

export function selectCompanyJobs(state: AppState, companyId: string): Job[] {
  return state.jobs.filter((j) => j.companyId === companyId)
}

export function selectCompanyInterviews(state: AppState, companyId: string): EnrichedInterview[] {
  const jobIds = new Set(state.jobs.filter((j) => j.companyId === companyId).map((j) => j.id))
  return state.interviews
    .filter((i) => jobIds.has(i.jobId))
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .map((i) => enrichInterview(state, i))
}

export function selectCompletedInterviewsForReview(state: AppState): EnrichedInterview[] {
  return state.interviews
    .filter((i) => ['completed', 'passed', 'failed', 'pending_feedback'].includes(i.status))
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .map((i) => enrichInterview(state, i))
}

export function getCompany(state: AppState, id: string): Company | undefined {
  return state.companies.find((c) => c.id === id)
}

export function getJob(state: AppState, id: string): Job | undefined {
  return state.jobs.find((j) => j.id === id)
}

export function getInterview(state: AppState, id: string): Interview | undefined {
  return state.interviews.find((i) => i.id === id)
}

export function getResumeVersion(state: Pick<AppState, 'resumes' | 'resumeVersions'>, id?: string) {
  const version = id ? state.resumeVersions.find((item) => item.id === id) : undefined
  const resume = version ? state.resumes.find((item) => item.id === version.resumeId) : undefined
  return { version, resume }
}

export function formatResumeVersionLabel(
  state: Pick<AppState, 'resumes' | 'resumeVersions'>,
  id?: string,
): string {
  const { version, resume } = getResumeVersion(state, id)
  if (!id) return '未关联简历'
  if (!version || !resume) return '简历版本不可用'
  return `${resume.name} · v${version.version}`
}

export function toExportData(state: AppState): ExportData {
  return {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    companies: state.companies,
    jobs: state.jobs,
    interviews: state.interviews,
    questions: state.questions,
    reviews: state.reviews,
    knowledge: state.knowledge,
    settings: {
      ...state.settings,
      llm: { ...state.settings.llm, apiKey: '' },
    },
    resumes: state.resumes,
    resumeVersions: state.resumeVersions,
    projects: state.projects,
    mockSessions: state.mockSessions,
  }
}

export function generateReviewSummary(
  review: Partial<Review>,
  weakQuestions: Question[],
  learningItems: { text: string; done: boolean }[],
): string {
  const parts: string[] = []
  if (review.overall) parts.push(`本次面试整体评价 ${review.overall}/5`)
  if (review.toImprove) parts.push(`需改进：${review.toImprove}`)
  if (weakQuestions.length > 0) {
    parts.push(`薄弱问题：${weakQuestions.map((q) => q.question).join('；')}`)
  }
  const pending = learningItems.filter((l) => !l.done)
  if (pending.length > 0) {
    parts.push(`待学习：${pending.map((l) => l.text).join('、')}`)
  }
  if (review.nextPrep) parts.push(`下次准备：${review.nextPrep}`)
  return parts.join('\n\n')
}

export function inferCategoryFromTags(
  tags: string[],
  settings?: Settings,
): { category: string; subcategory: string } {
  const map: Record<string, { category: string; subcategory: string }> = {
    GRPO: { category: 'RL', subcategory: 'GRPO' },
    PPO: { category: 'RL', subcategory: 'PPO' },
    DPO: { category: 'RL', subcategory: 'DPO' },
    RLHF: { category: 'RL', subcategory: 'RLHF' },
    LoRA: { category: 'SFT', subcategory: 'LoRA' },
    SFT: { category: 'SFT', subcategory: '数据构造' },
    ReAct: { category: 'Agent', subcategory: 'ReAct' },
    RAG: { category: 'RAG', subcategory: 'Retrieval' },
    GraphRAG: { category: 'RAG', subcategory: 'GraphRAG' },
    Evaluation: { category: 'RAG', subcategory: 'Evaluation' },
    Agent: { category: 'Agent', subcategory: 'Agent SFT' },
  }
  for (const tag of tags) {
    if (map[tag]) return map[tag]
  }
  if (settings) return getDefaultKnowledgeCategory(settings)
  return { category: '大模型基础', subcategory: 'Transformer' }
}

export type { Mastery }
