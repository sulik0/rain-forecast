import type { NotificationConfig, NotificationSchedule } from '@/types'
import { cn } from '@/lib/utils'
import { Bell, Clock, MessageSquare, AlertCircle, ExternalLink, Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { sendTestNotification } from '@/lib/notification'
import { useEffect, useState } from 'react'

interface NotificationPageProps {
  config: NotificationConfig
  onUpdateConfig: (updates: Partial<NotificationConfig>) => void
  onUpdateSchedule: (id: string, updates: Partial<NotificationSchedule>) => void
  nextNotificationTime?: Date | null
  timeRemaining?: string
  lastCheckTime?: Date | null
}

type RemoteTarget = 'today' | 'tomorrow' | 'range'

interface RemoteSlotConfig {
  enabled: boolean
  target: RemoteTarget
}

interface RemoteConfig {
  enabled: boolean
  slots: {
    morning: RemoteSlotConfig
    evening: RemoteSlotConfig
    night: RemoteSlotConfig
  }
}

export function NotificationPage({
  config,
  onUpdateConfig,
  onUpdateSchedule,
  nextNotificationTime,
  timeRemaining,
  lastCheckTime
}: NotificationPageProps) {
  const { showToast } = useToast()
  const [sending, setSending] = useState(false)
  const [adminToken, setAdminToken] = useState('')
  const [remoteConfig, setRemoteConfig] = useState<RemoteConfig | null>(null)
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [remoteSaving, setRemoteSaving] = useState(false)

  const handleToggleMain = () => {
    onUpdateConfig({ enabled: !config.enabled })
    showToast(
      config.enabled ? '通知已关闭' : '通知已开启',
      config.enabled ? 'info' : 'success'
    )
  }

  const handleThresholdChange = (value: number) => {
    onUpdateConfig({ threshold: value })
  }

  const handleTokenChange = (token: string) => {
    onUpdateConfig({ wechatPushToken: token })
  }

  const handleForecastEnabled = () => {
    onUpdateConfig({
      forecast: {
        ...config.forecast,
        enabled: !config.forecast.enabled,
      },
    })
  }

  const handleForecastTimeChange = (time: string) => {
    onUpdateConfig({
      forecast: {
        ...config.forecast,
        time,
      },
    })
  }

  const handleForecastDaysChange = (days: 1 | 2 | 3) => {
    onUpdateConfig({
      forecast: {
        ...config.forecast,
        days,
      },
    })
  }

  useEffect(() => {
    const saved = localStorage.getItem('rain-admin-token')
    if (saved) {
      setAdminToken(saved)
    }
  }, [])

  const loadRemoteConfig = async () => {
    if (!adminToken) {
      showToast('请先填写后台管理口令', 'warning')
      return
    }

    setRemoteLoading(true)
    try {
      const response = await fetch('/api/cron/config', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })
      const data = await response.json()
      if (!response.ok) {
        showToast(data?.error || '获取配置失败', 'danger')
        return
      }
      setRemoteConfig(data.config)
      showToast('✅ 已加载后台配置', 'success')
    } catch (error) {
      console.error('加载后台配置失败:', error)
      showToast('❌ 网络错误，无法加载后台配置', 'danger')
    } finally {
      setRemoteLoading(false)
    }
  }

  const saveRemoteConfig = async () => {
    if (!adminToken || !remoteConfig) {
      showToast('请先加载后台配置', 'warning')
      return
    }

    setRemoteSaving(true)
    try {
      const response = await fetch('/api/cron/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(remoteConfig),
      })
      const data = await response.json()
      if (!response.ok) {
        showToast(data?.error || '保存配置失败', 'danger')
        return
      }
      setRemoteConfig(data.config)
      showToast('✅ 后台配置已保存', 'success')
    } catch (error) {
      console.error('保存后台配置失败:', error)
      showToast('❌ 网络错误，无法保存后台配置', 'danger')
    } finally {
      setRemoteSaving(false)
    }
  }

  const handleRemoteEnabled = () => {
    if (!remoteConfig) return
    setRemoteConfig({ ...remoteConfig, enabled: !remoteConfig.enabled })
  }

  const handleRemoteSlotEnabled = (slot: keyof RemoteConfig['slots']) => {
    if (!remoteConfig) return
    setRemoteConfig({
      ...remoteConfig,
      slots: {
        ...remoteConfig.slots,
        [slot]: {
          ...remoteConfig.slots[slot],
          enabled: !remoteConfig.slots[slot].enabled,
        },
      },
    })
  }

  const handleRemoteSlotTarget = (slot: keyof RemoteConfig['slots'], target: RemoteTarget) => {
    if (!remoteConfig) return
    setRemoteConfig({
      ...remoteConfig,
      slots: {
        ...remoteConfig.slots,
        [slot]: {
          ...remoteConfig.slots[slot],
          target,
        },
      },
    })
  }

  const handleTestNotification = async () => {
    if (!config.wechatPushToken) {
      showToast('请先配置微信推送Token', 'warning')
      return
    }

    setSending(true)
    try {
      const result = await sendTestNotification(config.wechatPushToken)

      if (result.success) {
        showToast('✅ 测试通知发送成功！请检查微信', 'success')
      } else {
        showToast(`❌ 发送失败：${result.message}`, 'danger')
      }
    } catch (error) {
      showToast('❌ 发送失败：网络错误', 'danger')
      console.error('发送测试通知出错:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">通知设置</h1>
        <p className="text-muted-foreground mt-1">
          配置降雨预警通知方式和时间
        </p>
      </div>

      {/* 主开关 */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              config.enabled ? 'bg-primary/20' : 'bg-muted/50'
            )}>
              <Bell className={cn(
                'w-6 h-6',
                config.enabled ? 'text-primary-light' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">启用通知</h3>
              <p className="text-sm text-muted-foreground">
                开启后将在设定时间推送降雨预警
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMain}
            className={cn(
              'relative w-14 h-7 rounded-full transition-colors',
              config.enabled ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                config.enabled ? 'left-8' : 'left-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* 定时器状态 */}
      {config.enabled && (
        <div className="card mb-8 border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary-light mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">定时器运行状态</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nextNotificationTime && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">下次通知时间</p>
                    <p className="text-foreground font-medium">
                      {nextNotificationTime.toLocaleString('zh-CN', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {timeRemaining && (
                      <p className="text-sm text-primary-light mt-1">
                        {timeRemaining}
                      </p>
                    )}
                  </div>
                )}
                {lastCheckTime && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">最后检查时间</p>
                    <p className="text-foreground font-medium">
                      {lastCheckTime.toLocaleString('zh-CN', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-success flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3" />
                      定时器运行中
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 预警阈值 */}
      <div className="card mb-8">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary-light" />
          预警阈值
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          当综合降雨概率超过此阈值时发送通知
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={config.threshold}
            onChange={(e) => handleThresholdChange(parseInt(e.target.value))}
            className="slider flex-1"
          />
          <span className="text-2xl font-bold text-primary-light w-20 text-right">
            {config.threshold}%
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>敏感 (10%)</span>
          <span>适中 (50%)</span>
          <span>保守 (90%)</span>
        </div>
      </div>

      {/* 微信推送配置 */}
      <div className="card mb-8">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-success" />
          微信推送配置
        </h3>
        
        <div className="mb-4">
          <label className="label">推送服务 Token</label>
          <input
            type="text"
            value={config.wechatPushToken || ''}
            onChange={(e) => handleTokenChange(e.target.value)}
            placeholder="输入 Server酱 或 PushPlus 的 Token"
            className="input"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleTestNotification}
            disabled={sending}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                发送中...
              </>
            ) : (
              '发送测试通知'
            )}
          </button>
          <a
            href="https://sct.ftqq.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-light hover:underline flex items-center gap-1"
          >
            获取 Server酱 Token
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 通知时间表 */}
      <div className="card">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning" />
          通知时间表
        </h3>

        <div className="space-y-4">
          {config.schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border transition-all',
                schedule.enabled
                  ? 'bg-muted/30 border-border'
                  : 'bg-muted/10 border-border/50 opacity-60'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-foreground w-20">
                  {schedule.time}
                </div>
                <div>
                  <p className="text-foreground">{schedule.description}</p>
                  <p className="text-xs text-muted-foreground">
                    推送 {schedule.targetDate === 'today' ? '当天' : '明天'} 天气
                  </p>
                </div>
              </div>
              <button
                onClick={() => onUpdateSchedule(schedule.id, { enabled: !schedule.enabled })}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  schedule.enabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    schedule.enabled ? 'left-7' : 'left-1'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 每日天气预报 */}
      <div className="card mt-8">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-light" />
          每日天气预报
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          每天固定时间推送各城市天气预报（支持 1~3 天）
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-medium">启用每日预报</p>
              <p className="text-xs text-muted-foreground">
                需要配置微信推送 Token
              </p>
            </div>
            <button
              onClick={handleForecastEnabled}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                config.forecast.enabled ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                  config.forecast.enabled ? 'left-7' : 'left-1'
                )}
              />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">推送时间</label>
              <input
                type="time"
                value={config.forecast.time}
                onChange={(e) => handleForecastTimeChange(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">预报天数</label>
              <select
                value={String(config.forecast.days)}
                onChange={(e) => handleForecastDaysChange(Number(e.target.value) as 1 | 2 | 3)}
                className="input"
              >
                <option value="1">1 天</option>
                <option value="2">2 天</option>
                <option value="3">3 天</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 后台推送开关 */}
      <div className="card mt-8 border-l-4 border-l-primary">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary-light" />
          后台推送开关（Vercel Cron）
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          通过后台配置控制工作日早/晚推送（需要 ADMIN_SECRET 口令）
        </p>

        <div className="mb-4">
          <label className="label">后台管理口令</label>
          <input
            type="password"
            value={adminToken}
            onChange={(e) => {
              const value = e.target.value
              setAdminToken(value)
              localStorage.setItem('rain-admin-token', value)
            }}
            placeholder="输入 ADMIN_SECRET"
            className="input"
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={loadRemoteConfig}
            disabled={remoteLoading}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {remoteLoading ? '加载中...' : '加载后台配置'}
          </button>
          <button
            onClick={saveRemoteConfig}
            disabled={remoteSaving || !remoteConfig}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {remoteSaving ? '保存中...' : '保存配置'}
          </button>
        </div>

        {remoteConfig ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">后台推送总开关</p>
                <p className="text-xs text-muted-foreground">关闭后所有后台推送暂停</p>
              </div>
              <button
                onClick={handleRemoteEnabled}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  remoteConfig.enabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    remoteConfig.enabled ? 'left-7' : 'left-1'
                  )}
                />
              </button>
            </div>

            {(['morning', 'evening', 'night'] as const).map((slot) => (
              <div
                key={slot}
                className="flex flex-col gap-2 border border-border rounded-xl p-4 bg-muted/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground font-medium">
                      {slot === 'morning' ? '早上 08:00' : slot === 'evening' ? '晚上 18:00' : '晚上 21:00'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      工作日定时推送
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoteSlotEnabled(slot)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      remoteConfig.slots[slot].enabled ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                        remoteConfig.slots[slot].enabled ? 'left-7' : 'left-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">推送内容：</span>
                  <select
                    value={remoteConfig.slots[slot].target}
                    onChange={(e) => handleRemoteSlotTarget(slot, e.target.value as RemoteTarget)}
                    className="input"
                  >
                    <option value="today">当天</option>
                    <option value="tomorrow">第二天</option>
                    <option value="range">未来 1-3 天</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">请先加载后台配置</p>
        )}
      </div>

      {/* 部署说明 */}
      <div className="card mt-8 border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary-light mt-0.5" />
          <div>
            <h3 className="font-medium text-foreground mb-1">定时任务部署</h3>
            <p className="text-sm text-muted-foreground">
              定时通知需要后端服务支持。您可以使用以下方案:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Vercel Cron Jobs - 免费定时任务</li>
              <li>• GitHub Actions - 定时工作流</li>
              <li>• 云函数 (腾讯云/阿里云) - Serverless 方案</li>
              <li>• 自建服务器 - Node.js + node-cron</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
