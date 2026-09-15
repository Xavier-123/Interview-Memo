import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type StatTone = 'primary' | 'info' | 'success' | 'warning' | 'destructive' | 'muted'

const TONE_STYLES: Record<StatTone, string> = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
}

interface StatCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  tone?: StatTone
  className?: string
}

export function StatCard({ label, value, icon: Icon, tone = 'primary', className }: StatCardProps) {
  return (
    <Card
      className={cn('transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md', className)}
    >
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        {Icon && (
          <div className={cn('shrink-0 rounded-xl p-2.5', TONE_STYLES[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
