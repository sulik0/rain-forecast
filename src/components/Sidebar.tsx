import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  MapPin, 
  Database, 
  Bell, 
  History,
  CloudRain
} from 'lucide-react'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  currentUserName: string
  onLogout: () => void
}

const navItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { id: 'cities', label: '城市管理', icon: MapPin },
  { id: 'sources', label: '数据源配置', icon: Database },
  { id: 'notification', label: '通知设置', icon: Bell },
  { id: 'history', label: '预警历史', icon: History },
]

export function Sidebar({ currentPage, onPageChange, currentUserName, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-card/50 border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <CloudRain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">降雨预警</h1>
            <p className="text-xs text-muted-foreground">Rain Alert System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={cn(
                  'nav-item w-full',
                  currentPage === item.id && 'active'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>当前用户</span>
          <span className="font-medium text-foreground">{currentUserName}</span>
        </div>
        <button
          onClick={onLogout}
          className="btn-ghost w-full mt-3 text-xs"
        >
          退出登录
        </button>
        <div className="text-xs text-muted-foreground text-center">
          <p>多数据源智能预警</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
