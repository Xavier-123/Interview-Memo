import { describe, expect, it } from 'vitest'
import { getDemoData, validateImportData, formatImportError } from '@/store/io'
import { z } from 'zod'

describe('validateImportData', () => {
  it('accepts demo export', () => {
    const data = getDemoData()
    expect(() => validateImportData(data)).not.toThrow()
  })

  it('accepts v2 export without optional project/session data', () => {
    const { resume: _r, projects: _p, mockSessions: _m, ...rest } = getDemoData()
    expect(() => validateImportData(rest)).not.toThrow()
  })

  it('rejects a missing resume version reference', () => {
    const data = getDemoData()
    const broken = { ...data, jobs: [{ ...data.jobs[0], resumeVersionId: 'missing' }] }
    expect(() => validateImportData(broken)).toThrow(/不存在的简历版本/)
  })

  it('migrates a schema v1 export', () => {
    const demo = getDemoData()
    const legacy = {
      ...demo,
      schemaVersion: 1,
      jobs: demo.jobs.map(({ resumeVersionId: _resumeVersionId, ...job }) => job),
      resume: { summary: '旧简历', education: '', skills: ['TS'], rawText: '正文', updatedAt: '2026-01-01' },
    }
    const { resumes: _resumes, resumeVersions: _resumeVersions, ...v1 } = legacy
    const migrated = validateImportData(v1)
    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.resumeVersions[0]?.summary).toBe('旧简历')
  })

  it('normalizes the removed wishlist status when importing v2 data', () => {
    const data = getDemoData()
    const imported = validateImportData({
      ...data,
      jobs: [{ ...data.jobs[0], status: 'wishlist' }, ...data.jobs.slice(1)],
    })
    expect(imported.jobs[0]?.status).toBe('applied')
  })

  it('reports missing interview field', () => {
    const data = getDemoData()
    const broken = {
      ...data,
      interviews: [{ id: 'x', jobId: 'j1' }],
    }
    try {
      validateImportData(broken)
      expect.unreachable('should throw')
    } catch (e) {
      expect(formatImportError(e)).toMatch(/interviews/)
    }
  })
})

describe('formatImportError', () => {
  it('formats zod path', () => {
    const err = new z.ZodError([{ code: 'custom', path: ['jobs', 0, 'title'], message: 'Required' }])
    expect(formatImportError(err)).toContain('jobs.0.title')
  })
})
