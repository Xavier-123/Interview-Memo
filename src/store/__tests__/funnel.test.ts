import { describe, expect, it } from 'vitest'
import { selectFunnel } from '@/store/selectors'
import type { AppState } from '@/store/useAppStore'
import type { Job } from '@/types'

function job(id: string, status: Job['status'], closedFromStatus?: Job['status']): Job {
  return {
    id,
    companyId: 'c1',
    title: id,
    salaryText: '',
    location: '',
    jobType: '算法',
    status,
    closedFromStatus,
    priority: 'medium',
    tags: [],
    description: '',
    jd: '',
    createdAt: '',
    updatedAt: '',
  }
}

// selectFunnel 只读取 state.jobs
const stateWith = (jobs: Job[]) => ({ jobs } as unknown as AppState)

const counts = (state: AppState) => Object.fromEntries(selectFunnel(state).map((f) => [f.stage, f.count]))

describe('selectFunnel', () => {
  it('在投岗位按所处阶段累计计数', () => {
    const state = stateWith([job('a', 'round1'), job('b', 'applied'), job('c', 'applied'), job('d', 'written_test')])
    expect(counts(state)).toEqual({ applied: 4, written_test: 2, round1: 1, round2: 0, hr: 0, offer: 0, offer_accepted: 0 })
  })

  it('已结束岗位按关闭前阶段累计，不计入其后阶段', () => {
    const state = stateWith([job('a', 'closed', 'round1'), job('b', 'offer')])
    expect(counts(state)).toEqual({ applied: 2, written_test: 2, round1: 2, round2: 1, hr: 1, offer: 1, offer_accepted: 0 })
  })

  it('旧数据中已结束岗位缺少来源阶段时只计入已投递', () => {
    const state = stateWith([job('a', 'closed')])
    expect(counts(state)).toEqual({ applied: 1, written_test: 0, round1: 0, round2: 0, hr: 0, offer: 0, offer_accepted: 0 })
  })

  it('接受Offer 岗位计入到最后一档', () => {
    const state = stateWith([job('a', 'offer_accepted')])
    expect(counts(state)).toEqual({ applied: 1, written_test: 1, round1: 1, round2: 1, hr: 1, offer: 1, offer_accepted: 1 })
  })
})
