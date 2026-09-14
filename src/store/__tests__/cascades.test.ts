import { describe, expect, it } from 'vitest'
import { removeInterviewCascade, removeJobCascade } from '@/store/cascades'
import type { AppState } from '@/store/useAppStore'

function baseState(): AppState {
  return {
    hydrated: true,
    storageError: null,
    companies: [],
    jobs: [{ id: 'j1', companyId: 'c1', title: '算法', salaryText: '', location: '', jobType: '算法', status: 'applied', priority: 'medium', tags: [], description: '', jd: '', createdAt: '', updatedAt: '' }],
    interviews: [{ id: 'iv1', jobId: 'j1', round: '一面', scheduledAt: '2026-01-01T10:00:00.000Z', duration: 60, mode: '视频', interviewer: '', status: 'completed', notes: '', learningItems: [], createdAt: '', updatedAt: '' }],
    questions: [{ id: 'q1', interviewId: 'iv1', order: 1, question: 'GRPO?', myAnswer: '', feedback: '', idealAnswer: '', rating: 2, isWeak: true, tags: [] }],
    reviews: [],
    knowledge: [{ id: 'k1', title: 'GRPO', category: 'RL', subcategory: 'GRPO', idealAnswer: '', myAnswer: '', mastery: 'poor', appearCount: 1, tags: [], sourceQuestionIds: ['q1'], aliases: ['GRPO?'], notes: '' }],
    settings: {
      userName: 't',
      theme: 'light',
      seeded: false,
      weekStartsOn: 1,
      reminder: { enabled: true, leadMinutes: [60], browserNotification: false },
      llm: { enabled: false, baseUrl: '', apiKey: '', model: '' },
      knowledgeCategories: {},
    },
    reminderLog: {},
    resumes: [],
    resumeVersions: [],
    resume: { summary: '', education: '', skills: [], rawText: '', updatedAt: '' },
    projects: [],
    mockSessions: [],
    setHydrated: () => {},
    clearStorageError: () => {},
    clearCompletedMockSessions: () => {},
    loadData: () => {},
    resetToDemo: () => {},
    clearAll: () => {},
    updateSettings: () => {},
    markReminderSent: () => {},
    addCompany: () => '',
    updateCompany: () => {},
    removeCompany: () => {},
    addJob: () => '',
    updateJob: () => {},
    updateJobStatus: () => {},
    removeJob: () => {},
    addInterview: () => '',
    updateInterview: () => {},
    removeInterview: () => {},
    addQuestion: () => '',
    updateQuestion: () => {},
    removeQuestion: () => {},
    markQuestionWeak: () => {},
    linkQuestionToKnowledge: () => {},
    createKnowledgeFromQuestion: () => undefined,
    unlinkQuestionFromKnowledge: () => {},
    promoteQuestionToKnowledge: () => undefined,
    upsertReview: () => {},
    addKnowledge: () => '',
    updateKnowledge: () => {},
    removeKnowledge: () => {},
    addLearningItem: () => {},
    addLearningItemsToNextInterview: () => {},
    toggleLearningItem: () => {},
    removeLearningItem: () => {},
    updateResume: () => {},
    createResume: () => ({ resumeId: '', versionId: '' }),
    createResumeVersion: () => undefined,
    updateResumeName: () => {},
    setResumeArchived: () => {},
    setResumeVersionArchived: () => {},
    removeResume: () => false,
    removeResumeVersion: () => false,
    addProject: () => '',
    updateProject: () => {},
    removeProject: () => {},
    createMockSession: () => '',
    appendMockMessage: () => {},
    completeMockSession: () => {},
    removeMockSession: () => {},
  }
}

describe('cascades', () => {
  it('decrements knowledge appearCount when interview removed', () => {
    const next = removeInterviewCascade(baseState(), 'iv1')
    expect(next.knowledge[0]?.appearCount).toBe(0)
    expect(next.knowledge[0]?.sourceQuestionIds).toEqual([])
    expect(next.knowledge[0]?.aliases).not.toContain('GRPO?')
  })

  it('decrements knowledge when job removed', () => {
    const next = removeJobCascade(baseState(), 'j1')
    expect(next.knowledge[0]?.appearCount).toBe(0)
    expect(next.jobs).toHaveLength(0)
    expect(next.interviews).toHaveLength(0)
  })
})
