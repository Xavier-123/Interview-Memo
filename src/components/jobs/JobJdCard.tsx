import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface JobJdCardProps {
  jd: string
  defaultOpen?: boolean
}

export function JobJdCard({ jd, defaultOpen = false }: JobJdCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const hasJd = jd.trim().length > 0

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>岗位 JD</CardTitle>
        {hasJd && (
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" /> 收起
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" /> 展开
              </>
            )}
          </Button>
        )}
      </CardHeader>
      {(!hasJd || open) && (
        <CardContent>
          {hasJd ? (
            <p className="whitespace-pre-wrap text-sm">{jd}</p>
          ) : (
            <p className="text-sm text-muted-foreground">暂无 JD</p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
