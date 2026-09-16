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
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** 显示时间选择（时/分下拉），值为 yyyy-MM-ddTHH:mm 格式 */
  showTime?: boolean
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

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

/** 从 value 中提取时间部分（支持 yyyy-MM-dd 与 yyyy-MM-ddTHH:mm） */
const getTimePart = (value?: string): { hour: string; minute: string } | null => {
  const m = value?.match(/T(\d{2}):(\d{2})/)
  return m ? { hour: m[1], minute: m[2] } : null
}

/** 拼接日期与时间；未选过时间时默认 09:00 */
const composeDateTime = (
  dateStr: string,
  timePart: { hour: string; minute: string } | null,
): string => {
  const t = timePart ?? { hour: '09', minute: '00' }
  return `${dateStr}T${t.hour}:${t.minute}`
}

export function DatePicker({
  value,
  onChange,
  placeholder = '选择日期',
  disabled = false,
  className,
  showTime = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const parsedValue = React.useMemo(() => {
    if (!value) return null
    const d = parseISO(value)
    return isValid(d) ? d : null
  }, [value])

  const timePart = React.useMemo(() => getTimePart(value), [value])

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
    const dateStr = format(day, 'yyyy-MM-dd')
    onChange(showTime ? composeDateTime(dateStr, timePart) : dateStr)
    // 带时间选择时保持弹层打开，便于继续调整时分
    if (!showTime) setOpen(false)
  }

  const handleTimeChange = (kind: 'hour' | 'minute', v: string) => {
    const dateStr = parsedValue ? format(parsedValue, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    const next = {
      hour: kind === 'hour' ? v : (timePart?.hour ?? '09'),
      minute: kind === 'minute' ? v : (timePart?.minute ?? '00'),
    }
    onChange(`${dateStr}T${next.hour}:${next.minute}`)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const handleToday = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd')
    onChange(showTime ? composeDateTime(dateStr, timePart) : dateStr)
    setViewDate(new Date())
    if (!showTime) setOpen(false)
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
                {format(parsedValue, timePart ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd', { locale: zhCN })}
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

        {/* 时间选择行 */}
        {showTime && (
          <div className="mt-2 flex items-center justify-center gap-1.5 border-t border-border/60 pt-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <select
              value={timePart?.hour ?? ''}
              onChange={(e) => handleTimeChange('hour', e.target.value)}
              className="h-7 rounded-md border border-border/80 bg-background px-1.5 text-xs font-semibold text-foreground shadow-xs outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary"
              aria-label="小时"
            >
              <option value="" disabled>
                时
              </option>
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold text-muted-foreground">:</span>
            <select
              value={timePart?.minute ?? ''}
              onChange={(e) => handleTimeChange('minute', e.target.value)}
              className="h-7 rounded-md border border-border/80 bg-background px-1.5 text-xs font-semibold text-foreground shadow-xs outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary"
              aria-label="分钟"
            >
              <option value="" disabled>
                分
              </option>
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

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
          <div className="flex items-center gap-1">
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
            {showTime && (
              <Button
                size="sm"
                type="button"
                className="h-6 px-3 text-xs font-medium"
                onClick={() => setOpen(false)}
              >
                确定
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
