import { useEffect, useState } from 'react'
import type { City, DataSource, WeatherData, NotificationConfig } from '@/types'
import { WeatherCard } from '@/components/WeatherCard'
import { formatDate, formatTime } from '@/lib/utils'
import { RefreshCw, CloudRain, Sun, AlertTriangle, Send } from 'lucide-react'
import { sendRainAlertNotification } from '@/lib/notification'
import { useToast } from '@/hooks/useToast'

interface DashboardProps {
  cities: City[]
  dataSources: DataSource[]
  weatherData: Map<string, WeatherData[]>
  threshold: number
  loading: boolean
  notificationConfig: NotificationConfig
  onRefresh: () => void
  calculateWeightedProbability: (cityId: string) => number
}

export function Dashboard({
  cities,
  dataSources,
  weatherData,
  threshold,
  loading,
  notificationConfig,
  onRefresh,
  calculateWeightedProbability
}: DashboardProps) {
  const { showToast } = useToast()
  const [sendingAlerts, setSendingAlerts] = useState(false)
  const now = new Date()

  // 自动刷新
  useEffect(() => {
    onRefresh()
  }, [])

  // 统计信息
  const alertCities = cities.filter(city => {
    const prob = calculateWeightedProbability(city.id)
    return prob >= threshold
  })

  // 发送降雨预警通知
  const handleSendAlerts = async () => {
    if (!notificationConfig.wechatPushToken) {
      showToast('请先在「通知设置」中配置微信推送 Token', 'warning')
      return
    }

    if (!notificationConfig.enabled) {
      showToast('请先在「通知设置」中启用通知功能', 'warning')
      return
    }

    setSendingAlerts(true)

    try {
      let successCount = 0
      let failCount = 0

      for (const city of alertCities) {
        const prob = calculateWeightedProbability(city.id)
        const cityWeatherData = weatherData.get(city.id)

        if (cityWeatherData && cityWeatherData.length > 0) {
          // 获取主要数据源的天气信息
          const primaryWeather = cityWeatherData[0]?.weather || '未知'

          const result = await sendRainAlertNotification(
            notificationConfig.wechatPushToken,
            city.name,
            prob,
            threshold,
            primaryWeather
          )

          if (result.success) {
            successCount++
          } else {
            failCount++
          }

          // 添加延迟，避免发送过快
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (alertCities.length === 0) {
        showToast('当前没有触发降雨预警的城市', 'info')
      } else if (successCount === alertCities.length) {
        showToast(`✅ 成功发送 ${successCount} 条预警通知`, 'success')
      } else {
        showToast(`⚠️ 发送 ${successCount} 条成功，${failCount} 条失败`, 'warning')
      }
    } catch (error) {
      console.error('发送预警通知出错:', error)
      showToast('❌ 发送失败：网络错误', 'danger')
    } finally {
      setSendingAlerts(false)
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">天气预警仪表盘</h1>
          <p className="text-muted-foreground mt-1">
            {formatDate(now)} · 最后更新: {formatTime(now)}
          </p>
        </div>
        <div className="flex gap-3">
          {alertCities.length > 0 && (
            <button
              onClick={handleSendAlerts}
              disabled={sendingAlerts || loading}
              className="btn-secondary flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sendingAlerts ? '发送中...' : `发送预警通知 (${alertCities.length})`}
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-primary"
          >
            <RefreshCw className={loading ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
            刷新数据
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <CloudRain className="w-7 h-7 text-primary-light" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">监控城市</p>
            <p className="text-2xl font-bold text-foreground">{cities.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">降雨预警</p>
            <p className="text-2xl font-bold text-warning">{alertCities.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
            <Sun className="w-7 h-7 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">晴好城市</p>
            <p className="text-2xl font-bold text-success">
              {cities.length - alertCities.length}
            </p>
          </div>
        </div>
      </div>

      {/* 预警阈值提示 */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-muted/30 border border-border flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <span className="text-sm text-muted-foreground">
          当前预警阈值: <span className="text-foreground font-medium">{threshold}%</span>
          · 当综合降雨概率超过此值时触发预警
        </span>
      </div>

      {/* 城市天气卡片 */}
      {cities.length === 0 ? (
        <div className="card text-center py-12">
          <CloudRain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">暂无监控城市</h3>
          <p className="text-muted-foreground">
            请前往「城市管理」添加需要监控的城市
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cities.map((city) => (
            <WeatherCard
              key={city.id}
              city={city}
              weatherData={weatherData.get(city.id) || []}
              dataSources={dataSources}
              weightedProbability={calculateWeightedProbability(city.id)}
              threshold={threshold}
              loading={loading}
            />
          ))}
        </div>
      )}
    </div>
  )
}
