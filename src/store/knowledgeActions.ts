import { generateId } from '@/lib/id'
import { inferCategoryFromTags } from '@/store/selectors'
import type { AppState } from '@/store/useAppStore'
import type { ArchiveMethod, Knowledge, Mastery } from '@/types'

const ts = () => new Date().toISOString()

function ratingToMastery(rating: number, isWeak: boolean): Mastery {
  if (isWeak || rating <= 2) return 'poor'
  if (rating >= 4) return 'good'
  return 'fair'
}

type SetState = (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void
type GetState = () => AppState

export function createKnowledgeActions(get: GetState, set: SetState) {
  const linkQuestionToKnowledge = (questionId: string, knowledgeId: string, method: ArchiveMethod) => {
    const state = get()
    const question = state.questions.find((q) => q.id === questionId)
    const knowledge = state.knowledge.find((k) => k.id === knowledgeId)
    if (!question || !knowledge) return

    const prevId = question.knowledgeId
    if (prevId && prevId !== knowledgeId) unlinkQuestionFromKnowledge(questionId)

    const t = ts()
    const aliases =
      question.question !== knowledge.title && !knowledge.aliases.includes(question.question)
        ? [...knowledge.aliases, question.question]
        : knowledge.aliases

    set((s) => ({
      knowledge: s.knowledge.map((k) =>
        k.id === knowledgeId
          ? {
              ...k,
              appearCount: k.sourceQuestionIds.includes(questionId) ? k.appearCount : k.appearCount + 1,
              lastSeenAt: t,
              sourceQuestionIds: k.sourceQuestionIds.includes(questionId)
                ? k.sourceQuestionIds
                : [...k.sourceQuestionIds, questionId],
              aliases,
              idealAnswer: k.idealAnswer || question.idealAnswer,
              myAnswer: question.myAnswer || k.myAnswer,
              mastery: question.isWeak ? 'poor' : k.mastery,
            }
          : k,
      ),
      questions: s.questions.map((q) =>
        q.id === questionId ? { ...q, knowledgeId, archiveMethod: method } : q,
      ),
    }))
  }

  const createKnowledgeFromQuestion = (questionId: string, method: ArchiveMethod) => {
    const state = get()
    const question = state.questions.find((q) => q.id === questionId)
    if (!question) return undefined
    if (question.knowledgeId) return question.knowledgeId

    const t = ts()
    const { category, subcategory } = inferCategoryFromTags(question.tags, state.settings)
    const knowledgeId = generateId()
    const item: Knowledge = {
      id: knowledgeId,
      title: question.question,
      category,
      subcategory,
      idealAnswer: question.idealAnswer,
      myAnswer: question.myAnswer,
      mastery: ratingToMastery(question.rating, question.isWeak),
      appearCount: 1,
      lastSeenAt: t,
      tags: question.tags,
      sourceQuestionIds: [questionId],
      aliases: [],
      notes: '',
    }
    set((s) => ({
      knowledge: [...s.knowledge, item],
      questions: s.questions.map((q) =>
        q.id === questionId ? { ...q, knowledgeId, archiveMethod: method } : q,
      ),
    }))
    return knowledgeId
  }

  const unlinkQuestionFromKnowledge = (questionId: string) => {
    const state = get()
    const question = state.questions.find((q) => q.id === questionId)
    if (!question?.knowledgeId) return
    const kid = question.knowledgeId
    set((s) => ({
      knowledge: s.knowledge.map((k) =>
        k.id === kid
          ? {
              ...k,
              appearCount: Math.max(0, k.appearCount - 1),
              sourceQuestionIds: k.sourceQuestionIds.filter((id) => id !== questionId),
              aliases: k.aliases.filter((a) => a !== question.question),
            }
          : k,
      ),
      questions: s.questions.map((q) =>
        q.id === questionId ? { ...q, knowledgeId: undefined, archiveMethod: undefined } : q,
      ),
    }))
  }

  const promoteQuestionToKnowledge = (questionId: string) => {
    const state = get()
    const question = state.questions.find((q) => q.id === questionId)
    if (!question) return undefined

    get().updateQuestion(questionId, { isWeak: true })
    let knowledgeId = question.knowledgeId
    if (knowledgeId) {
      linkQuestionToKnowledge(questionId, knowledgeId, 'manual')
    } else {
      knowledgeId = createKnowledgeFromQuestion(questionId, 'manual')
    }
    if (!knowledgeId) return undefined

    const interview = state.interviews.find((i) => i.id === question.interviewId)
    if (interview) {
      const hasItem = interview.learningItems.some(
        (l) => l.text === question.question || l.knowledgeId === knowledgeId,
      )
      if (!hasItem) get().addLearningItem(question.interviewId, question.question, knowledgeId)
    }
    return knowledgeId
  }

  return {
    linkQuestionToKnowledge,
    createKnowledgeFromQuestion,
    unlinkQuestionFromKnowledge,
    promoteQuestionToKnowledge,
  }
}
