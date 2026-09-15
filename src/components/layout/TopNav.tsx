import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Moon, Plus, Search, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAppStore } from '@/store/useAppStore'
import { getCompanyName } from '@/store/selectors'
import { getSessionTitle } from '@/lib/mockInterview'
import { MOCK_MODE_LABELS } from '@/types'

export function TopNav() {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const companies = useAppStore((s) => s.companies)
  const jobs = useAppStore((s) => s.jobs)
  const interviews = useAppStore((s) => s.interviews)
  const knowledge = useAppStore((s) => s.knowledge)
  const mockSessions = useAppStore((s) => s.mockSessions)
  const projects = useAppStore((s) => s.projects)
  const resumes = useAppStore((s) => s.resumes)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)

  const searchIndex = useMemo(() => {
    const jobItems = jobs.map((job) => {
      const companyName = getCompanyName(companies, job.companyId)
      return {
        id: job.id,
        label: `${companyName} · ${job.title}`,
        value: [companyName, job.title, job.location, job.salaryText, job.source, ...job.tags].filter(Boolean).join(' '),
        path: `/jobs/${job.id}`,
      }
    })

    const companyItems = companies.map((c) => ({
      id: c.id,
      label: c.name,
      value: [c.name, c.industry, c.location, ...c.techDirections, c.notes].join(' '),
      path: `/companies/${c.id}`,
    }))

    const interviewItems = interviews.map((i) => {
      const job = jobs.find((j) => j.id === i.jobId)
      const companyName = job ? getCompanyName(companies, job.companyId) : '面试'
      return {
        id: i.id,
        label: `${companyName} · ${job?.title ?? '未知岗位'} · ${i.round}`,
        value: [companyName, job?.title, i.round, i.interviewer, i.notes].filter(Boolean).join(' '),
        path: `/interviews/${i.id}`,
      }
    })

    const knowledgeItems = knowledge.map((k) => ({
      id: k.id,
      label: k.title,
      value: [k.title, k.category, k.subcategory, ...k.tags, ...k.aliases, k.notes].join(' '),
      path: `/knowledge?focus=${k.id}`,
    }))

    const mockItems = mockSessions.map((session) => {
      const job = session.jobId ? jobs.find((j) => j.id === session.jobId) : undefined
      const company = session.companyId
        ? companies.find((c) => c.id === session.companyId)
        : job
          ? companies.find((c) => c.id === job.companyId)
          : undefined
      const sessionProjects = projects.filter((p) => session.projectIds.includes(p.id))
      const title = getSessionTitle(session.mode, company, job, sessionProjects)
      return {
        id: session.id,
        label: `${MOCK_MODE_LABELS[session.mode]} · ${title}`,
        value: [title, MOCK_MODE_LABELS[session.mode], session.roundHint].filter(Boolean).join(' '),
        path: `/mock/${session.id}`,
      }
    })

    const resumeItems = resumes.map((resume) => ({ id: resume.id, label: resume.name, value: resume.name, path: `/resumes/${resume.id}` }))
    return { jobItems, companyItems, interviewItems, knowledgeItems, mockItems, resumeItems }
  }, [jobs, companies, interviews, knowledge, mockSessions, projects, resumes])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolvedDark =
    settings.theme === 'dark' || (settings.theme === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedDark)
  }, [resolvedDark])

  const toggleTheme = () => {
    updateSettings({ theme: resolvedDark ? 'light' : 'dark' })
  }

  const go = (path: string) => {
    navigate(path)
    setSearchOpen(false)
  }

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="hidden flex-1 lg:block">
          <Button
            variant="outline"
            className="h-9 w-full max-w-sm justify-start text-sm font-normal text-muted-foreground shadow-none hover:border-primary/30"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4 text-muted-foreground/70" />
            搜索岗位、公司、面试、简历、题库...
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              Ctrl K
            </kbd>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">新增</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/jobs?new=1')}>新增岗位</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/resumes?new=1')}>新增简历</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/interviews?new=1')}>新增面试</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/companies?new=1')}>新增公司</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/knowledge?new=1')}>新增题目</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="切换主题">
            {resolvedDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="搜索..." />
        <CommandList>
          <CommandEmpty>未找到结果</CommandEmpty>
          <CommandGroup heading="岗位">
            {searchIndex.jobItems.map((item) => (
              <CommandItem key={item.id} value={item.value} onSelect={() => go(item.path)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="公司">
            {searchIndex.companyItems.map((item) => (
              <CommandItem key={item.id} value={item.value} onSelect={() => go(item.path)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="面试">
            {searchIndex.interviewItems.map((item) => (
              <CommandItem key={item.id} value={item.value} onSelect={() => go(item.path)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="题库">
            {searchIndex.knowledgeItems.map((item) => (
              <CommandItem key={item.id} value={item.value} onSelect={() => go(item.path)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="模拟面试">
            {searchIndex.mockItems.map((item) => (
              <CommandItem key={item.id} value={item.value} onSelect={() => go(item.path)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="简历">
            {searchIndex.resumeItems.map((item) => (
              <CommandItem key={item.id} value={item.value} onSelect={() => go(item.path)}>{item.label}</CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
