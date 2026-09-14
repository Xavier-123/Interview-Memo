import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useState, type KeyboardEvent } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({ tags, onChange, placeholder = '添加标签...', className }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = (tag: string) => {
    const t = tag.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5 rounded-md border border-input p-2', className)}>
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          #{tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}>
            <X className="h-3 w-3 opacity-60 hover:opacity-100" />
          </button>
        </Badge>
      ))}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="h-7 min-w-[100px] flex-1 border-0 shadow-none focus-visible:ring-0"
      />
    </div>
  )
}

export function TagChip({ tag }: { tag: string }) {
  return (
    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
      #{tag}
    </Badge>
  )
}
