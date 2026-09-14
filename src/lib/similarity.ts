/** 标准化题目文本：小写、全角转半角、去标点与空白 */
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim()
}

function bigrams(s: string): Set<string> {
  const set = new Set<string>()
  if (s.length <= 1) {
    if (s) set.add(s)
    return set
  }
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2))
  return set
}

/** 字符 bigram Dice 系数，对中文友好 */
export function diceSimilarity(a: string, b: string): number {
  const na = normalizeQuestion(a)
  const nb = normalizeQuestion(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  const ba = bigrams(na)
  const bb = bigrams(nb)
  let inter = 0
  ba.forEach((g) => { if (bb.has(g)) inter++ })
  return (2 * inter) / (ba.size + bb.size)
}

export const FUZZY_AUTO_THRESHOLD = 0.82
export const FUZZY_CANDIDATE_MIN = 0.35

export interface SimilarityCandidate {
  id: string
  title: string
  score: number
}

export function rankSimilarKnowledge(
  questionText: string,
  items: { id: string; title: string; aliases?: string[] }[],
): SimilarityCandidate[] {
  return items
    .map((item) => {
      const scores = [diceSimilarity(questionText, item.title)]
      item.aliases?.forEach((a) => scores.push(diceSimilarity(questionText, a)))
      return { id: item.id, title: item.title, score: Math.max(...scores) }
    })
    .filter((x) => x.score >= FUZZY_CANDIDATE_MIN)
    .sort((a, b) => b.score - a.score)
}

export function resolveArchiveMethod(score: number): 'exact' | 'fuzzy' | null {
  if (score >= 0.999) return 'exact'
  if (score >= FUZZY_AUTO_THRESHOLD) return 'fuzzy'
  return null
}
