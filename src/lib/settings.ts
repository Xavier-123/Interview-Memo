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
  ResumeEducation,
  ResumeExperience,
  ResumeOtherInfo,
} from '@/types'
import { DEFAULT_LLM_SETTINGS, DEFAULT_REMINDER_SETTINGS, DEFAULT_RESUME_PROFILE } from '@/types'

export function normalizeSettings(settings?: Partial<Settings>): Settings {
  return {
    ...defaultSettings,
    ...settings,
    reminder: { ...DEFAULT_REMINDER_SETTINGS, ...settings?.reminder },
    llm: { ...DEFAULT_LLM_SETTINGS, ...settings?.llm },
    knowledgeCategories: settings?.knowledgeCategories ?? defaultSettings.knowledgeCategories,
    privacyMode: settings?.privacyMode ?? defaultSettings.privacyMode ?? false,
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
  // Keep old persisted/imported data usable after removing the wishlist and screening stages.
  const legacyStatus = (j as { status?: string }).status
  const status = legacyStatus === 'wishlist' || legacyStatus === 'screening' ? 'applied' : j.status
  return { ...j, status: status as Job['status'], jd: j.jd ?? '' }
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
  const defaultOtherInfo: ResumeOtherInfo = {
    jobIntent: '', location: '', phone: '', email: '', homepage: '',
    certificates: [], languages: [], honors: '', additional: '',
  }
  const educations: ResumeEducation[] = (version.educations ?? []).map((item) => ({
    startMonth: item.startMonth ?? '', endMonth: item.endMonth ?? '', isCurrent: !!item.isCurrent,
    school: item.school ?? '', major: item.major ?? '', degree: item.degree ?? '', customDegree: item.customDegree ?? '',
  }))
  const experiences: ResumeExperience[] = (version.experiences ?? []).map((item) => ({
    company: item.company ?? '', role: item.role ?? '', startMonth: item.startMonth ?? '', endMonth: item.endMonth ?? '',
    isCurrent: !!item.isCurrent, description: item.description ?? '',
    projects: (item.projects ?? []).map((project) => ({
      title: project.title ?? '', role: project.role ?? '', period: project.period ?? '', techStack: project.techStack ?? [],
      description: project.description ?? '', highlights: project.highlights ?? '', challenges: project.challenges ?? '',
    })),
  }))
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
    educations,
    experiences,
    otherInfo: { ...defaultOtherInfo, ...(version.otherInfo ?? {}), certificates: version.otherInfo?.certificates ?? [], languages: version.otherInfo?.languages ?? [] },
  }
}
