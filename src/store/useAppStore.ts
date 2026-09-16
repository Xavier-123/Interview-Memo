import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createSeedData, defaultSettings } from '@/data/seed'
import { generateId } from '@/lib/id'
import {
  normalizeJob,
  normalizeKnowledge,
  normalizeResume,
  normalizeResumeProject,
  normalizeResumeVersion,
  normalizeSettings,
  snapshotResumeProject,
} from '@/lib/settings'
import { createKnowledgeActions } from '@/store/knowledgeActions'
import { removeCompanyCascade, removeInterviewCascade, removeJobCascade } from '@/store/cascades'
import { migratePersistedState } from '@/store/migrate'
import { persistStorage, pruneCompletedMockSessions } from '@/store/persistStorage'
import type {
  ArchiveMethod,
  Company,
  Interview,
  InterviewRound,
  Job,
  JobCloseReason,
  JobStatus,
  Knowledge,
  LearningItem,
  MockFeedback,
  MockInterviewMode,
  MockMessage,
  MockSession,
  Question,
  Resume,
  ResumeProfile,
  ResumeProject,
  ResumeProjectSnapshot,
  ResumeVersion,
  ResumeEducation,
  ResumeExperience,
  ResumeOtherInfo,
  Review,
  Settings,
} from '@/types'
import { ROUND_TO_JOB_STATUS, JOB_STATUS_ORDER } from '@/types'

export interface AppState {
  hydrated: boolean
  storageError: string | null
  companies: Company[]
  jobs: Job[]
  interviews: Interview[]
  questions: Question[]
  reviews: Review[]
  knowledge: Knowledge[]
  settings: Settings
  reminderLog: Record<string, string>
  resumes: Resume[]
  resumeVersions: ResumeVersion[]
  /** @deprecated compatibility for legacy mock UI */
  resume: ResumeProfile
  projects: ResumeProject[]
  mockSessions: MockSession[]

  setHydrated: (v: boolean) => void
  clearStorageError: () => void
  clearCompletedMockSessions: () => void
  loadData: (data: Partial<AppState>, mode?: 'replace' | 'merge') => void
  resetToDemo: () => void
  clearAll: () => void
  updateSettings: (patch: Partial<Settings>) => void
  markReminderSent: (key: string) => void

  addCompany: (data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateCompany: (id: string, patch: Partial<Company>) => void
  removeCompany: (id: string) => void

  addJob: (data: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateJob: (id: string, patch: Partial<Job>) => void
  updateJobStatus: (id: string, status: JobStatus, closeReason?: JobCloseReason) => void
  removeJob: (id: string) => void

  addInterview: (
    data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt' | 'learningItems'> & { learningItems?: LearningItem[] },
    syncJobStatus?: boolean,
  ) => string
  updateInterview: (id: string, patch: Partial<Interview>) => void
  removeInterview: (id: string) => void

  addQuestion: (data: Omit<Question, 'id'>) => string
  updateQuestion: (id: string, patch: Partial<Question>) => void
  removeQuestion: (id: string) => void
  markQuestionWeak: (id: string, isWeak: boolean) => void
  linkQuestionToKnowledge: (questionId: string, knowledgeId: string, method: ArchiveMethod) => void
  createKnowledgeFromQuestion: (questionId: string, method: ArchiveMethod) => string | undefined
  unlinkQuestionFromKnowledge: (questionId: string) => void
  promoteQuestionToKnowledge: (questionId: string) => string | undefined

  upsertReview: (interviewId: string, data: Omit<Review, 'id' | 'interviewId' | 'updatedAt'>) => void

  addKnowledge: (data: Omit<Knowledge, 'id'>) => string
  updateKnowledge: (id: string, patch: Partial<Knowledge>) => void
  removeKnowledge: (id: string) => void

  addLearningItem: (interviewId: string, text: string, knowledgeId?: string) => void
  addLearningItemsToNextInterview: (items: { text: string; knowledgeId?: string }[]) => void
  toggleLearningItem: (interviewId: string, itemId: string) => void
  removeLearningItem: (interviewId: string, itemId: string) => void

  createResume: (data: ResumeVersionInput & { name: string }) => { resumeId: string; versionId: string }
  createResumeVersion: (resumeId: string, data: ResumeVersionInput) => string | undefined
  updateResumeName: (id: string, name: string) => void
  setResumeArchived: (id: string, archived: boolean) => void
  setResumeVersionArchived: (id: string, archived: boolean) => void
  removeResume: (id: string) => boolean
  removeResumeVersion: (id: string) => boolean
  /** @deprecated compatibility for legacy mock UI */
  updateResume: (patch: Partial<Omit<ResumeProfile, 'updatedAt'>>) => void
  addProject: (data: Omit<ResumeProject, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateProject: (id: string, patch: Partial<Omit<ResumeProject, 'id' | 'createdAt'>>) => void
  removeProject: (id: string) => void

  createMockSession: (data: {
    mode: MockInterviewMode
    companyId?: string
    jobId?: string
    resumeVersionId?: string
    projectIds: string[]
    roundHint?: InterviewRound
  }) => string
  appendMockMessage: (sessionId: string, message: Omit<MockMessage, 'id' | 'createdAt'>) => void
  completeMockSession: (sessionId: string, feedback: MockFeedback) => void
  removeMockSession: (sessionId: string) => void
}

export interface ResumeVersionInput {
  summary: string
  education: string
  skills: string[]
  rawText: string
  sourceFileName?: string
  projectIds: string[]
  retainedProjectSnapshots?: ResumeProjectSnapshot[]
  educations?: ResumeEducation[]
  experiences?: ResumeExperience[]
  otherInfo?: ResumeOtherInfo
}

const ts = () => new Date().toISOString()

const emptyState = () => ({
  companies: [] as Company[],
  jobs: [] as Job[],
  interviews: [] as Interview[],
  questions: [] as Question[],
  reviews: [] as Review[],
  knowledge: [] as Knowledge[],
  settings: normalizeSettings({ ...defaultSettings, seeded: false }),
  reminderLog: {} as Record<string, string>,
  resumes: [] as Resume[],
  resumeVersions: [] as ResumeVersion[],
  resume: { summary: '', education: '', skills: [], rawText: '', sourceFileName: '', updatedAt: '' } as ResumeProfile,
  projects: [] as ResumeProject[],
  mockSessions: [] as MockSession[],
})

const initialSeed = createSeedData()

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const knowledgeActions = createKnowledgeActions(get, set)

      return {
      hydrated: false,
      storageError: null,
      companies: initialSeed.companies,
      jobs: initialSeed.jobs.map(normalizeJob),
      interviews: initialSeed.interviews,
      questions: initialSeed.questions,
      reviews: initialSeed.reviews,
      knowledge: initialSeed.knowledge.map(normalizeKnowledge),
      settings: initialSeed.settings,
      reminderLog: {},
      resumes: initialSeed.resumes.map(normalizeResume),
      resumeVersions: initialSeed.resumeVersions.map(normalizeResumeVersion),
      resume: {
        summary: initialSeed.resumeVersions[0]?.summary ?? '',
        education: initialSeed.resumeVersions[0]?.education ?? '',
        skills: initialSeed.resumeVersions[0]?.skills ?? [],
        rawText: initialSeed.resumeVersions[0]?.rawText ?? '',
        sourceFileName: initialSeed.resumeVersions[0]?.sourceFileName ?? '',
        updatedAt: initialSeed.resumeVersions[0]?.createdAt ?? ts(),
      },
      projects: initialSeed.projects.map(normalizeResumeProject),
      mockSessions: initialSeed.mockSessions,

      setHydrated: (v) => set({ hydrated: v }),

      clearStorageError: () => set({ storageError: null }),

      clearCompletedMockSessions: () =>
        set((s) => ({
          mockSessions: s.mockSessions.filter((session) => session.status === 'active'),
        })),

      loadData: (data, mode = 'replace') => {
        const normalizedKnowledge = (data.knowledge ?? []).map(normalizeKnowledge)
        const normalizedSettings = normalizeSettings(data.settings)
        const normalizedJobs = (data.jobs ?? []).map(normalizeJob)
        if (mode === 'replace') {
          set({
            companies: data.companies ?? [],
            jobs: normalizedJobs,
            interviews: data.interviews ?? [],
            questions: data.questions ?? [],
            reviews: data.reviews ?? [],
            knowledge: normalizedKnowledge,
            settings: normalizedSettings,
            resumes: (data.resumes ?? []).map(normalizeResume),
            resumeVersions: (data.resumeVersions ?? []).map(normalizeResumeVersion),
            resume: {
              summary: data.resumeVersions?.[0]?.summary ?? '',
              education: data.resumeVersions?.[0]?.education ?? '',
              skills: data.resumeVersions?.[0]?.skills ?? [],
              rawText: data.resumeVersions?.[0]?.rawText ?? '',
              sourceFileName: data.resumeVersions?.[0]?.sourceFileName ?? '',
              updatedAt: data.resumeVersions?.[0]?.createdAt ?? ts(),
            },
            projects: (data.projects ?? []).map(normalizeResumeProject),
            mockSessions: data.mockSessions ?? [],
          })
        } else {
          const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]) => {
            const map = new Map(existing.map((x) => [x.id, x]))
            incoming.forEach((x) => map.set(x.id, x))
            return Array.from(map.values())
          }
          set((s) => ({
            companies: mergeById(s.companies, data.companies ?? []),
            jobs: mergeById(s.jobs, normalizedJobs),
            interviews: mergeById(s.interviews, data.interviews ?? []),
            questions: mergeById(s.questions, data.questions ?? []),
            reviews: mergeById(s.reviews, data.reviews ?? []),
            knowledge: mergeById(s.knowledge, normalizedKnowledge),
            settings: normalizedSettings,
            resumes: data.resumes ? mergeById(s.resumes, data.resumes.map(normalizeResume)) : s.resumes,
            resumeVersions: data.resumeVersions
              ? mergeById(s.resumeVersions, data.resumeVersions.map(normalizeResumeVersion))
              : s.resumeVersions,
            resume: data.resumeVersions?.[0]
              ? {
                  summary: data.resumeVersions[0].summary,
                  education: data.resumeVersions[0].education,
                  skills: data.resumeVersions[0].skills,
                  rawText: data.resumeVersions[0].rawText,
                  sourceFileName: data.resumeVersions[0].sourceFileName,
                  updatedAt: data.resumeVersions[0].createdAt,
                }
              : s.resume,
            projects: data.projects ? mergeById(s.projects, data.projects.map(normalizeResumeProject)) : s.projects,
            mockSessions: data.mockSessions ? mergeById(s.mockSessions, data.mockSessions) : s.mockSessions,
          }))
        }
      },

      resetToDemo: () => {
        const seed = createSeedData()
        set({
          companies: seed.companies,
          jobs: seed.jobs.map(normalizeJob),
          interviews: seed.interviews,
          questions: seed.questions,
          reviews: seed.reviews,
          knowledge: seed.knowledge.map(normalizeKnowledge),
          settings: seed.settings,
          reminderLog: {},
          resumes: seed.resumes.map(normalizeResume),
          resumeVersions: seed.resumeVersions.map(normalizeResumeVersion),
          resume: {
            summary: seed.resumeVersions[0]?.summary ?? '',
            education: seed.resumeVersions[0]?.education ?? '',
            skills: seed.resumeVersions[0]?.skills ?? [],
            rawText: seed.resumeVersions[0]?.rawText ?? '',
            sourceFileName: seed.resumeVersions[0]?.sourceFileName ?? '',
            updatedAt: seed.resumeVersions[0]?.createdAt ?? ts(),
          },
          projects: seed.projects.map(normalizeResumeProject),
          mockSessions: seed.mockSessions,
        })
      },

      clearAll: () => set(emptyState()),

      updateSettings: (patch) =>
        set((s) => ({
          settings: normalizeSettings({
            ...s.settings,
            ...patch,
            reminder: patch.reminder ? { ...s.settings.reminder, ...patch.reminder } : s.settings.reminder,
            llm: patch.llm ? { ...s.settings.llm, ...patch.llm } : s.settings.llm,
            knowledgeCategories: patch.knowledgeCategories ?? s.settings.knowledgeCategories,
          }),
        })),

      markReminderSent: (key) =>
        set((s) => ({ reminderLog: { ...s.reminderLog, [key]: ts() } })),

      addCompany: (data) => {
        const id = generateId()
        const t = ts()
        set((s) => ({ companies: [...s.companies, { ...data, id, createdAt: t, updatedAt: t }] }))
        return id
      },

      updateCompany: (id, patch) =>
        set((s) => ({
          companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: ts() } : c)),
        })),

      removeCompany: (id) => set((s) => removeCompanyCascade(s, id)),

      addJob: (data) => {
        const id = generateId()
        const t = ts()
        set((s) => ({ jobs: [...s.jobs, { ...data, id, createdAt: t, updatedAt: t }] }))
        return id
      },

      updateJob: (id, patch) =>
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch, updatedAt: ts() } : j)) })),

      updateJobStatus: (id, status, closeReason) => {
        const job = get().jobs.find((j) => j.id === id)
        const patch: Partial<Job> = {
          status,
          closeReason: status === 'closed' ? closeReason : undefined,
          // 关闭时记录原阶段（重复关闭保留首次记录），恢复到其他阶段时清除
          closedFromStatus: status === 'closed' ? (job?.status === 'closed' ? job?.closedFromStatus : job?.status) : undefined,
        }
        if (status === 'applied' && job && !job.appliedAt) {
          patch.appliedAt = ts()
        }
        get().updateJob(id, patch)
      },

      removeJob: (id) => set((s) => ({ ...s, ...removeJobCascade(s, id) })),

      addInterview: (data, syncJobStatus = false) => {
        const id = generateId()
        const t = ts()
        const interview: Interview = {
          ...data,
          id,
          learningItems: data.learningItems ?? [],
          createdAt: t,
          updatedAt: t,
        }
        set((s) => ({ interviews: [...s.interviews, interview] }))
        if (syncJobStatus) {
          const jobStatus = ROUND_TO_JOB_STATUS[data.round]
          if (jobStatus) {
            const job = get().jobs.find((j) => j.id === data.jobId)
            if (job) {
              const currentIdx = JOB_STATUS_ORDER.indexOf(job.status)
              const targetIdx = JOB_STATUS_ORDER.indexOf(jobStatus)
              if (targetIdx > currentIdx) {
                get().updateJobStatus(data.jobId, jobStatus)
              }
            }
          }
        }
        return id
      },

      updateInterview: (id, patch) =>
        set((s) => ({
          interviews: s.interviews.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: ts() } : i)),
        })),

      removeInterview: (id) => set((s) => ({ ...s, ...removeInterviewCascade(s, id) })),

      addQuestion: (data) => {
        const id = generateId()
        set((s) => ({ questions: [...s.questions, { ...data, id }] }))
        return id
      },

      updateQuestion: (id, patch) =>
        set((s) => ({ questions: s.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),

      removeQuestion: (id) => {
        const q = get().questions.find((x) => x.id === id)
        if (q?.knowledgeId) get().unlinkQuestionFromKnowledge(id)
        set((s) => ({ questions: s.questions.filter((q) => q.id !== id) }))
      },

      markQuestionWeak: (id, isWeak) => get().updateQuestion(id, { isWeak }),

      ...knowledgeActions,

      upsertReview: (interviewId, data) => {
        const existing = get().reviews.find((r) => r.interviewId === interviewId)
        const t = ts()
        if (existing) {
          set((s) => ({
            reviews: s.reviews.map((r) => (r.id === existing.id ? { ...r, ...data, updatedAt: t } : r)),
          }))
        } else {
          set((s) => ({
            reviews: [...s.reviews, { ...data, id: generateId(), interviewId, updatedAt: t }],
          }))
        }
      },

      addKnowledge: (data) => {
        const id = generateId()
        set((s) => ({ knowledge: [...s.knowledge, { ...data, id, aliases: data.aliases ?? [] }] }))
        return id
      },

      updateKnowledge: (id, patch) =>
        set((s) => ({ knowledge: s.knowledge.map((k) => (k.id === id ? { ...k, ...patch } : k)) })),

      removeKnowledge: (id) =>
        set((s) => ({
          knowledge: s.knowledge.filter((k) => k.id !== id),
          questions: s.questions.map((q) =>
            q.knowledgeId === id ? { ...q, knowledgeId: undefined, archiveMethod: undefined } : q,
          ),
        })),

      addLearningItem: (interviewId, text, knowledgeId) => {
        const item: LearningItem = { id: generateId(), text, done: false, knowledgeId }
        set((s) => ({
          interviews: s.interviews.map((i) =>
            i.id === interviewId ? { ...i, learningItems: [...i.learningItems, item], updatedAt: ts() } : i,
          ),
        }))
      },

      addLearningItemsToNextInterview: (items) => {
        const now = new Date()
        const next = get()
          .interviews.filter((i) => i.status === 'scheduled' && new Date(i.scheduledAt) >= now)
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]
        if (!next) return
        items.forEach(({ text, knowledgeId }) => get().addLearningItem(next.id, text, knowledgeId))
      },

      toggleLearningItem: (interviewId, itemId) => {
        set((s) => ({
          interviews: s.interviews.map((i) => {
            if (i.id !== interviewId) return i
            const items = i.learningItems.map((li) =>
              li.id === itemId ? { ...li, done: !li.done } : li,
            )
            const toggled = items.find((li) => li.id === itemId)
            if (toggled?.done && toggled.knowledgeId) {
              get().updateKnowledge(toggled.knowledgeId, { mastery: 'fair', lastReviewedAt: ts() })
            }
            return { ...i, learningItems: items, updatedAt: ts() }
          }),
        }))
      },

      removeLearningItem: (interviewId, itemId) =>
        set((s) => ({
          interviews: s.interviews.map((i) =>
            i.id === interviewId
              ? { ...i, learningItems: i.learningItems.filter((li) => li.id !== itemId), updatedAt: ts() }
              : i,
          ),
        })),

      createResume: (data) => {
        const resumeId = generateId()
        const versionId = generateId()
        const t = ts()
        const projectSet = new Set(data.projectIds)
        const projectSnapshots = get().projects
          .filter((project) => projectSet.has(project.id))
          .map(snapshotResumeProject)
          .concat(data.retainedProjectSnapshots ?? [])
        set((s) => ({
          resumes: [...s.resumes, { id: resumeId, name: data.name.trim(), createdAt: t, updatedAt: t }],
          resumeVersions: [
            ...s.resumeVersions,
            normalizeResumeVersion({
              id: versionId,
              resumeId,
              version: 1,
              summary: data.summary,
              education: data.education,
              skills: [...data.skills],
              rawText: data.rawText,
              sourceFileName: data.sourceFileName,
              projectSnapshots,
              educations: data.educations,
              experiences: data.experiences,
              otherInfo: data.otherInfo,
              createdAt: t,
            }),
          ],
          resume: s.resume,
        }))
        return { resumeId, versionId }
      },

      createResumeVersion: (resumeId, data) => {
        const resume = get().resumes.find((item) => item.id === resumeId)
        if (!resume || resume.archivedAt) return undefined
        const versionId = generateId()
        const t = ts()
        const nextVersion = Math.max(
          0,
          ...get().resumeVersions.filter((item) => item.resumeId === resumeId).map((item) => item.version),
        ) + 1
        const projectSet = new Set(data.projectIds)
        const projectSnapshots = get().projects
          .filter((project) => projectSet.has(project.id))
          .map(snapshotResumeProject)
          .concat(data.retainedProjectSnapshots ?? [])
        set((s) => ({
          resumes: s.resumes.map((item) =>
            item.id === resumeId ? { ...item, updatedAt: t } : item,
          ),
          resumeVersions: [
            ...s.resumeVersions,
            normalizeResumeVersion({
              id: versionId,
              resumeId,
              version: nextVersion,
              summary: data.summary,
              education: data.education,
              skills: [...data.skills],
              rawText: data.rawText,
              sourceFileName: data.sourceFileName,
              projectSnapshots,
              educations: data.educations,
              experiences: data.experiences,
              otherInfo: data.otherInfo,
              createdAt: t,
            }),
          ],
          resume: s.resume,
        }))
        return versionId
      },

      updateResumeName: (id, name) =>
        set((s) => ({
          resumes: s.resumes.map((resume) =>
            resume.id === id ? normalizeResume({ ...resume, name, updatedAt: ts() }) : resume,
          ),
        })),

      setResumeArchived: (id, archived) =>
        set((s) => ({
          resumes: s.resumes.map((resume) =>
            resume.id === id
              ? { ...resume, archivedAt: archived ? ts() : undefined, updatedAt: ts() }
              : resume,
          ),
        })),

      setResumeVersionArchived: (id, archived) =>
        set((s) => ({
          resumeVersions: s.resumeVersions.map((version) =>
            version.id === id ? { ...version, archivedAt: archived ? ts() : undefined } : version,
          ),
        })),

      removeResume: (id) => {
        const versionIds = new Set(
          get().resumeVersions.filter((version) => version.resumeId === id).map((version) => version.id),
        )
        const referenced =
          get().jobs.some((job) => !!job.resumeVersionId && versionIds.has(job.resumeVersionId)) ||
          get().mockSessions.some(
            (session) => !!session.resumeVersionId && versionIds.has(session.resumeVersionId),
          )
        if (referenced) return false
        set((s) => ({
          resumes: s.resumes.filter((resume) => resume.id !== id),
          resumeVersions: s.resumeVersions.filter((version) => version.resumeId !== id),
        }))
        return true
      },

      removeResumeVersion: (id) => {
        const version = get().resumeVersions.find((item) => item.id === id)
        if (!version) return true
        const referenced =
          get().jobs.some((job) => job.resumeVersionId === id) ||
          get().mockSessions.some((session) => session.resumeVersionId === id)
        if (referenced) return false
        const siblings = get().resumeVersions.filter((item) => item.resumeId === version.resumeId)
        set((s) => ({
          resumeVersions: s.resumeVersions.filter((item) => item.id !== id),
          resumes:
            siblings.length === 1
              ? s.resumes.filter((resume) => resume.id !== version.resumeId)
              : s.resumes,
        }))
        return true
      },

      updateResume: (patch) => {
        const current = get().resume
        set({ resume: { ...current, ...patch, updatedAt: ts() } })
      },

      addProject: (data) => {
        const id = generateId()
        const t = ts()
        set((s) => ({
          projects: [...s.projects, { ...data, id, createdAt: t, updatedAt: t }],
        }))
        return id
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? normalizeResumeProject({ ...p, ...patch, updatedAt: ts() }) : p,
          ),
        })),

      removeProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          mockSessions: s.mockSessions.map((session) => ({
            ...session,
            projectIds: session.projectIds.filter((pid) => pid !== id),
          })),
        })),

      createMockSession: (data) => {
        const id = generateId()
        const t = ts()
        const session: MockSession = {
          id,
          mode: data.mode,
          companyId: data.companyId,
          jobId: data.jobId,
          resumeVersionId: data.resumeVersionId,
          projectIds: data.projectIds,
          roundHint: data.roundHint,
          status: 'active',
          messages: [],
          createdAt: t,
          updatedAt: t,
        }
        set((s) => ({ mockSessions: [session, ...s.mockSessions] }))
        return id
      },

      appendMockMessage: (sessionId, message) => {
        const item: MockMessage = { ...message, id: generateId(), createdAt: ts() }
        set((s) => ({
          mockSessions: s.mockSessions.map((session) =>
            session.id === sessionId
              ? { ...session, messages: [...session.messages, item], updatedAt: ts() }
              : session,
          ),
        }))
      },

      completeMockSession: (sessionId, feedback) =>
        set((s) => ({
          mockSessions: pruneCompletedMockSessions(
            s.mockSessions.map((session) =>
              session.id === sessionId
                ? { ...session, status: 'completed' as const, feedback, updatedAt: ts() }
                : session,
            ),
          ),
        })),

      removeMockSession: (id) =>
        set((s) => ({ mockSessions: s.mockSessions.filter((session) => session.id !== id) })),
      }
    },
    {
      name: 'interview-memo:v1',
      version: 8,
      migrate: migratePersistedState,
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        companies: state.companies,
        jobs: state.jobs,
        interviews: state.interviews,
        questions: state.questions,
        reviews: state.reviews,
        knowledge: state.knowledge,
        settings: state.settings,
        reminderLog: state.reminderLog,
        resumes: state.resumes,
        resumeVersions: state.resumeVersions,
        projects: state.projects,
        mockSessions: state.mockSessions,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)
