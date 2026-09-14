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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { to: '/', label: '总览', icon: LayoutDashboard },
  { to: '/jobs', label: '岗位', icon: Briefcase },
  { to: '/resumes', label: '简历', icon: FileText },
  { to: '/interviews', label: '面试', icon: ClipboardList },
  { to: '/mock', label: '模拟面试', icon: Bot },
  { to: '/calendar', label: '日历', icon: Calendar },
  { to: '/review', label: '复盘', icon: FileText },
  { to: '/insights', label: '分析', icon: BarChart3 },
  { to: '/knowledge', label: '题库', icon: BookOpen },
  { to: '/companies', label: '公司', icon: Building2 },
]

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <div>
          <p className="text-sm font-semibold">Interview Memo</p>
          <p className="text-xs text-muted-foreground">求职面试 OS</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Separator />
      <div className="p-3">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent',
              isActive && 'bg-sidebar-accent',
            )
          }
        >
          <Settings className="h-4 w-4" />
          设置
        </NavLink>
      </div>
    </aside>
  )
}
