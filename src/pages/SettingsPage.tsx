import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { BellRing, Database, Settings, ShieldCheck, Sparkles, Tags, TriangleAlert, User } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TagInput } from '@/components/common/TagInput'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/store/useAppStore'
import { downloadJson, readJsonFile, validateImportData, formatImportError } from '@/store/io'
import { toExportData } from '@/store/selectors'
import { archiveAllUnlinked } from '@/store/archive'
import { formatBytes, getPersistedDataSize } from '@/store/persistStorage'
import { isLlmConfigured, testConnection } from '@/lib/llm'
import { REMINDER_LEAD_OPTIONS, type Theme } from '@/types'

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const resetToDemo = useAppStore((s) => s.resetToDemo)
  const clearAll = useAppStore((s) => s.clearAll)
  const loadData = useAppStore((s) => s.loadData)
  const clearCompletedMockSessions = useAppStore((s) => s.clearCompletedMockSessions)
  const mockSessions = useAppStore((s) => s.mockSessions)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace')
  const [resetOpen, setResetOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [llmTesting, setLlmTesting] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const handleExport = () => {
    downloadJson(toExportData(useAppStore.getState()))
    toast.success('数据已导出（API Key 已剔除）')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const raw = await readJsonFile(file)
      const data = validateImportData(raw)
      loadData(data, importMode)
      toast.success(importMode === 'replace' ? '数据已覆盖导入' : '数据已合并导入')
    } catch (e) {
      toast.error(formatImportError(e))
    }
    e.target.value = ''
  }

  const toggleLeadMinute = (minutes: number) => {
    const current = settings.reminder.leadMinutes
    const next = current.includes(minutes)
      ? current.filter((m) => m !== minutes)
      : [...current, minutes].sort((a, b) => b - a)
    updateSettings({ reminder: { ...settings.reminder, leadMinutes: next } })
  }

  const requestBrowserNotification = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('当前浏览器不支持系统通知')
      return
    }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      updateSettings({ reminder: { ...settings.reminder, browserNotification: true } })
      toast.success('浏览器通知已开启')
    } else {
      updateSettings({ reminder: { ...settings.reminder, browserNotification: false } })
      toast.error('浏览器通知权限被拒绝')
    }
  }

  const sendTestNotification = () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      toast.error('请先授权浏览器通知')
      return
    }
    new Notification('Interview Memo 测试提醒', {
      body: '这是一条测试通知。浏览器通知仅在页面打开时生效。',
    })
  }

  const handleTestLlm = async () => {
    if (!isLlmConfigured(settings.llm)) {
      toast.error('请填写完整的 API 配置并启用')
      return
    }
    setLlmTesting(true)
    try {
      const msg = await testConnection(settings.llm)
      toast.success(msg)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '连接失败')
    } finally {
      setLlmTesting(false)
    }
  }

  const handleArchiveAll = async () => {
    setArchiving(true)
    try {
      await archiveAllUnlinked()
    } finally {
      setArchiving(false)
    }
  }

  const notificationStatus =
    typeof Notification === 'undefined'
      ? '不支持'
      : Notification.permission === 'granted'
        ? '已授权'
        : Notification.permission === 'denied'
          ? '已拒绝'
          : '未授权'

  const completedMockCount = mockSessions.filter((s) => s.status === 'completed').length
  const storageSize = getPersistedDataSize()

  const updateCategoryName = (oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) return
    if (settings.knowledgeCategories[trimmed]) {
      toast.error('分类名称已存在')
      return
    }
    const next = { ...settings.knowledgeCategories }
    next[trimmed] = next[oldName]
    delete next[oldName]
    updateSettings({ knowledgeCategories: next })
  }

  const addCategory = () => {
    let name = '新分类'
    let i = 1
    while (settings.knowledgeCategories[name]) {
      name = `新分类${i++}`
    }
    updateSettings({
      knowledgeCategories: { ...settings.knowledgeCategories, [name]: [] },
    })
  }

  const removeCategory = (name: string) => {
    if (Object.keys(settings.knowledgeCategories).length <= 1) {
      toast.error('至少保留一个分类')
      return
    }
    const next = { ...settings.knowledgeCategories }
    delete next[name]
    updateSettings({ knowledgeCategories: next })
  }

  const updateSubcategories = (category: string, subs: string[]) => {
    updateSettings({
      knowledgeCategories: { ...settings.knowledgeCategories, [category]: subs },
    })
  }

  return (
    <div>
      <PageHeader icon={Settings} title="设置" description="个性化配置与数据管理" />

      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              个人设置
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input value={settings.userName} onChange={(e) => updateSettings({ userName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>主题</Label>
              <Select value={settings.theme} onValueChange={(v) => updateSettings({ theme: v as Theme })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">浅色</SelectItem>
                  <SelectItem value="dark">深色</SelectItem>
                  <SelectItem value="system">跟随系统</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>每周起始日</Label>
              <Select
                value={String(settings.weekStartsOn)}
                onValueChange={(v) => updateSettings({ weekStartsOn: Number(v) as 0 | 1 })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">周一</SelectItem>
                  <SelectItem value="0">周日</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

                <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                隐私与摸鱼模式 (防偷窥)
              </CardTitle>
              <Badge variant={settings.privacyMode ? "default" : "outline"} className={settings.privacyMode ? "bg-amber-500 hover:bg-amber-600" : ""}>
                {settings.privacyMode ? "已开启" : "未开启"}
              </Badge>
            </div>
            <CardDescription>
              在办公室或公共场合使用时，自动屏蔽所有求职与面试关键词。快捷键 <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">Alt + P</kbd>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="privacy-mode"
                checked={settings.privacyMode ?? false}
                onCheckedChange={(c) => updateSettings({ privacyMode: !!c })}
              />
              <Label htmlFor="privacy-mode" className="cursor-pointer font-medium">
                启用全站关键词脱敏遮蔽
              </Label>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3.5 text-xs text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground">脱敏替换规则速览：</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded border bg-background/80 px-2 py-1">面试 → <strong className="text-foreground">MS</strong></div>
                <div className="rounded border bg-background/80 px-2 py-1">简历 → <strong className="text-foreground">JL</strong></div>
                <div className="rounded border bg-background/80 px-2 py-1">求职 → <strong className="text-foreground">QZ</strong></div>
                <div className="rounded border bg-background/80 px-2 py-1">岗位 → <strong className="text-foreground">GW</strong></div>
                <div className="rounded border bg-background/80 px-2 py-1">投递 → <strong className="text-foreground">TD</strong></div>
                <div className="rounded border bg-background/80 px-2 py-1">薪资 → <strong className="text-foreground">XZ</strong></div>
                <div className="rounded border bg-background/80 px-2 py-1">笔试 → <strong className="text-foreground">BS</strong></div>
                <div className="rounded border bg-background/80 px-2 py-1">一面/二面 → <strong className="text-foreground">1M/2M</strong></div>
              </div>
              <p className="pt-1 text-[11px] leading-relaxed">
                同时网页标题会自动伪装为 <code>Dev Memo</code>，防止浏览器标签页露馅。关闭后所有内容无损恢复。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary" />
              题库分类
            </CardTitle>
            <CardDescription>自定义分类与子分类，新建题目时默认使用第一项</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings.knowledgeCategories).map(([cat, subs]) => (
              <div key={cat} className="rounded-md border p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    defaultValue={cat}
                    className="max-w-xs"
                    onBlur={(e) => updateCategoryName(cat, e.target.value)}
                  />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeCategory(cat)}>
                    删除
                  </Button>
                </div>
                <TagInput tags={subs} onChange={(next) => updateSubcategories(cat, next)} placeholder="子分类，回车添加" />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addCategory}>添加分类</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary" />
              面试提醒
            </CardTitle>
            <CardDescription>应用内 Toast + 可选浏览器系统通知（页面打开时生效）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="reminder-enabled"
                checked={settings.reminder.enabled}
                onCheckedChange={(c) => updateSettings({ reminder: { ...settings.reminder, enabled: !!c } })}
              />
              <Label htmlFor="reminder-enabled">启用面试提醒</Label>
            </div>
            <div className="space-y-2">
              <Label>提前提醒时间</Label>
              <div className="flex flex-wrap gap-3">
                {REMINDER_LEAD_OPTIONS.map(({ minutes, label }) => (
                  <label key={minutes} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={settings.reminder.leadMinutes.includes(minutes)}
                      onCheckedChange={() => toggleLeadMinute(minutes)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="browser-notif"
                  checked={settings.reminder.browserNotification}
                  onCheckedChange={(c) => {
                    if (c) requestBrowserNotification()
                    else updateSettings({ reminder: { ...settings.reminder, browserNotification: false } })
                  }}
                />
                <Label htmlFor="browser-notif">浏览器系统通知</Label>
              </div>
              <span className="text-xs text-muted-foreground">权限：{notificationStatus}</span>
              <Button variant="outline" size="sm" onClick={sendTestNotification}>发送测试通知</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              大模型配置
              {isLlmConfigured(settings.llm) && (
                <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                  已配置
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              用于面试题同题判定、AI 学习建议与模拟面试。启用后简历与项目内容会发往你配置的 API。API Key 存于本机 localStorage，导出 JSON 时会剔除。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="llm-enabled"
                checked={settings.llm.enabled}
                onCheckedChange={(c) => updateSettings({ llm: { ...settings.llm, enabled: !!c } })}
              />
              <Label htmlFor="llm-enabled">启用大模型</Label>
            </div>
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                placeholder="https://api.openai.com/v1"
                value={settings.llm.baseUrl}
                onChange={(e) => updateSettings({ llm: { ...settings.llm, baseUrl: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={settings.llm.apiKey}
                onChange={(e) => updateSettings({ llm: { ...settings.llm, apiKey: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                placeholder="gpt-4o-mini"
                value={settings.llm.model}
                onChange={(e) => updateSettings({ llm: { ...settings.llm, model: e.target.value } })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleTestLlm} disabled={llmTesting}>
                {llmTesting ? '测试中...' : '测试连接'}
              </Button>
              <Button variant="outline" onClick={handleArchiveAll} disabled={archiving}>
                {archiving ? '归档中...' : '归档历史问题'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              数据管理
            </CardTitle>
            <CardDescription>导入 / 导出 JSON，方便迁移与备份</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              本地存储占用约 {formatBytes(storageSize)}（浏览器配额通常约 5 MB）
            </p>
            {completedMockCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">已完成模拟会话 {completedMockCount} 个</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearCompletedMockSessions()
                    toast.success('已清理已完成模拟会话')
                  }}
                >
                  清理已完成模拟会话
                </Button>
              </div>
            )}
            <Button onClick={handleExport}>导出数据</Button>
            <div className="space-y-2">
              <Label>导入数据</Label>
              <Select value={importMode} onValueChange={(v) => setImportMode(v as 'replace' | 'merge')}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="replace">覆盖导入</SelectItem>
                  <SelectItem value="merge">合并导入</SelectItem>
                </SelectContent>
              </Select>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>选择 JSON 文件</Button>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                <TriangleAlert className="h-4 w-4" />
                危险操作
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">以下操作会覆盖或删除本地数据，请先导出备份</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setResetOpen(true)}>重置演示数据</Button>
                <Button variant="destructive" onClick={() => setClearOpen(true)}>清空所有数据</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="重置演示数据"
        description="将恢复为预置的 Demo 数据，当前数据将被覆盖。"
        onConfirm={() => { resetToDemo(); toast.success('已重置为演示数据') }}
      />
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="清空所有数据"
        description="此操作不可撤销，所有岗位、面试、题库数据将被删除。"
        destructive
        confirmLabel="清空"
        onConfirm={() => { clearAll(); toast.success('数据已清空') }}
      />
    </div>
  )
}
