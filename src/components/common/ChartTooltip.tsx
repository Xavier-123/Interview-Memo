import { cn } from '@/lib/utils'

interface ChartTooltipItem {
  name?: string | number
  value?: number | string | Array<number | string>
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipItem[]
  label?: string | number
  valueFormatter?: (value: number) => string
  labelFormatter?: (label: string | number) => string
  className?: string
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  className,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className={cn(
        'min-w-32 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg',
        className,
      )}
    >
      {label != null && label !== '' && (
        <p className="mb-1.5 font-medium text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((item, i) => {
          const value =
            valueFormatter && typeof item.value === 'number' ? valueFormatter(item.value) : item.value
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={item.color ? { backgroundColor: item.color } : undefined}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-medium tabular-nums text-foreground">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
