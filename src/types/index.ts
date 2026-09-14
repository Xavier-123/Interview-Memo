export type JobStatus =
  | 'wishlist'
  | 'applied'
  | 'screening'
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
}

export interface ResumeProfile {
  summary: string
  education: string
  skills: string[]
  rawText: string
  sourceFileName?: string
  updatedAt: string
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
  'wishlist',
  'applied',
  'screening',
  'round1',
  'round2',
  'hr',
  'offer',
  'closed',
]

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  wishlist: '待投递',
  applied: '已投递',
  screening: '简历通过',
  round1: '一面',
  round2: '二面',
  hr: 'HR面',
  offer: 'Offer',
  closed: '已结束',
}

export const INTERVIEW_STATUS_META: Record<
  InterviewStatus,
  { label: string; color: string; dot: string }
> = {
  scheduled: { label: '待面试', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
  pending_feedback: { label: '等待反馈', color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  passed: { label: '已通过', color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
  failed: { label: '未通过', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800 border-gray-200', dot: 'bg-gray-400' },
}

export const MASTERY_META: Record<Mastery, { label: string; emoji: string; color: string }> = {
  good: { label: '熟练', emoji: '🟢', color: 'text-green-600' },
  fair: { label: '一般', emoji: '🟡', color: 'text-yellow-600' },
  poor: { label: '不熟', emoji: '🔴', color: 'text-red-600' },
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
  笔试: 'screening',
}
