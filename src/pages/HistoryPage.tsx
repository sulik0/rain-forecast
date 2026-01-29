import type { RainAlert } from '@/types'
import { cn, formatDate, formatTime, getRainLevelClass } from '@/lib/utils'
import { History, AlertTriangle, Trash2, CloudRain } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface HistoryPageProps {
  alerts: RainAlert[]
  onClearAlerts: () => void
}

export function HistoryPage({ alerts, onClearAlerts }: HistoryPageProps) {
  const { showToast } = useToast()

  const handleClear = () => {
    if (alerts.length === 0) {
      showToast('暂无历史记录', 'info')
      return
    }
    onClearAlerts()
    showToast('历史记录已清空', 'success')
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">预警历史</h1>
          <p className="text-muted-foreground mt-1">
            查看历史降雨预警记录
          </p>
        </div>
        <button
          onClick={handleClear}
          className="btn-ghost text-danger hover:bg-danger/10"
        >
          <Trash2 className="w-4 h-4" />
          清空记录
        </button>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <History className="w-5 h-5 text-primary-light" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总记录数</p>
              <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">触发预警</p>
              <p className="text-2xl font-bold text-warning">
                {alerts.filter(a => a.triggered).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <CloudRain className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">平均概率</p>
              <p className="text-2xl font-bold text-success">
                {alerts.length > 0
                  ? Math.round(
                      alerts.reduce((sum, a) => sum + a.weightedProbability, 0) / alerts.length
                    )
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 历史记录列表 */}
      {alerts.length === 0 ? (
        <div className="card text-center py-12">
          <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">暂无历史记录</h3>
          <p className="text-muted-foreground">
            系统将自动记录每次降雨预警
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'card flex items-center justify-between',
                alert.triggered && 'ring-1 ring-warning/30'
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  alert.triggered ? 'bg-warning/20' : 'bg-muted/50'
                )}>
                  {alert.triggered ? (
                    <AlertTriangle className="w-6 h-6 text-warning" />
                  ) : (
                    <CloudRain className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {alert.city.name}
                    </h3>
                    {alert.triggered && (
                      <span className="badge-warning">已预警</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(new Date(alert.date))} · {formatTime(new Date(alert.createdAt))}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className={cn(
                  'text-2xl font-bold',
                  getRainLevelClass(alert.weightedProbability)
                )}>
                  {alert.weightedProbability}%
                </p>
                <p className="text-xs text-muted-foreground">
                  阈值: {alert.threshold}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
