import type { LlmSettings, MockFeedback } from '@/types'

export function isLlmConfigured(settings: LlmSettings): boolean {
  return settings.enabled && !!settings.baseUrl.trim() && !!settings.apiKey.trim() && !!settings.model.trim()
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatRequestOptions {
  timeoutMs?: number
  temperature?: number
  stream?: boolean
  responseFormat?: { type: 'json_object' }
}

function getBaseUrl(settings: LlmSettings): string {
  return settings.baseUrl.replace(/\/$/, '')
}

async function requestChatCompletions(
  settings: LlmSettings,
  messages: ChatMessage[],
  options: ChatRequestOptions = {},
): Promise<Response> {
  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? 60000
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const body: Record<string, unknown> = {
      model: settings.model,
      messages,
      temperature: options.temperature ?? 0.7,
    }
    if (options.stream) body.stream = true
    if (options.responseFormat) body.response_format = options.responseFormat

    const res = await fetch(`${getBaseUrl(settings)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`)
    return res
  } finally {
    clearTimeout(timer)
  }
}

export async function chatJson<T>(
  settings: LlmSettings,
  messages: ChatMessage[],
  timeoutMs = 15000,
): Promise<T> {
  const res = await requestChatCompletions(settings, messages, {
    timeoutMs,
    temperature: 0,
    responseFormat: { type: 'json_object' },
  })
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM 返回为空')
  return JSON.parse(content) as T
}

export async function chatText(
  settings: LlmSettings,
  messages: ChatMessage[],
  options?: { timeoutMs?: number; temperature?: number },
): Promise<string> {
  const res = await requestChatCompletions(settings, messages, options)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('LLM 返回为空')
  return content
}

export async function chatStream(
  settings: LlmSettings,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  options?: { timeoutMs?: number; temperature?: number },
): Promise<string> {
  const res = await requestChatCompletions(settings, messages, { ...options, stream: true })
  if (!res.body) throw new Error('LLM 流式响应为空')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const parsed = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[]
        }
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) {
          full += delta
          onDelta(delta)
        }
      } catch {
        // ignore malformed SSE chunks
      }
    }
  }

  if (!full.trim()) throw new Error('LLM 返回为空')
  return full.trim()
}

export async function streamOrText(
  settings: LlmSettings,
  messages: ChatMessage[],
  onDelta?: (text: string) => void,
): Promise<string> {
  if (onDelta) {
    try {
      return await chatStream(settings, messages, onDelta)
    } catch {
      const text = await chatText(settings, messages)
      onDelta(text)
      return text
    }
  }
  return chatText(settings, messages)
}

export async function testConnection(settings: LlmSettings): Promise<string> {
  const result = await chatJson<{ ok: boolean; message: string }>(settings, [
    { role: 'system', content: 'Reply JSON only: {"ok":true,"message":"connected"}' },
    { role: 'user', content: 'ping' },
  ])
  return result.message || '连接成功'
}

export interface SameQuestionJudgement {
  matchId: string | null
  confidence: number
  reason: string
}

export async function judgeSameQuestion(
  settings: LlmSettings,
  newQuestion: string,
  candidates: { id: string; title: string }[],
): Promise<SameQuestionJudgement> {
  const list = candidates
    .slice(0, 8)
    .map((c, i) => `${i + 1}. [id=${c.id}] ${c.title}`)
    .join('\n')
  return chatJson<SameQuestionJudgement>(settings, [
    {
      role: 'system',
      content:
        '你是面试题库去重助手。判断新问题是否与候选列表中的某一道题语义相同（同一知识点，表述不同也算）。返回 JSON: {"matchId": string|null, "confidence": 0-1, "reason": string}。无匹配则 matchId 为 null。',
    },
    {
      role: 'user',
      content: `新问题：${newQuestion}\n\n候选：\n${list}`,
    },
  ])
}

export async function generateLearningAdvice(
  settings: LlmSettings,
  weakItems: { title: string; reason: string }[],
): Promise<string> {
  const summary = weakItems.map((w) => `- ${w.title}：${w.reason}`).join('\n')
  const result = await chatJson<{ advice: string }>(settings, [
    {
      role: 'system',
      content: '你是求职面试学习顾问。根据薄弱项生成简洁的学习计划，返回 JSON: {"advice": string}',
    },
    { role: 'user', content: `薄弱项：\n${summary}` },
  ], 30000)
  return result.advice
}

export async function generateMockFeedback(
  settings: LlmSettings,
  transcript: string,
  modeLabel: string,
): Promise<MockFeedback> {
  const result = await chatJson<MockFeedback>(settings, [
    {
      role: 'system',
      content:
        '你是资深技术面试官。根据模拟面试对话给出结构化反馈。返回 JSON: {"overallScore": number(1-5), "summary": string, "strengths": string[], "weaknesses": string[], "suggestedQuestions": string[]}。overallScore 为 1-5 整数。',
    },
    {
      role: 'user',
      content: `模拟模式：${modeLabel}\n\n对话记录：\n${transcript}`,
    },
  ], 60000)
  return {
    overallScore: Math.min(5, Math.max(1, Math.round(result.overallScore || 3))),
    summary: result.summary || '',
    strengths: result.strengths ?? [],
    weaknesses: result.weaknesses ?? [],
    suggestedQuestions: result.suggestedQuestions ?? [],
  }
}
