import * as React from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parseISO,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const MONTHS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
]

export function DatePicker({
  value,
  onChange,
  placeholder = '选择投递日期',
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const parsedValue = React.useMemo(() => {
    if (!value) return null
    const d = parseISO(value)
    return isValid(d) ? d : null
  }, [value])

  const [viewDate, setViewDate] = React.useState<Date>(() => parsedValue ?? new Date())

  // 当弹窗打开时，若有已选值，自动定位到已选值的年月
  React.useEffect(() => {
    if (open && parsedValue) {
      setViewDate(parsedValue)
    }
  }, [open, parsedValue])

  const currentYear = getYear(viewDate)
  const currentMonth = getMonth(viewDate)

  // 生成年份选项列表 (当前年前后 10 年)
  const yearOptions = React.useMemo(() => {
    const baseYear = new Date().getFullYear()
    const years: number[] = []
    for (let y = baseYear - 10; y <= baseYear + 10; y++) {
      years.push(y)
    }
    if (!years.includes(currentYear)) {
      years.push(currentYear)
      years.sort((a, b) => a - b)
    }
    return years
  }, [currentYear])

  // 生成月份日历网格 (周一开始)
  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [viewDate])

  const handleSelectDay = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const handleToday = () => {
    const today = new Date()
    setViewDate(today)
    onChange(format(today, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'group flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-all hover:border-primary/40 hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            {parsedValue ? (
              <span className="font-medium text-foreground">
                {format(parsedValue, 'yyyy-MM-dd', { locale: zhCN })}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          {parsedValue && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onChange('')
                }
              }}
              className="rounded-full p-0.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
              aria-label="清空日期"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
              选择
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[290px] p-3 shadow-xl" align="start">
        {/* 年月控制器 */}
        <div className="mb-3 flex items-center justify-between gap-1">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setViewDate((d) => subMonths(d, 1))}
            aria-label="上个月"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            {/* 年份下拉 */}
            <select
              value={currentYear}
              onChange={(e) => setViewDate((d) => setYear(d, Number(e.target.value)))}
              className="h-7 rounded-md border border-border/80 bg-background px-1.5 text-xs font-semibold text-foreground shadow-xs outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>

            {/* 月份下拉 */}
            <select
              value={currentMonth}
              onChange={(e) => setViewDate((d) => setMonth(d, Number(e.target.value)))}
              className="h-7 rounded-md border border-border/80 bg-background px-1.5 text-xs font-semibold text-foreground shadow-xs outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {MONTHS.map((label, idx) => (
                <option key={idx} value={idx}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setViewDate((d) => addMonths(d, 1))}
            aria-label="下个月"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 星期表头 */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1 text-[11px] font-semibold text-muted-foreground/80">
              {w}
            </span>
          ))}
        </div>

        {/* 日期天数网格 */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((day) => {
            const inCurrentMonth = isSameMonth(day, viewDate)
            const isSelected = parsedValue ? isSameDay(day, parsedValue) : false
            const isTodayDate = isToday(day)

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all duration-150',
                  isSelected
                    ? 'bg-primary font-semibold text-primary-foreground shadow-xs'
                    : isTodayDate
                      ? 'bg-primary/10 font-bold text-primary ring-1 ring-primary/40'
                      : inCurrentMonth
                        ? 'text-foreground hover:bg-accent hover:text-foreground'
                        : 'text-muted-foreground/30 hover:text-muted-foreground/60',
                )}
              >
                <span>{format(day, 'd')}</span>
              </button>
            )
          })}
        </div>

        {/* 底部快捷操作栏 */}
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-6 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={handleToday}
          >
            今天
          </Button>
          {parsedValue && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-6 px-2 text-xs font-medium text-muted-foreground hover:text-destructive"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              清除
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
