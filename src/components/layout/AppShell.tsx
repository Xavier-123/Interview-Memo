import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { ReminderBanner } from '@/components/layout/ReminderBanner'
import { StorageErrorBanner } from '@/components/layout/StorageErrorBanner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/useAppStore'
import { useInterviewReminders } from '@/hooks/useInterviewReminders'
import { useEffect } from 'react'

export function AppShell() {
  const hydrated = useAppStore((s) => s.hydrated)
  useInterviewReminders()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useAppStore.getState().hydrated) {
        useAppStore.getState().setHydrated(true)
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav />
          <StorageErrorBanner />
          <ReminderBanner />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
