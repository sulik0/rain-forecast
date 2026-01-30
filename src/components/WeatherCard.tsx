import { cn, getRainLevelClass } from '@/lib/utils'
import type { City, WeatherData, DataSource } from '@/types'
import { CloudRain, Thermometer, RefreshCw, AlertTriangle } from 'lucide-react'

interface WeatherCardProps {
  city: City
  weatherData: WeatherData[]
  dataSources: DataSource[]
  weightedProbability: number
  threshold: number
  onRefresh?: () => void
  loading?: boolean
}

export function WeatherCard({
  city,
  weatherData,
  dataSources,
  weightedProbability,
  threshold,
  onRefresh,
  loading
}: WeatherCardProps) {
  const isAlert = weightedProbability >= threshold
  const probabilityClass = cn(
    'probability-display',
    weightedProbability >= 70 && 'danger',
    weightedProbability >= 50 && weightedProbability < 70 && 'warning'
  )

  return (
    <div className={cn(
      'card relative overflow-hidden',
      isAlert && 'ring-2 ring-warning/50'
    )}>
      {/* 警告标识 */}
      {isAlert && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 badge-warning">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>降雨预警</span>
        </div>
      )}

      {/* 城市信息 */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground">{city.name}</h3>
        <p className="text-sm text-muted-foreground">{city.province}</p>
      </div>

      {/* 综合概率 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">综合降雨概率</p>
          <div className={probabilityClass}>
            {weatherData.length > 0 ? `${weightedProbability}%` : '暂无数据'}
          </div>
        </div>
        <div className="relative">
          <CloudRain className={cn(
            'w-16 h-16',
            getRainLevelClass(weightedProbability)
          )} />
          {weatherData.length > 0 && weightedProbability > 50 && (
            <div className="rain-animation">
              <div className="rain-drop" style={{ left: '20%', animationDelay: '0s' }} />
              <div className="rain-drop" style={{ left: '50%', animationDelay: '0.3s' }} />
              <div className="rain-drop" style={{ left: '80%', animationDelay: '0.6s' }} />
            </div>
          )}
        </div>
      </div>

      {/* 数据源详情 */}
      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">数据源详情</p>
        {dataSources.filter(s => s.enabled).map((source) => {
          const data = weatherData.find(w => w.source === source.id)
          return (
            <div key={source.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm text-foreground">{source.name}</span>
                <span className="text-xs text-muted-foreground">
                  (权重 {Math.round(source.weight * 100)}%)
                </span>
              </div>
              <span className={cn(
                'text-sm font-medium',
                data ? getRainLevelClass(data.rainProbability) : 'text-muted-foreground'
              )}>
                {data ? `${data.rainProbability}%` : '暂无数据，待添加'}
              </span>
            </div>
          )
        })}
      </div>

      {/* 温度信息 */}
      {weatherData[0]?.temperature && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <Thermometer className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {weatherData[0].temperature.min}°C ~ {weatherData[0].temperature.max}°C
          </span>
        </div>
      )}

      {/* 刷新按钮 */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="absolute bottom-4 right-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className={cn(
            'w-4 h-4 text-muted-foreground',
            loading && 'animate-spin'
          )} />
        </button>
      )}
    </div>
  )
}
