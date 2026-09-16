import type {
  MockFeedback,
  MockMessage,
  MockServiceSettings,
  Settings,
} from '@/types'
import {
  type MockInterviewContext,
  buildMockSystemPrompt,
  formatTranscript,
  toChatMessages,
} from '@/lib/mockInterview'
import { generateMockFeedback, streamOrText } from '@/lib/llm'
import { MOCK_MODE_LABELS } from '@/types'

export interface MockInterviewEngine {
  readonly type: 'builtin' | 'external'
  sendMessage(
    context: MockInterviewContext,
    messages: MockMessage[],
    onDelta?: (delta: string) => void,
  ): Promise<string>
  generateFeedback(
    context: MockInterviewContext,
    messages: MockMessage[],
  ): Promise<MockFeedback>
}

export class BuiltinMockEngine implements MockInterviewEngine {
  readonly type = 'builtin' as const

  constructor(private readonly settings: Settings['llm']) {}

  async sendMessage(
    context: MockInterviewContext,
    messages: MockMessage[],
    onDelta?: (delta: string) => void,
  ): Promise<string> {
    const systemPrompt = buildMockSystemPrompt(context)
    const chatMessages = toChatMessages(systemPrompt, messages)
    return await streamOrText(this.settings, chatMessages, onDelta)
  }

  async generateFeedback(
    context: MockInterviewContext,
    messages: MockMessage[],
  ): Promise<MockFeedback> {
    const transcript = formatTranscript(messages)
    const modeLabel = MOCK_MODE_LABELS[context.mode]
    return await generateMockFeedback(this.settings, transcript, modeLabel)
  }
}

export interface RemoteServiceHealthResponse {
  ok: boolean
  message: string
  version?: string
  agents?: string[]
}

export class RemoteMockEngine implements MockInterviewEngine {
  readonly type = 'external' as const
  private readonly baseUrl: string
  private readonly authToken?: string

  constructor(serviceSettings: MockServiceSettings) {
    this.baseUrl = serviceSettings.serviceUrl.replace(/\/$/, '')
    this.authToken = serviceSettings.authToken
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.authToken?.trim()) {
      headers.Authorization = `Bearer ${this.authToken.trim()}`
    }
    return headers
  }

  static async checkHealth(
    serviceUrl: string,
    authToken?: string,
  ): Promise<RemoteServiceHealthResponse> {
    const cleanUrl = serviceUrl.replace(/\/$/, '')
    const headers: Record<string, string> = {}
    if (authToken?.trim()) {
      headers.Authorization = `Bearer ${authToken.trim()}`
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)

    try {
      const res = await fetch(`${cleanUrl}/health`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })
      if (!res.ok) {
        throw new Error(`服务状态异常 (HTTP ${res.status})`)
      }
      return (await res.json()) as RemoteServiceHealthResponse
    } finally {
      clearTimeout(timer)
    }
  }

  async sendMessage(
    context: MockInterviewContext,
    messages: MockMessage[],
    onDelta?: (delta: string) => void,
  ): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/mock/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        context,
        messages,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`外部面试服务响应失败 (HTTP ${res.status}): ${text || res.statusText}`)
    }

    if (!res.body) {
      throw new Error('外部服务未返回流式响应')
    }

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
          const parsed = JSON.parse(payload) as { delta?: string; error?: string }
          if (parsed.error) {
            throw new Error(`外部服务错误: ${parsed.error}`)
          }
          if (parsed.delta) {
            full += parsed.delta
            onDelta?.(parsed.delta)
          }
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('外部服务错误:')) {
            throw e
          }
          // 忽略非 JSON 行或空包
        }
      }
    }

    if (!full.trim()) {
      throw new Error('外部面试服务返回为空')
    }
    return full.trim()
  }

  async generateFeedback(
    context: MockInterviewContext,
    messages: MockMessage[],
  ): Promise<MockFeedback> {
    const res = await fetch(`${this.baseUrl}/api/mock/feedback`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        context,
        messages,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`外部服务反馈生成失败 (HTTP ${res.status}): ${text || res.statusText}`)
    }

    const feedback = (await res.json()) as MockFeedback
    return {
      overallScore: Math.min(5, Math.max(1, Math.round(feedback.overallScore || 3))),
      summary: feedback.summary || '',
      strengths: feedback.strengths ?? [],
      weaknesses: feedback.weaknesses ?? [],
      suggestedQuestions: feedback.suggestedQuestions ?? [],
    }
  }
}

export function getMockInterviewEngine(settings: Settings): {
  engine: MockInterviewEngine
  engineType: 'builtin' | 'external'
} {
  const serviceSettings = settings.mockService
  if (serviceSettings?.enabled && serviceSettings.serviceUrl?.trim()) {
    return {
      engine: new RemoteMockEngine(serviceSettings),
      engineType: 'external',
    }
  }
  return {
    engine: new BuiltinMockEngine(settings.llm),
    engineType: 'builtin',
  }
}
