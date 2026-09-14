import type { StateStorage } from 'zustand/middleware'
import type { MockSession } from '@/types'

const STORAGE_KEY = 'interview-memo:v1'
export const QUOTA_ERROR_MESSAGE = '本地存储已满，请导出备份并清理模拟会话'

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22
  )
}

function clearStorageErrorAsync() {
  void import('@/store/useAppStore').then(({ useAppStore }) => {
    if (useAppStore.getState().storageError) {
      useAppStore.setState({ storageError: null })
    }
  })
}

function setStorageErrorAsync(message: string) {
  void import('@/store/useAppStore').then(({ useAppStore }) => {
    useAppStore.setState({ storageError: message })
  })
}

export const persistStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
      clearStorageErrorAsync()
    } catch (error) {
      if (isQuotaError(error)) {
        setStorageErrorAsync(QUOTA_ERROR_MESSAGE)
      }
      throw error
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
}

export function getPersistedDataSize(): number {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? new Blob([raw]).size : 0
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const MAX_COMPLETED_MOCK_SESSIONS = 20

export function pruneCompletedMockSessions(sessions: MockSession[]): MockSession[] {
  const active = sessions.filter((s) => s.status === 'active')
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, MAX_COMPLETED_MOCK_SESSIONS)
  return [...active, ...completed]
}
