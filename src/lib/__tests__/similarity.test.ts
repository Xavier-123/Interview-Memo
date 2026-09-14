import { describe, expect, it } from 'vitest'
import { diceSimilarity, normalizeQuestion, rankSimilarKnowledge } from '@/lib/similarity'

describe('similarity', () => {
  it('normalizes full-width and punctuation', () => {
    expect(normalizeQuestion('什么是 GRPO？')).toBe(normalizeQuestion('什么是grpo?'))
  })

  it('returns 1 for identical normalized text', () => {
    expect(diceSimilarity('GRPO 原理', 'grpo原理')).toBe(1)
  })

  it('ranks alias matches', () => {
    const ranked = rankSimilarKnowledge('PPO 和 GRPO 区别', [
      { id: '1', title: 'GRPO 训练流程', aliases: ['PPO 与 GRPO 区别'] },
      { id: '2', title: 'Transformer 结构' },
    ])
    expect(ranked[0]?.id).toBe('1')
  })
})
