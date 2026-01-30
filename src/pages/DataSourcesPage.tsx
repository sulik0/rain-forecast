import type { DataSource } from '@/types'
import { cn } from '@/lib/utils'
import { Database, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface DataSourcesPageProps {
  dataSources: DataSource[]
  onUpdateSource: (id: string, updates: Partial<DataSource>) => void
  onNormalizeWeights: () => void
}

export function DataSourcesPage({
  dataSources,
  onUpdateSource,
  onNormalizeWeights
}: DataSourcesPageProps) {
  const { showToast } = useToast()
  
  const totalWeight = dataSources
    .filter(s => s.enabled)
    .reduce((sum, s) => sum + s.weight, 0)

  const handleWeightChange = (id: string, weight: number) => {
    onUpdateSource(id, { weight: weight / 100 })
  }

  const handleToggle = (source: DataSource) => {
    const enabledCount = dataSources.filter(s => s.enabled).length
    if (source.enabled && enabledCount <= 1) {
      showToast('至少保留一个数据源', 'warning')
      return
    }
    onUpdateSource(source.id, { enabled: !source.enabled })
    showToast(
      `${source.name} 已${source.enabled ? '禁用' : '启用'}`,
      source.enabled ? 'info' : 'success'
    )
  }

  const handleNormalize = () => {
    onNormalizeWeights()
    showToast('权重已归一化', 'success')
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">数据源配置</h1>
        <p className="text-muted-foreground mt-1">
          配置天气数据来源及其权重
        </p>
      </div>

      {/* 权重说明 */}
      <div className="card mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary-light mt-0.5" />
          <div>
            <h3 className="font-medium text-foreground mb-1">权重说明</h3>
            <p className="text-sm text-muted-foreground">
              综合降雨概率 = Σ(各数据源概率 × 权重) / 总权重。
              权重越高，该数据源对最终结果的影响越大。
              建议根据数据源的准确性和可靠性设置权重。
            </p>
          </div>
        </div>
      </div>

      {/* 权重状态 */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">当前总权重:</span>
            <span className={cn(
              'text-lg font-bold',
              Math.abs(totalWeight - 1) < 0.01 ? 'text-success' : 'text-warning'
            )}>
              {Math.round(totalWeight * 100)}%
            </span>
            {Math.abs(totalWeight - 1) >= 0.01 && (
              <span className="text-xs text-warning">(建议归一化为100%)</span>
            )}
          </div>
          <button
            onClick={handleNormalize}
            className="btn-secondary text-sm"
          >
            归一化权重
          </button>
        </div>
      </div>

      {/* 数据源列表 */}
      <div className="space-y-4">
        {dataSources.map((source) => (
          <div key={source.id} className="source-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  source.enabled ? 'bg-primary/20' : 'bg-muted/50'
                )}>
                  <Database className={cn(
                    'w-5 h-5',
                    source.enabled ? 'text-primary-light' : 'text-muted-foreground'
                  )} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{source.name}</h3>
                  <p className="text-sm text-muted-foreground">{source.description}</p>
                </div>
              </div>

              {/* 启用开关 */}
              <button
                onClick={() => handleToggle(source)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  source.enabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    source.enabled ? 'left-7' : 'left-1'
                  )}
                />
              </button>
            </div>

            {/* 权重滑块 */}
            <div className={cn(
              'transition-opacity',
              !source.enabled && 'opacity-50 pointer-events-none'
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">权重设置</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.round(source.weight * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(source.weight * 100)}
                onChange={(e) => handleWeightChange(source.id, parseInt(e.target.value))}
                className="slider"
              />
            </div>
          </div>
        ))}
      </div>

      {/* API 配置提示 */}
      <div className="card mt-8 border-l-4 border-l-warning">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-medium text-foreground mb-1">API 配置</h3>
            <p className="text-sm text-muted-foreground">
              当前使用模拟数据演示。实际部署时需要配置以下API密钥:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• 中国气象局: 需申请官方数据接口权限</li>
              <li>• 和风天气: 注册获取 API Key (有免费额度)</li>
              <li>• AccuWeather / OpenWeather: 需申请对应的开发者密钥</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
