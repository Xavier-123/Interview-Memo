import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  ClipboardList,
  BookOpen,
  Building2,
  Settings,
  FileText,
  BarChart3,
  Bot,
  History,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const navGroups = [
  {
    label: '求职管理',
    items: [
      { to: '/', label: '总览', icon: LayoutDashboard },
      { to: '/jobs', label: '岗位', icon: Briefcase },
      { to: '/resumes', label: '简历', icon: FileText },
    ],
  },
  {
    label: '面试与复盘',
    items: [
      { to: '/interviews', label: '面试', icon: ClipboardList },
      { to: '/mock', label: '模拟面试', icon: Bot },
      { to: '/calendar', label: '日历', icon: Calendar },
      { to: '/review', label: '复盘', icon: History },
    ],
  },
  {
    label: '沉淀分析',
    items: [
      { to: '/insights', label: '分析', icon: BarChart3 },
      { to: '/knowledge', label: '题库', icon: BookOpen },
      { to: '/companies', label: '公司', icon: Building2 },
    ],
  },
]

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary to-info shadow-xs ring-1 ring-primary/20">
          <Zap className="h-[18px] w-[18px] fill-white text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-foreground">Interview Memo</p>
          <p className="text-[11px] font-medium text-muted-foreground/80">求职面试 OS</p>
        </div>
      </div>
      <nav className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground/80')} />
                      <span>{label}</span>
                      {isActive && (
                        <span className="absolute left-1 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-primary" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <Separator />
      <div className="p-3">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-primary/10 text-primary shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground/80')} />
              <span>设置</span>
              {isActive && (
                <span className="absolute left-1 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-primary" />
              )}
            </>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
