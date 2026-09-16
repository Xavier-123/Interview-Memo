import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type StatTone = 'primary' | 'info' | 'success' | 'warning' | 'destructive' | 'muted'

const TONE_STYLES: Record<StatTone, { icon: string; border: string; glow: string }> = {
  primary: {
    icon: 'bg-primary/10 text-primary border-primary/20',
    border: 'hover:border-primary/40',
    glow: 'from-primary/[0.04]',
  },
  info: {
    icon: 'bg-info/10 text-info border-info/20',
    border: 'hover:border-info/40',
    glow: 'from-info/[0.04]',
  },
  success: {
    icon: 'bg-success/10 text-success border-success/20',
    border: 'hover:border-success/40',
    glow: 'from-success/[0.04]',
  },
  warning: {
    icon: 'bg-warning/10 text-warning border-warning/20',
    border: 'hover:border-warning/40',
    glow: 'from-warning/[0.04]',
  },
  destructive: {
    icon: 'bg-destructive/10 text-destructive border-destructive/20',
    border: 'hover:border-destructive/40',
    glow: 'from-destructive/[0.04]',
  },
  muted: {
    icon: 'bg-muted text-muted-foreground border-border',
    border: 'hover:border-border',
    glow: 'from-muted/[0.1]',
  },
}

interface StatCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  tone?: StatTone
  /** 传入后整卡可点击跳转，悬浮动效才有意义 */
  to?: string
  className?: string
}

export function StatCard({ label, value, icon: Icon, tone = 'primary', to, className }: StatCardProps) {
  const currentTone = TONE_STYLES[tone]
  const card = (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
        currentTone.border,
        className,
      )}
    >
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100', currentTone.glow)} />
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
        </div>
        {Icon && (
          <div className={cn('shrink-0 rounded-xl border p-2.5 transition-transform duration-200 group-hover:scale-105', currentTone.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (to) {
    return (
      <Link to={to} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        {card}
      </Link>
    )
  }
  return card
}

