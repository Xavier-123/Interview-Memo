import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (v: number) => void
  max?: number
  size?: 'sm' | 'md'
  readonly?: boolean
}

export function StarRating({ value, onChange, max = 5, size = 'md', readonly = false }: StarRatingProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly || !onChange}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            readonly || !onChange ? 'cursor-default' : 'cursor-pointer hover:scale-110',
          )}
        >
          <Star
            className={cn(
              iconSize,
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  )
}
