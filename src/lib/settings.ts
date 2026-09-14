import { defaultSettings } from '@/data/seed'
import type {
  Job,
  Knowledge,
  Resume,
  ResumeProfile,
  ResumeProject,
  ResumeProjectSnapshot,
  ResumeVersion,
  Settings,
} from '@/types'
import { DEFAULT_LLM_SETTINGS, DEFAULT_REMINDER_SETTINGS, DEFAULT_RESUME_PROFILE } from '@/types'

export function normalizeSettings(settings?: Partial<Settings>): Settings {
  return {
    ...defaultSettings,
    ...settings,
    reminder: { ...DEFAULT_REMINDER_SETTINGS, ...settings?.reminder },
    llm: { ...DEFAULT_LLM_SETTINGS, ...settings?.llm },
    knowledgeCategories: settings?.knowledgeCategories ?? defaultSettings.knowledgeCategories,
  }
}

export function getDefaultKnowledgeCategory(settings: Settings): { category: string; subcategory: string } {
  const categories = settings.knowledgeCategories
  const firstCategory = Object.keys(categories)[0] ?? '其他'
  const firstSub = categories[firstCategory]?.[0] ?? ''
  return { category: firstCategory, subcategory: firstSub }
}

export function normalizeKnowledge(k: Knowledge): Knowledge {
  return { ...k, aliases: k.aliases ?? [] }
}

export function normalizeJob(j: Job): Job {
  return { ...j, jd: j.jd ?? '' }
}

export function normalizeResumeProfile(profile?: Partial<ResumeProfile>): ResumeProfile {
  return {
    ...DEFAULT_RESUME_PROFILE,
    ...profile,
    skills: profile?.skills ?? [],
    sourceFileName: profile?.sourceFileName ?? '',
    updatedAt: profile?.updatedAt ?? new Date().toISOString(),
  }
}

export function normalizeResumeProject(p: ResumeProject): ResumeProject {
  return {
    ...p,
    techStack: p.techStack ?? [],
    highlights: p.highlights ?? '',
    challenges: p.challenges ?? '',
  }
}

export function snapshotResumeProject(p: ResumeProject): ResumeProjectSnapshot {
  return {
    sourceProjectId: p.id,
    title: p.title,
    role: p.role,
    period: p.period,
    techStack: [...(p.techStack ?? [])],
    description: p.description,
    highlights: p.highlights ?? '',
    challenges: p.challenges ?? '',
  }
}

export function normalizeResume(resume: Resume): Resume {
  return { ...resume, name: resume.name.trim() || '未命名简历' }
}

export function normalizeResumeVersion(version: ResumeVersion): ResumeVersion {
  return {
    ...version,
    skills: version.skills ?? [],
    sourceFileName: version.sourceFileName ?? '',
    projectSnapshots: (version.projectSnapshots ?? []).map((project) => ({
      ...project,
      techStack: project.techStack ?? [],
      highlights: project.highlights ?? '',
      challenges: project.challenges ?? '',
    })),
  }
}
