import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'

export function StorageErrorBanner() {
  const storageError = useAppStore((s) => s.storageError)
  const clearStorageError = useAppStore((s) => s.clearStorageError)
  const clearCompletedMockSessions = useAppStore((s) => s.clearCompletedMockSessions)

  if (!storageError) return null

  return (
    <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        <p className="min-w-0 flex-1 text-sm text-destructive">{storageError}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings">去设置</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearCompletedMockSessions()
              clearStorageError()
            }}
          >
            清理模拟会话
          </Button>
        </div>
      </div>
    </div>
  )
}
