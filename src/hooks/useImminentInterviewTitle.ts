import { useEffect } from 'react'
import { getCountdownLabel } from '@/lib/urgency'
import { selectUpcomingInterviews24h } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import type { AppState } from '@/store/useAppStore'

/** 最近一场面试 ≤ 1 小时视为临期，标签页标题切换为实时倒计时 */
const IMMINENT_MS = 60 * 60 * 1000
/** 只在首次运行时记录基准标题（index.html 的静态标题），之后据此恢复 */
let baseTitle: string | null = null

/**
 * 临期面试的标签页标题倒计时，每 30s 刷新，切到其他标签页也能瞥见。
 * 隐私模式开启时 PrivacyManager 的 titleObserver 会对写入的标题自动掩码，无需在此处理。
 */
export function useImminentInterviewTitle() {
  const interviews = useAppStore((s) => s.interviews)
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)
  const reviews = useAppStore((s) => s.reviews)

  useEffect(() => {
    const base = baseTitle ?? document.title
    baseTitle = base
    const update = () => {
      const upcoming = selectUpcomingInterviews24h({ interviews, jobs, companies, reviews } as AppState)
      const nearest = upcoming[0]
      const ms = nearest ? new Date(nearest.scheduledAt).getTime() - Date.now() : Number.POSITIVE_INFINITY
      const next =
        nearest && ms > 0 && ms <= IMMINENT_MS
          ? `⏰ ${getCountdownLabel(nearest.scheduledAt)} ${nearest.round} · ${nearest.company?.name ?? ''}`
          : base
      if (document.title !== next) document.title = next
    }
    update()
    const id = window.setInterval(update, 30_000)
    return () => {
      window.clearInterval(id)
      if (document.title !== base) document.title = base
    }
  }, [interviews, jobs, companies, reviews])
}
