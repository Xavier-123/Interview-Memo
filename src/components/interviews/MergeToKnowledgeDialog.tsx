import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { rankSimilarKnowledge } from '@/lib/similarity'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'sonner'

interface MergeToKnowledgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  questionId: string
}

export function MergeToKnowledgeDialog({ open, onOpenChange, questionId }: MergeToKnowledgeDialogProps) {
  const questions = useAppStore((s) => s.questions)
  const knowledge = useAppStore((s) => s.knowledge)
  const linkQuestionToKnowledge = useAppStore((s) => s.linkQuestionToKnowledge)
  const [selected, setSelected] = useState<string | null>(null)
  const question = questions.find((q) => q.id === questionId)

  const ranked = useMemo(() => {
    if (!question) return []
    return rankSimilarKnowledge(question.question, knowledge)
  }, [question, knowledge])

  const handleConfirm = () => {
    if (!selected) {
      toast.error('请选择题库条目')
      return
    }
    linkQuestionToKnowledge(questionId, selected, 'manual')
    toast.success('已手动合并到题库')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>合并到已有题</DialogTitle>
        </DialogHeader>
        {question && (
          <p className="text-sm text-muted-foreground">当前问题：{question.question}</p>
        )}
        <Command className="rounded-lg border">
          <CommandInput placeholder="搜索题库..." />
          <CommandList>
            <CommandEmpty>未找到匹配条目</CommandEmpty>
            <CommandGroup heading="按相似度排序">
              {ranked.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => setSelected(item.id)}
                  className={selected === item.id ? 'bg-accent' : ''}
                >
                  <span className="flex-1 truncate">{item.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{Math.round(item.score * 100)}%</span>
                </CommandItem>
              ))}
              {knowledge
                .filter((k) => !ranked.some((r) => r.id === k.id))
                .map((k) => (
                  <CommandItem key={k.id} value={k.title} onSelect={() => setSelected(k.id)} className={selected === k.id ? 'bg-accent' : ''}>
                    {k.title}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleConfirm}>确认合并</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
