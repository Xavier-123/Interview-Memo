import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/common/StarRating'
import { TagInput } from '@/components/common/TagInput'
import { useAppStore } from '@/store/useAppStore'
import { autoArchiveQuestion, showArchiveToast } from '@/store/archive'
import type { Question } from '@/types'

interface QuestionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  interviewId: string
  questionCount: number
  question?: Question | null
  onMergeRequest: (questionId: string) => void
}

export function QuestionFormDialog({
  open,
  onOpenChange,
  interviewId,
  questionCount,
  question,
  onMergeRequest,
}: QuestionFormDialogProps) {
  const addQuestion = useAppStore((s) => s.addQuestion)
  const updateQuestion = useAppStore((s) => s.updateQuestion)
  const [form, setForm] = useState({
    question: '',
    myAnswer: '',
    feedback: '',
    idealAnswer: '',
    rating: 3,
    tags: [] as string[],
    isWeak: false,
  })

  useEffect(() => {
    if (open && question) {
      setForm({
        question: question.question,
        myAnswer: question.myAnswer,
        feedback: question.feedback,
        idealAnswer: question.idealAnswer,
        rating: question.rating,
        tags: question.tags,
        isWeak: question.isWeak,
      })
    } else if (open) {
      setForm({ question: '', myAnswer: '', feedback: '', idealAnswer: '', rating: 3, tags: [], isWeak: false })
    }
  }, [open, question])

  const save = async () => {
    if (!form.question.trim()) {
      toast.error('请填写问题')
      return
    }
    if (question) {
      updateQuestion(question.id, form)
      toast.success('问题已更新')
    } else {
      const questionId = addQuestion({
        interviewId,
        order: questionCount + 1,
        ...form,
      })
      const result = await autoArchiveQuestion(questionId)
      if (result) {
        showArchiveToast(result, () => onMergeRequest(questionId))
      } else {
        toast.success('问题已添加')
      }
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{question ? '编辑问题' : '添加问题'}</DialogTitle>
        </DialogHeader>
        <div className="scrollbar-thin grid flex-1 gap-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <Label>问题</Label>
            <Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>我的回答</Label>
            <Textarea value={form.myAnswer} onChange={(e) => setForm({ ...form, myAnswer: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>面试官反馈</Label>
            <Textarea value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>正确理解</Label>
            <Textarea value={form.idealAnswer} onChange={(e) => setForm({ ...form, idealAnswer: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>回答评价</Label>
            <StarRating value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
          </div>
          <div className="space-y-2">
            <Label>标签</Label>
            <TagInput tags={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
          </div>
        </div>
        <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => void save()}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
