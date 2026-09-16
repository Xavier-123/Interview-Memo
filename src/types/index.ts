export type JobStatus =
  | 'applied'
  | 'written_test'
  | 'round1'
  | 'round2'
  | 'hr'
  | 'offer'
  | 'closed'

export type InterviewRound = '一面' | '二面' | '三面' | 'HR面' | '加面' | '笔试'

export const INTERVIEW_ROUNDS: InterviewRound[] = ['一面', '二面', '三面', 'HR面', '加面', '笔试']
export type InterviewMode = '视频' | '电话' | '现场'
export type InterviewStatus =
  | 'scheduled'
  | 'completed'
  | 'pending_feedback'
  | 'passed'
  | 'failed'
  | 'cancelled'

export type JobPriority = 'high' | 'medium' | 'low'
export type JobType = '算法' | '后端' | '全栈' | '前端' | '数据' | '其他'
export type Mastery = 'good' | 'fair' | 'poor'
export type ArchiveMethod = 'exact' | 'fuzzy' | 'llm' | 'manual'
export type Theme = 'light' | 'dark' | 'system'

export interface ReminderSettings {
  enabled: boolean
  leadMinutes: number[]
  browserNotification: boolean
}

export interface LlmSettings {
  enabled: boolean
  baseUrl: string
  apiKey: string
  model: string
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  leadMinutes: [1440, 60],
  browserNotification: false,
}

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  enabled: false,
  baseUrl: '',
  apiKey: '',
  model: 'gpt-4o-mini',
}

export const REMINDER_LEAD_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 1440, label: '1 天前' },
  { minutes: 180, label: '3 小时前' },
  { minutes: 60, label: '1 小时前' },
  { minutes: 15, label: '15 分钟前' },
]

export interface Company {
  id: string
  name: string
  industry: string
  location: string
  website?: string
  rating: number
  techDirections: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  companyId: string
  title: string
  salaryMin?: number
  salaryMax?: number
  salaryText: string
  location: string
  jobType: JobType
  status: JobStatus
  priority: JobPriority
  tags: string[]
  description: string
  jd: string
  source?: string
  appliedAt?: string
  resumeVersionId?: string
  createdAt: string
  updatedAt: string
}

export interface LearningItem {
  id: string
  text: string
  done: boolean
  knowledgeId?: string
}

export interface Interview {
  id: string
  jobId: string
  round: InterviewRound
  scheduledAt: string
  duration: number
  mode: InterviewMode
  interviewer: string
  status: InterviewStatus
  rating?: number
  notes: string
  learningItems: LearningItem[]
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  interviewId: string
  order: number
  question: string
  myAnswer: string
  feedback: string
  idealAnswer: string
  rating: number
  isWeak: boolean
  tags: string[]
  knowledgeId?: string
  archiveMethod?: ArchiveMethod
}

export interface Review {
  id: string
  interviewId: string
  overall: number
  difficulty: number
  techMatch: number
  jobMatch: number
  wentWell: string
  toImprove: string
  interviewerFocus: string
  frequentQuestions: string
  nextPrep: string
  summary: string
  updatedAt: string
}

export interface Knowledge {
  id: string
  title: string
  category: string
  subcategory: string
  idealAnswer: string
  myAnswer: string
  mastery: Mastery
  appearCount: number
  lastSeenAt?: string
  lastReviewedAt?: string
  tags: string[]
  sourceQuestionIds: string[]
  aliases: string[]
  notes: string
}

export interface Settings {
  userName: string
  theme: Theme
  seeded: boolean
  weekStartsOn: 0 | 1
  reminder: ReminderSettings
  llm: LlmSettings
  knowledgeCategories: Record<string, string[]>
  privacyMode?: boolean
}

export interface ResumeProfile {
  summary: string
  education: string
  skills: string[]
  rawText: string
  sourceFileName?: string
  updatedAt: string
  educations?: ResumeEducation[]
  experiences?: ResumeExperience[]
  otherInfo?: ResumeOtherInfo
}

export interface ResumeEducation {
  startMonth: string
  endMonth: string
  isCurrent: boolean
  school: string
  major: string
  degree: string
  customDegree?: string
}

export interface ResumeExperienceProject {
  title: string
  role: string
  period: string
  techStack: string[]
  description: string
  highlights: string
  challenges: string
}

export interface ResumeExperience {
  company: string
  role: string
  startMonth: string
  endMonth: string
  isCurrent: boolean
  description: string
  projects: ResumeExperienceProject[]
}

export interface ResumeOtherInfo {
  jobIntent: string
  location: string
  phone: string
  email: string
  homepage: string
  certificates: string[]
  languages: string[]
  honors: string
  additional: string
}

export interface Resume {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export interface ResumeProject {
  id: string
  title: string
  role: string
  period: string
  techStack: string[]
  description: string
  highlights: string
  challenges: string
  createdAt: string
  updatedAt: string
}

export interface ResumeProjectSnapshot {
  sourceProjectId?: string
  title: string
  role: string
  period: string
  techStack: string[]
  description: string
  highlights: string
  challenges: string
}

export interface ResumeVersion {
  id: string
  resumeId: string
  version: number
  summary: string
  education: string
  skills: string[]
  rawText: string
  sourceFileName?: string
  projectSnapshots: ResumeProjectSnapshot[]
  educations?: ResumeEducation[]
  experiences?: ResumeExperience[]
  otherInfo?: ResumeOtherInfo
  createdAt: string
  archivedAt?: string
}

export type MockInterviewMode = 'full' | 'project'
export type MockSessionStatus = 'active' | 'completed'

export interface MockMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface MockFeedback {
  overallScore: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestedQuestions: string[]
}

export interface MockSession {
  id: string
  mode: MockInterviewMode
  companyId?: string
  jobId?: string
  resumeVersionId?: string
  projectIds: string[]
  roundHint?: InterviewRound
  status: MockSessionStatus
  messages: MockMessage[]
  feedback?: MockFeedback
  createdAt: string
  updatedAt: string
}

export const DEFAULT_RESUME_PROFILE: Omit<ResumeProfile, 'updatedAt'> = {
  summary: '',
  education: '',
  skills: [],
  rawText: '',
  sourceFileName: '',
}

export const MOCK_MODE_LABELS: Record<MockInterviewMode, string> = {
  full: '完整模拟',
  project: '项目深挖',
}

export interface ExportData {
  schemaVersion: 2
  exportedAt: string
  companies: Company[]
  jobs: Job[]
  interviews: Interview[]
  questions: Question[]
  reviews: Review[]
  knowledge: Knowledge[]
  settings: Settings
  resumes: Resume[]
  resumeVersions: ResumeVersion[]
  projects: ResumeProject[]
  mockSessions: MockSession[]
}

export const JOB_STATUS_ORDER: JobStatus[] = [
  'applied',
  'written_test',
  'round1',
  'round2',
  'hr',
  'offer',
  'closed',
]

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  applied: '已投递',
  written_test: '笔试',
  round1: '一面',
  round2: '二面',
  hr: 'HR面',
  offer: 'Offer',
  closed: '已结束',
}

export const JOB_STATUS_META: Record<JobStatus, { color: string; dot: string }> = {
  applied: {
    color: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    dot: 'bg-blue-500',
  },
  written_test: {
    color: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
    dot: 'bg-sky-500',
  },
  round1: {
    color: 'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
    dot: 'bg-violet-500',
  },
  round2: {
    color: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
    dot: 'bg-purple-500',
  },
  hr: {
    color: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:border-fuchsia-500/30',
    dot: 'bg-fuchsia-500',
  },
  offer: {
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  closed: {
    color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/30',
    dot: 'bg-zinc-400',
  },
}

export const INTERVIEW_STATUS_META: Record<
  InterviewStatus,
  { label: string; color: string; dot: string }
> = {
  scheduled: {
    label: '待面试',
    color: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    dot: 'bg-amber-500',
  },
  completed: {
    label: '已完成',
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  pending_feedback: {
    label: '等待反馈',
    color: 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
    dot: 'bg-orange-500',
  },
  passed: {
    label: '已通过',
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: '未通过',
    color: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    dot: 'bg-rose-500',
  },
  cancelled: {
    label: '已取消',
    color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/30',
    dot: 'bg-zinc-400',
  },
}

export const MASTERY_META: Record<Mastery, { label: string; color: string; dot: string }> = {
  good: { label: '熟练', color: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  fair: { label: '一般', color: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  poor: { label: '不熟', color: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
}

export const KNOWLEDGE_CATEGORIES: Record<string, string[]> = {
  大模型基础: ['Transformer', 'Attention', 'KV Cache', 'Flash Attention'],
  SFT: ['数据构造', 'Loss', 'LoRA', 'DeepSpeed'],
  RL: ['PPO', 'DPO', 'GRPO', 'RLHF'],
  Agent: ['ReAct', 'Tool Calling', 'Agent SFT', 'Agent RL'],
  RAG: ['Retrieval', 'Rerank', 'GraphRAG', 'Evaluation'],
}

export const ROUND_TO_JOB_STATUS: Partial<Record<InterviewRound, JobStatus>> = {
  一面: 'round1',
  二面: 'round2',
  三面: 'round2',
  HR面: 'hr',
  加面: 'round2',
  笔试: 'written_test',
}
