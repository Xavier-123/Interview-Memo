import type { Knowledge, Question } from '@/types'
import type { AppState } from '@/store/useAppStore'

export function detachQuestionsFromKnowledge(
  knowledge: Knowledge[],
  questions: Question[],
  removedQuestionIds: string[],
): Knowledge[] {
  if (removedQuestionIds.length === 0) return knowledge

  const removedSet = new Set(removedQuestionIds)
  const removedTexts = new Set(
    questions.filter((q) => removedSet.has(q.id)).map((q) => q.question),
  )

  return knowledge.map((k) => {
    const removedFromSource = k.sourceQuestionIds.filter((id) => removedSet.has(id))
    if (removedFromSource.length === 0) return k

    return {
      ...k,
      sourceQuestionIds: k.sourceQuestionIds.filter((id) => !removedSet.has(id)),
      aliases: k.aliases.filter((a) => !removedTexts.has(a)),
      appearCount: Math.max(0, k.appearCount - removedFromSource.length),
    }
  })
}

export function removeInterviewCascade(state: AppState, interviewId: string) {
  const questionIds = state.questions.filter((q) => q.interviewId === interviewId).map((q) => q.id)
  return {
    interviews: state.interviews.filter((i) => i.id !== interviewId),
    questions: state.questions.filter((q) => q.interviewId !== interviewId),
    reviews: state.reviews.filter((r) => r.interviewId !== interviewId),
    knowledge: detachQuestionsFromKnowledge(state.knowledge, state.questions, questionIds),
  }
}

export function removeJobCascade(state: AppState, jobId: string) {
  const interviewIds = state.interviews.filter((i) => i.jobId === jobId).map((i) => i.id)
  const questionIds = state.questions.filter((q) => interviewIds.includes(q.interviewId)).map((q) => q.id)
  return {
    jobs: state.jobs.filter((j) => j.id !== jobId),
    interviews: state.interviews.filter((i) => i.jobId !== jobId),
    questions: state.questions.filter((q) => !interviewIds.includes(q.interviewId)),
    reviews: state.reviews.filter((r) => !interviewIds.includes(r.interviewId)),
    knowledge: detachQuestionsFromKnowledge(state.knowledge, state.questions, questionIds),
  }
}

export function removeCompanyCascade(state: AppState, companyId: string) {
  const jobIds = state.jobs.filter((j) => j.companyId === companyId).map((j) => j.id)
  let next = { ...state }
  for (const jobId of jobIds) {
    next = { ...next, ...removeJobCascade(next, jobId) }
  }
  return { ...next, companies: next.companies.filter((c) => c.id !== companyId) }
}
