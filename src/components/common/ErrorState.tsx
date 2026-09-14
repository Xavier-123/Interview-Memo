import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface ErrorStateProps {
  title?: string
  description?: string
  showBack?: boolean
}

export function ErrorState({
  title = '未找到内容',
  description = '请求的资源不存在或已被删除。',
  showBack = true,
}: ErrorStateProps) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {showBack && (
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          返回
        </Button>
      )}
    </div>
  )
}
