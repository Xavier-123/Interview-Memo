import {
  normalizeJob,
  normalizeKnowledge,
  normalizeResume,
  normalizeResumeProfile,
  normalizeResumeProject,
  normalizeResumeVersion,
  normalizeSettings,
  snapshotResumeProject,
} from '@/lib/settings'
import type { AppState } from '@/store/useAppStore'
import type { MockSession, Resume, ResumeProfile, ResumeProject, ResumeVersion } from '@/types'

interface LegacyResumeState {
  resume?: Partial<ResumeProfile>
  resumes?: Resume[]
  resumeVersions?: ResumeVersion[]
  projects?: ResumeProject[]
  mockSessions?: MockSession[]
}

export function migrateLegacyResumeData<T extends LegacyResumeState>(
  state: T,
  idPrefix = 'legacy-resume',
): T & { resumes: Resume[]; resumeVersions: ResumeVersion[] } {
  if (state.resumes && state.resumeVersions) {
    return {
      ...state,
      resumes: state.resumes.map(normalizeResume),
      resumeVersions: state.resumeVersions.map(normalizeResumeVersion),
    }
  }

  const profile = normalizeResumeProfile(state.resume)
  const hasContent = !!(
    profile.summary.trim() ||
    profile.education.trim() ||
    profile.rawText.trim() ||
    profile.skills.length > 0
  )
  if (!hasContent) {
    return { ...state, resumes: [], resumeVersions: [] }
  }

  const createdAt = profile.updatedAt || new Date().toISOString()
  const resumeId = idPrefix
  const versionId = `${idPrefix}-v1`
  return {
    ...state,
    resumes: [{ id: resumeId, name: '默认简历', createdAt, updatedAt: createdAt }],
    resumeVersions: [
      {
        id: versionId,
        resumeId,
        version: 1,
        summary: profile.summary,
        education: profile.education,
        skills: [...profile.skills],
        rawText: profile.rawText,
        sourceFileName: profile.sourceFileName,
        projectSnapshots: (state.projects ?? []).map(snapshotResumeProject),
        createdAt,
      },
    ],
    mockSessions: (state.mockSessions ?? []).map((session) =>
      session.mode === 'full' ? { ...session, resumeVersionId: versionId } : session,
    ),
  }
}

export function migratePersistedState(persisted: unknown, version: number): AppState {
  const state = persisted as AppState
  if (version < 2) {
    state.settings = normalizeSettings(state.settings)
    state.knowledge = (state.knowledge ?? []).map(normalizeKnowledge)
    state.reminderLog = state.reminderLog ?? {}
  }
  if (version < 3) {
    state.jobs = (state.jobs ?? []).map(normalizeJob)
  }
  if (version < 4) {
    state.resume = normalizeResumeProfile(state.resume)
    state.projects = (state.projects ?? []).map(normalizeResumeProject)
    state.mockSessions = state.mockSessions ?? []
  }
  if (version < 5) {
    state.settings = normalizeSettings(state.settings)
  }
  if (version < 6) {
    return migrateLegacyResumeData(state) as AppState
  }
  return migrateLegacyResumeData(state) as AppState
}
