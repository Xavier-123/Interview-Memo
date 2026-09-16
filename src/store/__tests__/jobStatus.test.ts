import { describe, expect, it } from 'vitest'
import {
  JOB_CLOSE_REASONS,
  JOB_CLOSE_REASON_LABELS,
  JOB_STATUS_ORDER,
  type Job,
} from '@/types'
import { selectFunnel, selectKpis } from '@/store/selectors'
import type { AppState } from '@/store/useAppStore'

describe('Job status and close reason definitions', () => {
  it('includes offer_accepted in JOB_STATUS_ORDER', () => {
    expect(JOB_STATUS_ORDER).toContain('offer_accepted')
    expect(JOB_STATUS_ORDER.indexOf('offer_accepted')).toBeGreaterThan(JOB_STATUS_ORDER.indexOf('offer'))
    expect(JOB_STATUS_ORDER.indexOf('closed')).toBeGreaterThan(JOB_STATUS_ORDER.indexOf('offer_accepted'))
  })

  it('defines the expected close reasons without resume screening failure', () => {
    expect(JOB_CLOSE_REASONS).toEqual([
      'interview_failed',
      'written_test_failed',
      'offer_declined',
      'other',
    ])
    expect(JOB_CLOSE_REASON_LABELS.interview_failed).toBe('面试失败')
    expect(JOB_CLOSE_REASON_LABELS.written_test_failed).toBe('笔试失败')
    expect(JOB_CLOSE_REASON_LABELS.offer_declined).toBe('拿到offer拒绝')
    expect(JOB_CLOSE_REASON_LABELS.other).toBe('其他 / 主动放弃')

    // Confirm "简历未通过" is not present
    const allLabels = Object.values(JOB_CLOSE_REASON_LABELS)
    expect(allLabels.some((l) => l.includes('简历'))).toBe(false)
  })

  it('correctly calculates KPIs with offer and offer_accepted', () => {
    const mockJobs: Job[] = [
      { id: '1', companyId: 'c1', title: 'A', salaryText: '', location: '', jobType: '算法', status: 'applied', priority: 'medium', tags: [], description: '', jd: '', createdAt: '', updatedAt: '' },
      { id: '2', companyId: 'c1', title: 'B', salaryText: '', location: '', jobType: '算法', status: 'written_test', priority: 'medium', tags: [], description: '', jd: '', createdAt: '', updatedAt: '' },
      { id: '3', companyId: 'c1', title: 'C', salaryText: '', location: '', jobType: '算法', status: 'offer', priority: 'medium', tags: [], description: '', jd: '', createdAt: '', updatedAt: '' },
      { id: '4', companyId: 'c1', title: 'D', salaryText: '', location: '', jobType: '算法', status: 'offer_accepted', priority: 'medium', tags: [], description: '', jd: '', createdAt: '', updatedAt: '' },
      { id: '5', companyId: 'c1', title: 'E', salaryText: '', location: '', jobType: '算法', status: 'closed', closeReason: 'written_test_failed', priority: 'medium', tags: [], description: '', jd: '', createdAt: '', updatedAt: '' },
    ]

    const state = { jobs: mockJobs } as AppState
    const kpis = selectKpis(state)

    expect(kpis.applied).toBe(5)
    expect(kpis.interviewing).toBe(1)
    expect(kpis.offer).toBe(2) // Both offer and offer_accepted
    expect(kpis.closed).toBe(1)
  })

  it('includes offer_accepted in funnel stages', () => {
    const mockJobs: Job[] = [
      { id: '1', companyId: 'c1', title: 'A', salaryText: '', location: '', jobType: '算法', status: 'offer_accepted', priority: 'medium', tags: [], description: '', jd: '', createdAt: '', updatedAt: '' },
    ]

    const state = { jobs: mockJobs } as AppState
    const funnel = selectFunnel(state)

    const acceptedStage = funnel.find((f) => f.stage === 'offer_accepted')
    expect(acceptedStage).toBeDefined()
    expect(acceptedStage?.label).toBe('接受Offer')
    expect(acceptedStage?.count).toBe(1)
  })
})
