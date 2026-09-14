import { toast } from 'sonner'
import { isLlmConfigured, judgeSameQuestion } from '@/lib/llm'
import {
  FUZZY_AUTO_THRESHOLD,
  rankSimilarKnowledge,
  resolveArchiveMethod,
} from '@/lib/similarity'
import type { ArchiveMethod } from '@/types'
import { useAppStore } from '@/store/useAppStore'

export interface ArchiveResult {
  knowledgeId: string
  title: string
  appearCount: number
  method: ArchiveMethod
  created: boolean
}

export async function autoArchiveQuestion(questionId: string): Promise<ArchiveResult | null> {
  const store = useAppStore.getState()
  const question = store.questions.find((q) => q.id === questionId)
  if (!question) return null
  if (question.knowledgeId) {
    const k = store.knowledge.find((x) => x.id === question.knowledgeId)
    return k
      ? { knowledgeId: k.id, title: k.title, appearCount: k.appearCount, method: question.archiveMethod ?? 'manual', created: false }
      : null
  }

  const candidates = rankSimilarKnowledge(question.question, store.knowledge)
  const top = candidates[0]

  if (top && top.score >= FUZZY_AUTO_THRESHOLD) {
    const method = resolveArchiveMethod(top.score) ?? 'fuzzy'
    store.linkQuestionToKnowledge(questionId, top.id, method)
    const k = useAppStore.getState().knowledge.find((x) => x.id === top.id)!
    return { knowledgeId: k.id, title: k.title, appearCount: k.appearCount, method, created: false }
  }

  const llmSettings = store.settings.llm
  if (top && top.score >= 0.35 && isLlmConfigured(llmSettings)) {
    try {
      const judgement = await judgeSameQuestion(
        llmSettings,
        question.question,
        candidates.slice(0, 8).map((c) => ({ id: c.id, title: c.title })),
      )
      if (judgement.matchId && judgement.confidence >= 0.7) {
        store.linkQuestionToKnowledge(questionId, judgement.matchId, 'llm')
        const k = useAppStore.getState().knowledge.find((x) => x.id === judgement.matchId)!
        return { knowledgeId: k.id, title: k.title, appearCount: k.appearCount, method: 'llm', created: false }
      }
    } catch {
      // 降级到模糊匹配或新建
    }
  }

  if (top && top.score >= FUZZY_AUTO_THRESHOLD) {
    store.linkQuestionToKnowledge(questionId, top.id, 'fuzzy')
    const k = useAppStore.getState().knowledge.find((x) => x.id === top.id)!
    return { knowledgeId: k.id, title: k.title, appearCount: k.appearCount, method: 'fuzzy', created: false }
  }

  const knowledgeId = store.createKnowledgeFromQuestion(questionId, 'fuzzy')
  if (!knowledgeId) return null
  const k = useAppStore.getState().knowledge.find((x) => x.id === knowledgeId)!
  return { knowledgeId, title: k.title, appearCount: k.appearCount, method: 'fuzzy', created: true }
}

export function showArchiveToast(result: ArchiveResult, onManualMerge: () => void) {
  const action = result.created ? '已新建题库条目' : '已归档到题库'
  toast.success(`${action}：${result.title}（第 ${result.appearCount} 次出现）`, {
    action: { label: '不对？手动合并', onClick: onManualMerge },
    duration: 6000,
  })
}

export async function archiveAllUnlinked(): Promise<number> {
  const unlinked = useAppStore.getState().questions.filter((q) => !q.knowledgeId)
  let count = 0
  for (const q of unlinked) {
    const result = await autoArchiveQuestion(q.id)
    if (result) count++
  }
  toast.success(`已归档 ${count} / ${unlinked.length} 条历史问题`)
  return count
}
