import { describe, expect, it } from 'vitest'
import { computeDueReminders } from '@/lib/reminders'
import { DEFAULT_REMINDER_SETTINGS } from '@/types'

const baseSettings = {
  userName: 'test',
  theme: 'light' as const,
  seeded: false,
  weekStartsOn: 1 as const,
  reminder: { ...DEFAULT_REMINDER_SETTINGS },
  llm: { enabled: false, baseUrl: '', apiKey: '', model: '' },
  knowledgeCategories: {},
}

describe('computeDueReminders', () => {
  it('ignores non-scheduled interviews', () => {
    const now = new Date('2026-01-10T12:00:00.000Z')
    const due = computeDueReminders(
      [{
        id: 'i1',
        jobId: 'j1',
        round: '一面',
        scheduledAt: '2026-01-11T12:00:00.000Z',
        duration: 60,
        mode: '视频',
        interviewer: '',
        status: 'completed',
        notes: '',
        learningItems: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }],
      [{ id: 'j1', title: '算法', companyId: 'c1' }],
      [{ id: 'c1', name: '测试公司' }],
      baseSettings,
      {},
      now,
    )
    expect(due).toHaveLength(0)
  })

  it('fires within the reminder window once', () => {
    const scheduledAt = '2026-01-11T12:00:00.000Z'
    const now = new Date('2026-01-10T12:00:30.000Z')
    const due = computeDueReminders(
      [{
        id: 'i1',
        jobId: 'j1',
        round: '一面',
        scheduledAt,
        duration: 60,
        mode: '视频',
        interviewer: '',
        status: 'scheduled',
        notes: '',
        learningItems: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }],
      [{ id: 'j1', title: '算法', companyId: 'c1' }],
      [{ id: 'c1', name: '测试公司' }],
      baseSettings,
      {},
      now,
    )
    expect(due).toHaveLength(1)
    expect(due[0]?.key).toBe('i1:1440')

    const again = computeDueReminders(
      [{
        id: 'i1',
        jobId: 'j1',
        round: '一面',
        scheduledAt,
        duration: 60,
        mode: '视频',
        interviewer: '',
        status: 'scheduled',
        notes: '',
        learningItems: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }],
      [{ id: 'j1', title: '算法', companyId: 'c1' }],
      [{ id: 'c1', name: '测试公司' }],
      baseSettings,
      { 'i1:1440': now.toISOString() },
      now,
    )
    expect(again).toHaveLength(0)
  })
})
