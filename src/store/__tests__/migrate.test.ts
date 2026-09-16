import { describe, expect, it } from 'vitest'
import { migrateLegacyResumeData, migratePersistedState } from '@/store/migrate'
import { JOB_STATUS_LABELS, JOB_STATUS_ORDER, ROUND_TO_JOB_STATUS } from '@/types'

describe('migratePersistedState', () => {
  it('defines the new job status order and written-test mapping', () => {
    expect(JOB_STATUS_ORDER).toEqual([
      'applied',
      'written_test',
      'round1',
      'round2',
      'hr',
      'offer',
      'offer_accepted',
      'closed',
    ])
    expect(JOB_STATUS_LABELS.written_test).toBe('笔试')
    expect(ROUND_TO_JOB_STATUS['笔试']).toBe('written_test')
  })

  it('adds knowledgeCategories at version 5', () => {
    const state = migratePersistedState(
      {
        settings: { userName: 'u', theme: 'light', seeded: true, weekStartsOn: 1 },
        knowledge: [],
        jobs: [],
      },
      4,
    )
    expect(state.settings.knowledgeCategories).toBeDefined()
    expect(Object.keys(state.settings.knowledgeCategories).length).toBeGreaterThan(0)
  })

  it('migrates the removed wishlist status to applied', () => {
    const state = migratePersistedState(
      {
        settings: { userName: 'u', theme: 'light', seeded: true, weekStartsOn: 1 },
        jobs: [{ id: 'j1', status: 'wishlist' }],
      },
      6,
    )
    expect(state.jobs[0]?.status).toBe('applied')
  })

  it('migrates the removed screening status to applied', () => {
    const state = migratePersistedState(
      {
        settings: { userName: 'u', theme: 'light', seeded: true, weekStartsOn: 1 },
        jobs: [{ id: 'j1', status: 'screening' }],
      },
      7,
    )
    expect(state.jobs[0]?.status).toBe('applied')
  })
})

describe('resume migration', () => {
  it('converts a legacy profile and freezes project snapshots', () => {
    const migrated = migrateLegacyResumeData({
      resume: { summary: '算法工程师', education: '', skills: ['TS'], rawText: '正文', updatedAt: '2026-01-01' },
      projects: [{ id: 'p1', title: '项目', role: '', period: '', techStack: [], description: '', highlights: '', challenges: '', createdAt: '', updatedAt: '' }],
      mockSessions: [{ id: 'm1', mode: 'full', projectIds: ['p1'], status: 'active', messages: [], createdAt: '', updatedAt: '' }],
    })
    expect(migrated.resumes).toHaveLength(1)
    expect(migrated.resumeVersions[0]?.projectSnapshots[0]?.title).toBe('项目')
    expect(migrated.mockSessions?.[0]?.resumeVersionId).toBe('legacy-resume-v1')
  })

  it('does not create an empty resume', () => {
    const migrated = migrateLegacyResumeData({ projects: [], mockSessions: [] })
    expect(migrated.resumes).toEqual([])
    expect(migrated.resumeVersions).toEqual([])
  })
})
