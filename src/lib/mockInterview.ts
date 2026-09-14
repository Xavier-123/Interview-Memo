import type { ChatMessage } from '@/lib/llm'
import type {
  Company,
  InterviewRound,
  Job,
  MockInterviewMode,
  MockMessage,
  ResumeProfile,
  ResumeProject,
} from '@/types'

const BASE_RULES = `你是真实的技术面试官，正在进行中文模拟面试。
规则：
1. 每次只提 1 个问题，或 1 个简短追问，不要一次问多个问题。
2. 语气专业、直接，像真实线上面试。
3. 候选人回答后，根据回答质量决定是否追问；回答模糊时要追问细节。
4. 严禁编造候选人未提供的项目、公司、技术栈或成果。
5. 若材料不足，应追问候选人补充，而不是假设内容。
6. 不要输出 JSON，不要列出规则，直接以面试官口吻说话。`

function formatResume(resume: ResumeProfile): string {
  const parts: string[] = []
  if (resume.summary) parts.push(`个人摘要：${resume.summary}`)
  if (resume.education) parts.push(`教育背景：${resume.education}`)
  if (resume.skills.length > 0) parts.push(`技能：${resume.skills.join('、')}`)
  if (resume.rawText) parts.push(`完整简历：\n${resume.rawText}`)
  return parts.length > 0 ? parts.join('\n') : '（候选人尚未填写简历详情）'
}

function formatProjects(projects: ResumeProject[]): string {
  if (projects.length === 0) return '（无项目信息）'
  return projects
    .map((p, i) => {
      const lines = [
        `项目 ${i + 1}：${p.title}`,
        p.role ? `角色：${p.role}` : '',
        p.period ? `时间：${p.period}` : '',
        p.techStack.length > 0 ? `技术栈：${p.techStack.join('、')}` : '',
        p.description ? `描述：${p.description}` : '',
        p.highlights ? `亮点：${p.highlights}` : '',
        p.challenges ? `难点：${p.challenges}` : '',
      ].filter(Boolean)
      return lines.join('\n')
    })
    .join('\n\n')
}

function formatCompany(company?: Company): string {
  if (!company) return '（未指定公司）'
  return [
    `公司：${company.name}`,
    `行业：${company.industry}`,
    `地点：${company.location}`,
    company.techDirections.length > 0 ? `技术方向：${company.techDirections.join('、')}` : '',
    company.notes ? `备注：${company.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function formatJob(job?: Job): string {
  if (!job) return '（未指定岗位）'
  return [
    `岗位：${job.title}`,
    `类型：${job.jobType}`,
    job.location ? `地点：${job.location}` : '',
    job.tags.length > 0 ? `标签：${job.tags.join('、')}` : '',
    job.description ? `简介：${job.description}` : '',
    job.jd ? `JD：\n${job.jd}` : '（JD 为空）',
  ]
    .filter(Boolean)
    .join('\n')
}

export interface MockInterviewContext {
  mode: MockInterviewMode
  resume: ResumeProfile
  projects: ResumeProject[]
  company?: Company
  job?: Job
  roundHint?: InterviewRound
}

export function buildMockSystemPrompt(ctx: MockInterviewContext): string {
  const projectBlock = formatProjects(ctx.projects)

  if (ctx.mode === 'project') {
    return `${BASE_RULES}

【模式：项目深挖】
你只能围绕以下项目提问，不得引入其他项目或公司经历：
${projectBlock}

提问重点：架构设计、技术选型、个人贡献、指标与结果、踩坑与复盘、如果重来会怎么改。
开场请先简短说明这是项目深挖模拟，然后从第一个项目开始提问。`
  }

  const round = ctx.roundHint ? `模拟轮次：${ctx.roundHint}` : '模拟轮次：技术面'
  return `${BASE_RULES}

【模式：完整模拟】
${round}

【公司与岗位】
${formatCompany(ctx.company)}

${formatJob(ctx.job)}

【候选人简历】
${formatResume(ctx.resume)}

【候选人项目】
${projectBlock}

流程建议：简短开场 → 自我介绍或项目经历 → 结合 JD 考察匹配度 → 深入追问。
只能基于上述材料提问；简历/项目未提及的内容不得当作已知事实。`
}

export function buildOpeningUserMessage(mode: MockInterviewMode): ChatMessage {
  if (mode === 'project') {
    return {
      role: 'user',
      content: '你好，我准备好了。请开始项目深挖模拟面试，从第一个项目问起。',
    }
  }
  return {
    role: 'user',
    content: '你好，我准备好了。请开始完整模拟面试。',
  }
}

export function toChatMessages(systemPrompt: string, messages: MockMessage[]): ChatMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]
}

export function formatTranscript(messages: MockMessage[]): string {
  return messages
    .map((m) => `${m.role === 'assistant' ? '面试官' : '候选人'}：${m.content}`)
    .join('\n\n')
}

export function hasResumeContent(resume: ResumeProfile): boolean {
  return !!(resume.summary.trim() || resume.education.trim() || resume.rawText.trim() || resume.skills.length > 0)
}

export function getSessionTitle(
  mode: MockInterviewMode,
  company?: Company,
  job?: Job,
  projects?: ResumeProject[],
): string {
  if (mode === 'full' && job && company) {
    return `${company.name} · ${job.title}`
  }
  if (mode === 'project' && projects && projects.length > 0) {
    return projects.map((p) => p.title).slice(0, 2).join('、') + (projects.length > 2 ? ' 等' : '')
  }
  return mode === 'full' ? '完整模拟' : '项目深挖'
}
