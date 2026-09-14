import type { LlmSettings } from '@/types'
import { chatJson, isLlmConfigured } from '@/lib/llm'

export const RESUME_ACCEPT =
  '.pdf,.doc,.docx,.txt,.md,.markdown,.html,.htm,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/html'

export const RESUME_MAX_BYTES = 8 * 1024 * 1024

const HEADING_RE =
  /^(#{1,3}\s*)?(教育背景|教育经历|教育|学历|自我评价|个人简介|个人总结|个人概述|专业技能|技能特长|技能|技术栈|工作经历|实习经历|项目经历|项目经验|项目|获奖|荣誉|校园经历|科研|论文|Education|Skills|Experience|Projects|Summary|Profile)\s*[:：]?$/i

export interface ExtractedResumeProject {
  title: string
  role: string
  period: string
  techStack: string[]
  description: string
  highlights: string
  challenges: string
}

export interface ParsedResume {
  summary: string
  education: string
  skills: string[]
  rawText: string
  sourceFileName: string
  projects: ExtractedResumeProject[]
}

function normalizeExt(name: string): string {
  const lower = name.toLowerCase()
  const i = lower.lastIndexOf('.')
  return i >= 0 ? lower.slice(i) : ''
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\u00a0/g, ' ')
}

function stripRtf(rtf: string): string {
  return rtf
    .replace(/\\'[0-9a-fA-F]{2}/g, ' ')
    .replace(/\\[a-zA-Z]+\d* ?/g, ' ')
    .replace(/[{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function extractPdf(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(line)
  }
  return pages.join('\n')
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  const mammothMod = await import('mammoth')
  const mammoth = mammothMod.default ?? mammothMod
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

export async function extractResumeText(file: File): Promise<string> {
  if (file.size > RESUME_MAX_BYTES) {
    throw new Error('文件过大，请上传 8MB 以内的简历')
  }

  const ext = normalizeExt(file.name)
  if (ext === '.doc') {
    throw new Error('暂不支持旧版 .doc，请另存为 .docx、PDF 或 TXT 后再上传')
  }

  if (ext === '.pdf' || file.type === 'application/pdf') {
    return cleanText(await extractPdf(await file.arrayBuffer()))
  }

  if (
    ext === '.docx' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return cleanText(await extractDocx(await file.arrayBuffer()))
  }

  const text = await file.text()
  if (ext === '.html' || ext === '.htm' || file.type === 'text/html') {
    return cleanText(stripHtml(text))
  }
  if (ext === '.rtf' || file.type === 'application/rtf' || file.type === 'text/rtf') {
    return cleanText(stripRtf(text))
  }
  if (
    ext === '.txt' ||
    ext === '.md' ||
    ext === '.markdown' ||
    file.type.startsWith('text/') ||
    file.type === ''
  ) {
    return cleanText(text)
  }

  throw new Error('不支持的文件格式，请上传 PDF、Word、Markdown 或 TXT')
}

function extractSection(lines: string[], names: string[]): string {
  const set = new Set(names.map((n) => n.toLowerCase()))
  let start = -1
  for (let i = 0; i < lines.length; i++) {
    const key = lines[i].replace(/^#{1,3}\s*/, '').replace(/[:：]$/, '').trim().toLowerCase()
    if (set.has(key)) {
      start = i + 1
      break
    }
  }
  if (start < 0) return ''

  const collected: string[] = []
  for (let i = start; i < lines.length; i++) {
    if (HEADING_RE.test(lines[i].trim())) break
    collected.push(lines[i])
  }
  return collected.join('\n').trim()
}

function parseSkills(block: string): string[] {
  if (!block) return []
  const parts = block
    .split(/[,，、;；|/｜\n]+/)
    .map((s) => s.replace(/^[-*•·\d.\s]+/, '').trim())
    .filter((s) => s.length >= 1 && s.length <= 24)
  return [...new Set(parts)].slice(0, 20)
}

export function parseResumeHeuristically(rawText: string, sourceFileName: string): ParsedResume {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
  const education = extractSection(lines, ['教育背景', '教育经历', '教育', '学历', 'education'])
  const skillBlock = extractSection(lines, ['专业技能', '技能特长', '技能', '技术栈', 'skills'])
  const summaryBlock =
    extractSection(lines, ['自我评价', '个人简介', '个人总结', '个人概述', 'summary', 'profile']) ||
    lines.slice(0, 4).join(' ')

  return {
    summary: summaryBlock.slice(0, 400),
    education: education.slice(0, 400),
    skills: parseSkills(skillBlock),
    rawText,
    sourceFileName,
    projects: [],
  }
}

export async function structureResumeWithLlm(
  settings: LlmSettings,
  rawText: string,
): Promise<Pick<ParsedResume, 'summary' | 'education' | 'skills' | 'projects'>> {
  const snippet = rawText.slice(0, 12000)
  const result = await chatJson<{
    summary?: string
    education?: string
    skills?: string[]
    projects?: ExtractedResumeProject[]
  }>(
    settings,
    [
      {
        role: 'system',
        content:
          '你是简历解析助手。从简历原文抽取结构化信息，返回 JSON：{"summary": string, "education": string, "skills": string[], "projects": [{"title": string, "role": string, "period": string, "techStack": string[], "description": string, "highlights": string, "challenges": string}]}。没有的字段用空字符串或空数组。不要编造原文没有的经历。skills 最多 20 个。projects 最多 8 个。',
      },
      { role: 'user', content: snippet },
    ],
    45000,
  )

  return {
    summary: (result.summary ?? '').trim(),
    education: (result.education ?? '').trim(),
    skills: (result.skills ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 20),
    projects: (result.projects ?? [])
      .filter((p) => p.title?.trim())
      .slice(0, 8)
      .map((p) => ({
        title: p.title.trim(),
        role: (p.role ?? '').trim(),
        period: (p.period ?? '').trim(),
        techStack: (p.techStack ?? []).map((t) => t.trim()).filter(Boolean),
        description: (p.description ?? '').trim(),
        highlights: (p.highlights ?? '').trim(),
        challenges: (p.challenges ?? '').trim(),
      })),
  }
}

export async function parseResumeFile(
  file: File,
  llm?: LlmSettings,
): Promise<ParsedResume> {
  const rawText = await extractResumeText(file)
  if (!rawText) throw new Error('未能从文件中解析出文本，请检查文件内容')

  const base = parseResumeHeuristically(rawText, file.name)
  if (!llm || !isLlmConfigured(llm)) return base

  try {
    const structured = await structureResumeWithLlm(llm, rawText)
    return {
      rawText,
      sourceFileName: file.name,
      summary: structured.summary || base.summary,
      education: structured.education || base.education,
      skills: structured.skills.length > 0 ? structured.skills : base.skills,
      projects: structured.projects,
    }
  } catch {
    return base
  }
}
