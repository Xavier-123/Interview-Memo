import { z } from 'zod'
import type { ExportData, Job, Resume, ResumeVersion } from '@/types'
import { createSeedData } from '@/data/seed'
import { normalizeJob, normalizeResume, normalizeResumeProfile, normalizeResumeVersion, normalizeSettings, snapshotResumeProject } from '@/lib/settings'

const reminderSchema = z.object({
  enabled: z.boolean(),
  leadMinutes: z.array(z.number()),
  browserNotification: z.boolean(),
})

const llmSchema = z.object({
  enabled: z.boolean(),
  baseUrl: z.string(),
  apiKey: z.string(),
  model: z.string(),
})

const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
  location: z.string(),
  website: z.string().optional(),
  rating: z.number(),
  techDirections: z.array(z.string()),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const jobSchema = z
  .object({
    id: z.string(),
    companyId: z.string(),
    title: z.string(),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    salaryText: z.string(),
    location: z.string(),
    jobType: z.string(),
    status: z.string(),
    closeReason: z.string().optional(),
    closedFromStatus: z.string().optional(),
    priority: z.string(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    jd: z.string().optional(),
    source: z.string().optional(),
    appliedAt: z.string().optional(),
    resumeVersionId: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough()

const interviewSchema = z
  .object({
    id: z.string(),
    jobId: z.string(),
    round: z.string(),
    scheduledAt: z.string(),
    duration: z.number(),
    mode: z.string(),
    interviewer: z.string().optional(),
    status: z.string(),
    rating: z.number().optional(),
    notes: z.string().optional(),
    learningItems: z.array(z.any()).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough()

const questionSchema = z
  .object({
    id: z.string(),
    interviewId: z.string(),
    order: z.number(),
    question: z.string(),
    myAnswer: z.string().optional(),
    feedback: z.string().optional(),
    idealAnswer: z.string().optional(),
    rating: z.number(),
    isWeak: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    knowledgeId: z.string().optional(),
    archiveMethod: z.string().optional(),
  })
  .passthrough()

const reviewSchema = z
  .object({
    id: z.string(),
    interviewId: z.string(),
    overall: z.number(),
    difficulty: z.number(),
    techMatch: z.number(),
    jobMatch: z.number(),
    wentWell: z.string().optional(),
    toImprove: z.string().optional(),
    interviewerFocus: z.string().optional(),
    frequentQuestions: z.string().optional(),
    nextPrep: z.string().optional(),
    summary: z.string().optional(),
    updatedAt: z.string(),
  })
  .passthrough()

const knowledgeSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    subcategory: z.string().optional(),
    idealAnswer: z.string().optional(),
    myAnswer: z.string().optional(),
    mastery: z.enum(['good', 'fair', 'poor']),
    appearCount: z.number(),
    lastSeenAt: z.string().optional(),
    lastReviewedAt: z.string().optional(),
    tags: z.array(z.string()).optional(),
    sourceQuestionIds: z.array(z.string()).optional(),
    aliases: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })
  .passthrough()

const resumeSchema = z
  .object({
    summary: z.string().optional(),
    education: z.string().optional(),
    skills: z.array(z.string()).optional(),
    rawText: z.string().optional(),
    sourceFileName: z.string().optional(),
    updatedAt: z.string(),
  })
  .passthrough()

const projectSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    role: z.string().optional(),
    period: z.string().optional(),
    techStack: z.array(z.string()).optional(),
    description: z.string().optional(),
    highlights: z.string().optional(),
    challenges: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough()

const mockSessionSchema = z
  .object({
    id: z.string(),
    mode: z.enum(['full', 'project']),
    companyId: z.string().optional(),
    jobId: z.string().optional(),
    resumeVersionId: z.string().optional(),
    projectIds: z.array(z.string()).optional(),
    roundHint: z.string().optional(),
    status: z.enum(['active', 'completed']),
    messages: z.array(z.any()).optional(),
    feedback: z.any().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough()

const settingsSchema = z.object({
  userName: z.string(),
  theme: z.enum(['light', 'dark', 'system']),
  seeded: z.boolean(),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  reminder: reminderSchema.optional(),
  llm: llmSchema.optional(),
  knowledgeCategories: z.record(z.string(), z.array(z.string())).optional(),
})

const legacyExportSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  companies: z.array(companySchema),
  jobs: z.array(jobSchema),
  interviews: z.array(interviewSchema),
  questions: z.array(questionSchema),
  reviews: z.array(reviewSchema),
  knowledge: z.array(knowledgeSchema),
  settings: settingsSchema,
  resume: resumeSchema.optional(),
  projects: z.array(projectSchema).optional(),
  mockSessions: z.array(mockSessionSchema).optional(),
})

const resumeSchemaV2 = z.object({
  id: z.string(), name: z.string(), createdAt: z.string(), updatedAt: z.string(), archivedAt: z.string().optional(),
})
const resumeVersionSchemaV2 = z.object({
  id: z.string(), resumeId: z.string(), version: z.number(), summary: z.string(), education: z.string(),
  skills: z.array(z.string()), rawText: z.string(), sourceFileName: z.string().optional(),
  projectSnapshots: z.array(z.any()), createdAt: z.string(), archivedAt: z.string().optional(),
})
const exportSchemaV2 = z.object({
  schemaVersion: z.literal(2), exportedAt: z.string(), companies: z.array(companySchema), jobs: z.array(jobSchema),
  interviews: z.array(interviewSchema), questions: z.array(questionSchema), reviews: z.array(reviewSchema),
  knowledge: z.array(knowledgeSchema), settings: settingsSchema, resumes: z.array(resumeSchemaV2),
  resumeVersions: z.array(resumeVersionSchemaV2), projects: z.array(projectSchema).default([]), mockSessions: z.array(mockSessionSchema).default([]),
})

export function formatImportError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const first = error.issues[0]
    if (first) return `导入失败：${first.path.join('.')} — ${first.message}`
    return '导入失败：数据格式无效'
  }
  if (error instanceof Error) return error.message
  return '导入失败：JSON 格式无效'
}

export function validateImportData(data: unknown): ExportData {
  const raw = data as { schemaVersion?: number }
  if (raw?.schemaVersion === 1) {
    const parsed = legacyExportSchema.parse(data)
    const profile = normalizeResumeProfile(parsed.resume)
    const hasContent = !!(profile.summary.trim() || profile.education.trim() || profile.rawText.trim() || profile.skills.length)
    const resumes: Resume[] = hasContent
      ? [{ id: 'legacy-resume', name: '默认简历', createdAt: profile.updatedAt, updatedAt: profile.updatedAt }]
      : []
    const resumeVersions: ResumeVersion[] = hasContent
      ? [{
          id: 'legacy-resume-v1', resumeId: 'legacy-resume', version: 1, summary: profile.summary,
          education: profile.education, skills: profile.skills, rawText: profile.rawText,
          sourceFileName: profile.sourceFileName, projectSnapshots: (parsed.projects ?? []).map((p) => snapshotResumeProject(p as any)),
          createdAt: profile.updatedAt,
        }]
      : []
    return {
      ...parsed,
      schemaVersion: 2,
      jobs: parsed.jobs.map((job) => normalizeJob(job as Job)),
      settings: normalizeSettings(parsed.settings),
      resumes,
      resumeVersions,
      projects: parsed.projects ?? [],
      mockSessions: (parsed.mockSessions ?? []).map((session) => session.mode === 'full' && hasContent ? { ...session, resumeVersionId: 'legacy-resume-v1' } : session),
    } as ExportData
  }
  const parsed = exportSchemaV2.parse(data)
  const resumeIds = new Set(parsed.resumes.map((item) => item.id))
  if (parsed.resumeVersions.some((version) => !resumeIds.has(version.resumeId))) {
    throw new Error('导入失败：存在未关联简历的版本')
  }
  const versionIds = new Set(parsed.resumeVersions.map((item) => item.id))
  if (parsed.jobs.some((job) => job.resumeVersionId && !versionIds.has(job.resumeVersionId))) {
    throw new Error('导入失败：岗位引用了不存在的简历版本')
  }
  if (parsed.mockSessions.some((session) => session.resumeVersionId && !versionIds.has(session.resumeVersionId))) {
    throw new Error('导入失败：模拟会话引用了不存在的简历版本')
  }
  return {
    ...parsed,
    jobs: parsed.jobs.map((job) => normalizeJob(job as Job)),
    resumes: parsed.resumes.map(normalizeResume),
    resumeVersions: parsed.resumeVersions.map((version) => normalizeResumeVersion(version as ResumeVersion)),
    settings: normalizeSettings(parsed.settings),
  } as ExportData
}

export function downloadJson(data: ExportData, filename = 'interview-memo-export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function getDemoData(): ExportData {
  return createSeedData()
}
