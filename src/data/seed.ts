import type {
  Company,
  ExportData,
  Interview,
  Job,
  Knowledge,
  Question,
  Resume,
  ResumeProject,
  ResumeVersion,
  Review,
  Settings,
} from '@/types'
import { DEFAULT_LLM_SETTINGS, DEFAULT_REMINDER_SETTINGS, KNOWLEDGE_CATEGORIES } from '@/types'

const now = new Date()
const iso = (offsetDays: number, hour = 14, minute = 0) => {
  const d = new Date(now)
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const defaultSettings: Settings = {
  userName: '求职者',
  theme: 'light',
  seeded: true,
  weekStartsOn: 1,
  reminder: { ...DEFAULT_REMINDER_SETTINGS },
  llm: { ...DEFAULT_LLM_SETTINGS },
  knowledgeCategories: { ...KNOWLEDGE_CATEGORIES },
}

export const seedCompanies: Company[] = [
  {
    id: 'c1',
    name: '马上消费金融',
    industry: '金融科技',
    location: '重庆',
    website: 'https://www.msxf.com',
    rating: 4,
    techDirections: ['大模型', 'Agent', 'RAG'],
    notes: '专注消费金融场景的大模型应用，技术栈偏 Python + PyTorch。',
    createdAt: iso(-30),
    updatedAt: iso(-5),
  },
  {
    id: 'c2',
    name: '某互联网科技公司',
    industry: '互联网',
    location: '北京',
    rating: 4.5,
    techDirections: ['大模型', 'Agent RL', 'vLLM'],
    notes: '大厂算法岗，面试节奏快，重视工程落地能力。',
    createdAt: iso(-25),
    updatedAt: iso(-3),
  },
]

export const seedJobs: Job[] = [
  {
    id: 'j1',
    companyId: 'c1',
    title: '大模型算法工程师',
    salaryText: '30-50K',
    location: '重庆',
    jobType: '算法',
    status: 'round1',
    priority: 'high',
    tags: ['LLM', 'RAG', 'Agent'],
    description: '负责消费金融场景的大模型应用研发',
    jd: '职责：\n1. 负责 RAG / Agent 系统设计与优化\n2. 参与模型训练与推理部署\n\n要求：\n- 熟悉 PyTorch、LangChain\n- 有大模型落地经验',
    resumeVersionId: 'rv2',
    createdAt: iso(-20),
    updatedAt: iso(-2),
  },
  {
    id: 'j2',
    companyId: 'c2',
    title: 'Agent 算法研究员',
    salaryText: '40-60K',
    location: '北京',
    jobType: '算法',
    status: 'applied',
    priority: 'medium',
    tags: ['Agent', 'GRPO', 'RLHF'],
    description: '研究 Agent 训练与推理优化',
    jd: '职责：\n1. Agent RL 训练 pipeline 设计\n2. Tool Calling 与多轮对话优化',
    resumeVersionId: 'rv3',
    createdAt: iso(-15),
    updatedAt: iso(-1),
  },
  {
    id: 'j3',
    companyId: 'c1',
    title: 'NLP 算法工程师',
    salaryText: '25-40K',
    location: '重庆',
    jobType: '算法',
    status: 'wishlist',
    priority: 'low',
    tags: ['NLP', 'SFT'],
    description: '文本理解与生成方向',
    jd: '负责 SFT 数据构造与模型微调。',
    createdAt: iso(-10),
    updatedAt: iso(-10),
  },
]

export const seedInterviews: Interview[] = [
  {
    id: 'i1',
    jobId: 'j1',
    round: '一面',
    scheduledAt: iso(0, 18),
    duration: 60,
    mode: '视频',
    interviewer: '张工',
    status: 'scheduled',
    notes: '',
    learningItems: [],
    createdAt: iso(-5),
    updatedAt: iso(-1),
  },
  {
    id: 'i2',
    jobId: 'j1',
    round: '笔试',
    scheduledAt: iso(-7, 10),
    duration: 90,
    mode: '视频',
    interviewer: '',
    status: 'completed',
    rating: 4,
    notes: '算法 + 系统设计',
    learningItems: [{ id: 'li1', text: '复习 GRPO 原理', done: false }],
    createdAt: iso(-14),
    updatedAt: iso(-7),
  },
]

export const seedQuestions: Question[] = [
  {
    id: 'q1',
    interviewId: 'i2',
    order: 1,
    question: '介绍一下 GRPO 和 PPO 的区别',
    myAnswer: 'GRPO 不需要 critic 网络...',
    feedback: '回答基本正确，但缺少公式细节',
    idealAnswer: 'GRPO 通过组内相对奖励估计 advantage，省去 value model',
    rating: 3,
    isWeak: true,
    tags: ['GRPO', 'RL'],
  },
  {
    id: 'q2',
    interviewId: 'i2',
    order: 2,
    question: 'RAG 系统如何评估检索质量',
    myAnswer: '用准确率评估',
    feedback: '评估维度不够全面',
    idealAnswer: 'Recall@K、MRR、Answer Faithfulness 等多维度评估',
    rating: 2,
    isWeak: true,
    tags: ['RAG', 'Evaluation'],
  },
  {
    id: 'q3',
    interviewId: 'i2',
    order: 3,
    question: 'LoRA 的原理是什么',
    myAnswer: '低秩分解适配',
    feedback: '回答简洁准确',
    idealAnswer: '在权重矩阵旁路注入低秩矩阵 ΔW=BA',
    rating: 4,
    isWeak: false,
    tags: ['LoRA', 'SFT'],
  },
]

export const seedReviews: Review[] = []

export const seedKnowledge: Knowledge[] = [
  {
    id: 'k1',
    title: 'GRPO 和 PPO 的区别',
    category: 'RL',
    subcategory: 'GRPO',
    idealAnswer: 'GRPO 通过组内相对奖励估计 advantage，省去 value model',
    myAnswer: 'GRPO 不需要 critic 网络',
    mastery: 'poor',
    appearCount: 1,
    lastSeenAt: iso(-7),
    tags: ['GRPO', 'RL'],
    sourceQuestionIds: ['q1'],
    aliases: [],
    notes: '',
  },
  {
    id: 'k2',
    title: 'RAG 评估指标',
    category: 'RAG',
    subcategory: 'Evaluation',
    idealAnswer: 'Recall@K、MRR、Answer Faithfulness 等',
    myAnswer: '用准确率评估',
    mastery: 'poor',
    appearCount: 1,
    lastSeenAt: iso(-7),
    tags: ['RAG', 'Evaluation'],
    sourceQuestionIds: ['q2'],
    aliases: [],
    notes: '不要用生成指标评估 RAG。',
  },
]

export const seedProjects: ResumeProject[] = [
  {
    id: 'p1',
    title: '企业知识库 RAG 平台',
    role: '核心开发',
    period: '2025.03 - 2025.10',
    techStack: ['Python', 'RAG', 'Milvus'],
    description: '面向企业文档的检索增强生成平台。',
    highlights: '优化混合检索与重排，提升回答命中率。',
    challenges: '长文档切分与召回噪声控制。',
    createdAt: iso(-60),
    updatedAt: iso(-12),
  },
  {
    id: 'p2',
    title: 'Agent 训练流水线',
    role: '算法工程师',
    period: '2025.08 - 至今',
    techStack: ['PyTorch', 'GRPO', 'Tool Calling'],
    description: '构建工具调用 Agent 的训练与评测流水线。',
    highlights: '统一数据构造、训练和离线评测流程。',
    challenges: '多轮轨迹质量与奖励稀疏问题。',
    createdAt: iso(-45),
    updatedAt: iso(-8),
  },
]

export const seedResumes: Resume[] = [
  { id: 'r1', name: '大模型工程版', createdAt: iso(-40), updatedAt: iso(-6) },
  { id: 'r2', name: 'Agent 研究版', createdAt: iso(-20), updatedAt: iso(-4) },
]

export const seedResumeVersions: ResumeVersion[] = [
  {
    id: 'rv1', resumeId: 'r1', version: 1,
    summary: '大模型应用工程师，关注 RAG 与推理服务。',
    education: '计算机相关专业硕士', skills: ['Python', 'PyTorch', 'RAG'],
    rawText: '大模型应用工程师，具备 RAG 平台建设经验。', sourceFileName: 'llm-engineer-v1.pdf',
    projectSnapshots: [], createdAt: iso(-40), archivedAt: iso(-6),
  },
  {
    id: 'rv2', resumeId: 'r1', version: 2,
    summary: '大模型应用工程师，擅长 RAG、Agent 与推理优化。',
    education: '计算机相关专业硕士', skills: ['Python', 'PyTorch', 'RAG', 'Agent'],
    rawText: '大模型应用工程师，具备 RAG 与 Agent 项目落地经验。', sourceFileName: 'llm-engineer-v2.pdf',
    projectSnapshots: [
      {
        sourceProjectId: 'p1', title: '企业知识库 RAG 平台', role: '核心开发', period: '2025.03 - 2025.10',
        techStack: ['Python', 'RAG', 'Milvus'], description: '面向企业文档的检索增强生成平台。',
        highlights: '优化混合检索与重排，提升回答命中率。', challenges: '长文档切分与召回噪声控制。',
      },
    ],
    createdAt: iso(-6),
  },
  {
    id: 'rv3', resumeId: 'r2', version: 1,
    summary: '专注 Agent 训练、强化学习与工具调用。',
    education: '计算机相关专业硕士', skills: ['Agent', 'GRPO', 'RLHF', 'Tool Calling'],
    rawText: 'Agent 算法研究方向，具备训练与评测流水线经验。', sourceFileName: 'agent-research.pdf',
    projectSnapshots: [
      {
        sourceProjectId: 'p2', title: 'Agent 训练流水线', role: '算法工程师', period: '2025.08 - 至今',
        techStack: ['PyTorch', 'GRPO', 'Tool Calling'], description: '构建工具调用 Agent 的训练与评测流水线。',
        highlights: '统一数据构造、训练和离线评测流程。', challenges: '多轮轨迹质量与奖励稀疏问题。',
      },
    ],
    createdAt: iso(-4),
  },
]

export function createSeedData(): ExportData {
  return {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    companies: seedCompanies,
    jobs: seedJobs,
    interviews: seedInterviews,
    questions: seedQuestions,
    reviews: seedReviews,
    knowledge: seedKnowledge,
    settings: defaultSettings,
    resumes: seedResumes,
    resumeVersions: seedResumeVersions,
    projects: seedProjects,
    mockSessions: [],
  }
}
