import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { privacyManager } from '@/lib/privacy'

export function PrivacyModeProvider({ children }: { children?: React.ReactNode }) {
  const privacyMode = useAppStore((s) => s.settings.privacyMode ?? false)
  const updateSettings = useAppStore((s) => s.updateSettings)

  useEffect(() => {
    privacyManager.setEnabled(privacyMode)
  }, [privacyMode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 快捷键: Alt + P
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        const next = !privacyManager.isEnabled()
        updateSettings({ privacyMode: next })
        if (next) {
          toast.success('已开启隐私模式 (Alt+P)', {
            description: '所有求职与面试关键词已脱敏遮蔽',
          })
        } else {
          toast.info('已关闭隐私模式 (Alt+P)', {
            description: '已恢复原始显示',
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [updateSettings])

  return <>{children}</>
}
