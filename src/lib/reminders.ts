import type { Interview, Settings } from '@/types'
import { formatDateTime } from '@/lib/date'
import { getCompanyName } from '@/store/selectors'

export interface DueReminder {
  key: string
  interviewId: string
  leadMinutes: number
  scheduledAt: string
  title: string
  body: string
}

const WINDOW_MS = 60_000

export function computeDueReminders(
  interviews: Interview[],
  jobs: { id: string; title: string; companyId: string }[],
  companies: { id: string; name: string }[],
  settings: Settings,
  reminderLog: Record<string, string>,
  now = new Date(),
): DueReminder[] {
  if (!settings.reminder.enabled) return []
  const due: DueReminder[] = []
  const nowMs = now.getTime()

  for (const interview of interviews) {
    if (interview.status !== 'scheduled') continue
    const scheduledMs = new Date(interview.scheduledAt).getTime()
    if (scheduledMs <= nowMs) continue

    const job = jobs.find((j) => j.id === interview.jobId)
    const title = `${job ? getCompanyName(companies, job.companyId, '面试') : '面试'} · ${interview.round}`
    const body = `${job?.title ?? ''} · ${formatDateTime(interview.scheduledAt)}`

    for (const leadMinutes of settings.reminder.leadMinutes) {
      const key = `${interview.id}:${leadMinutes}`
      if (reminderLog[key]) continue
      const targetMs = scheduledMs - leadMinutes * 60_000
      if (nowMs >= targetMs - WINDOW_MS && nowMs <= targetMs + WINDOW_MS) {
        due.push({ key, interviewId: interview.id, leadMinutes, scheduledAt: interview.scheduledAt, title, body })
      }
    }
  }
  return due
}

export function formatLeadLabel(minutes: number): string {
  if (minutes >= 1440) return `${Math.round(minutes / 1440)} 天前`
  if (minutes >= 60) return `${Math.round(minutes / 60)} 小时前`
  return `${minutes} 分钟前`
}
