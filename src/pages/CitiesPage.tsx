import { useState } from 'react'
import type { City } from '@/types'
import { PRESET_CITIES } from '@/types'
import { cn, generateId } from '@/lib/utils'
import { MapPin, Plus, Trash2, Search, Check, Loader2, Globe } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { lookupCity, type CityLookupResult } from '@/lib/weatherApi'

interface CitiesPageProps {
  cities: City[]
  onAddCity: (city: City) => void
  onRemoveCity: (cityId: string) => void
}

export function CitiesPage({ cities, onAddCity, onRemoveCity }: CitiesPageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [customSearchTerm, setCustomSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<CityLookupResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showCustomSearch, setShowCustomSearch] = useState(false)
  const { showToast } = useToast()

  const filteredCities = PRESET_CITIES.filter(city =>
    city.name.includes(searchTerm) || city.province.includes(searchTerm)
  )

  const isAdded = (cityId: string) => cities.some(c => c.id === cityId)

  const handleAdd = (city: City) => {
    onAddCity(city)
    showToast(`已添加 ${city.name}`, 'success')
  }

  const handleRemove = (city: City) => {
    if (cities.length <= 1) {
      showToast('至少保留一个监控城市', 'warning')
      return
    }
    onRemoveCity(city.id)
    showToast(`已移除 ${city.name}`, 'info')
  }

  // 搜索自定义城市
  const handleCustomSearch = async () => {
    if (!customSearchTerm.trim()) {
      showToast('请输入城市名称', 'warning')
      return
    }

    setSearching(true)
    try {
      const results = await lookupCity(customSearchTerm)

      if (!results || results.length === 0) {
        showToast('未找到该城市，请检查城市名称', 'warning')
        setSearchResults([])
        return
      }

      // 过滤掉中国的下级区县，只显示地级市以上
      const filtered = results.filter(r => {
        const path = r.location.path
        const parts = path.split(',')
        // 只保留2-3级的行政区划（省、市）
        return parts.length <= 3
      })

      setSearchResults(filtered)
      showToast(`找到 ${filtered.length} 个结果`, 'success')
    } catch (error) {
      console.error('搜索城市失败:', error)
      showToast('搜索失败，请稍后重试', 'danger')
    } finally {
      setSearching(false)
    }
  }

  // 添加搜索结果中的城市
  const handleAddSearchResult = (result: CityLookupResult) => {
    const pathParts = result.location.path.split(',')

    const city: City = {
      id: generateId(),
      name: result.location.name,
      code: result.location.id,
      province: pathParts.length >= 2 ? pathParts[pathParts.length - 2] : '未知'
    }

    // 检查是否已存在
    if (cities.some(c => c.code === city.code)) {
      showToast(`${city.name} 已在监控列表中`, 'info')
      return
    }

    onAddCity(city)
    showToast(`已添加 ${city.name}`, 'success')
    setSearchResults([])
    setCustomSearchTerm('')
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">城市管理</h1>
        <p className="text-muted-foreground mt-1">
          添加或移除需要监控降雨的城市
        </p>
      </div>

      {/* 当前监控城市 */}
      <div className="card mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary-light" />
          <h2 className="text-lg font-semibold text-foreground">当前监控城市</h2>
          <span className="badge-primary ml-2">{cities.length} 个</span>
        </div>

        {cities.length === 0 ? (
          <p className="text-muted-foreground py-4">暂无监控城市</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {cities.map((city) => (
              <div
                key={city.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border"
              >
                <span className="text-foreground">{city.name}</span>
                <span className="text-xs text-muted-foreground">{city.province}</span>
                <button
                  onClick={() => handleRemove(city)}
                  className="ml-2 p-1 rounded-lg hover:bg-danger/20 text-muted-foreground hover:text-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 自定义城市搜索 */}
      <div className="card mb-8 border-l-4 border-l-primary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-light" />
            <h2 className="text-lg font-semibold text-foreground">自定义城市</h2>
          </div>
          <button
            onClick={() => setShowCustomSearch(!showCustomSearch)}
            className="text-sm text-primary-light hover:underline"
          >
            {showCustomSearch ? '收起' : '展开'}
          </button>
        </div>

        {showCustomSearch && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              搜索任意城市（支持中文名称、拼音），自动获取城市代码并添加到监控列表
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                value={customSearchTerm}
                onChange={(e) => setCustomSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomSearch()}
                placeholder="输入城市名称，如：苏州、Suzhou..."
                className="input flex-1"
              />
              <button
                onClick={handleCustomSearch}
                disabled={searching}
                className="btn-primary flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    搜索中...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    搜索
                  </>
                )}
              </button>
            </div>

            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">搜索结果：</p>
                {searchResults.map((result) => {
                  const pathParts = result.location.path.split(',')
                  const isAdded = cities.some(c => c.code === result.location.id)

                  return (
                    <div
                      key={result.location.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border transition-all',
                        isAdded
                          ? 'bg-success/10 border-success/30'
                          : 'bg-muted/30 border-border hover:bg-muted/50'
                      )}
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {result.location.name}
                          {isAdded && <span className="ml-2 text-xs text-success">已添加</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{result.location.path}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          代码: {result.location.id}
                        </p>
                      </div>
                      {!isAdded && (
                        <button
                          onClick={() => handleAddSearchResult(result)}
                          className="btn-secondary text-sm p-2"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 添加城市 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-foreground mb-4">添加城市</h2>

        {/* 搜索框 */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索城市名称或省份..."
            className="input pl-12"
          />
        </div>

        {/* 城市列表 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredCities.map((city) => {
            const added = isAdded(city.id)
            return (
              <button
                key={city.id}
                onClick={() => added ? handleRemove(city) : handleAdd(city)}
                className={cn(
                  'flex items-center justify-between p-4 rounded-xl border transition-all duration-200',
                  added
                    ? 'bg-primary/10 border-primary/30 text-primary-light'
                    : 'bg-muted/30 border-border text-foreground hover:bg-muted/50'
                )}
              >
                <div className="text-left">
                  <p className="font-medium">{city.name}</p>
                  <p className="text-xs text-muted-foreground">{city.province}</p>
                </div>
                {added ? (
                  <Check className="w-5 h-5 text-primary-light" />
                ) : (
                  <Plus className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            )
          })}
        </div>

        {filteredCities.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            没有找到匹配的城市
          </p>
        )}
      </div>
    </div>
  )
}
