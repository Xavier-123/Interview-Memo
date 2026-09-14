import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { computeDueReminders, formatLeadLabel } from '@/lib/reminders'
import { useAppStore } from '@/store/useAppStore'

export function useInterviewReminders() {
  const navigate = useNavigate()
  const hydrated = useAppStore((s) => s.hydrated)
  const interviews = useAppStore((s) => s.interviews)
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const settings = useAppStore((s) => s.settings)
  const reminderLog = useAppStore((s) => s.reminderLog)
  const markReminderSent = useAppStore((s) => s.markReminderSent)

  useEffect(() => {
    if (!hydrated || !settings.reminder.enabled) return

    const check = () => {
      const due = computeDueReminders(interviews, jobs, companies, settings, reminderLog)
      for (const item of due) {
        const lead = formatLeadLabel(item.leadMinutes)
        toast(`面试提醒（${lead}）`, {
          description: `${item.title}\n${item.body}`,
          duration: 8000,
          action: {
            label: '查看',
            onClick: () => navigate(`/interviews/${item.interviewId}`),
          },
        })

        if (settings.reminder.browserNotification && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const n = new Notification(`面试提醒 · ${lead}`, {
            body: `${item.title}\n${item.body}`,
            tag: item.key,
          })
          n.onclick = () => {
            window.focus()
            navigate(`/interviews/${item.interviewId}`)
          }
        }

        markReminderSent(item.key)
      }
    }

    check()
    const id = window.setInterval(check, 60_000)
    return () => window.clearInterval(id)
  }, [hydrated, interviews, jobs, companies, settings, reminderLog, markReminderSent, navigate])
}
