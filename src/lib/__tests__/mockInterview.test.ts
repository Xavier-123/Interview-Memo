import { describe, expect, it } from 'vitest'
import { buildMockSystemPrompt } from '@/lib/mockInterview'
import type { ResumeProfile, ResumeProject } from '@/types'

const emptyResume: ResumeProfile = {
  summary: '',
  education: '',
  skills: [],
  rawText: '',
  updatedAt: '',
}

describe('buildMockSystemPrompt', () => {
  it('project mode only includes selected projects', () => {
    const projects: ResumeProject[] = [
      { id: 'p1', title: '项目A', role: '负责人', period: '2024', techStack: ['Go'], description: 'desc', highlights: '', challenges: '', createdAt: '', updatedAt: '' },
      { id: 'p2', title: '项目B', role: '开发', period: '2023', techStack: ['Java'], description: 'desc2', highlights: '', challenges: '', createdAt: '', updatedAt: '' },
    ]
    const prompt = buildMockSystemPrompt({
      mode: 'project',
      resume: emptyResume,
      projects: [projects[0]],
    })
    expect(prompt).toContain('项目A')
    expect(prompt).not.toContain('项目B')
  })
})
