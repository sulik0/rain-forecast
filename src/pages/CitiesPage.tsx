import { useState } from 'react'
import type { City } from '@/types'
import { PRESET_CITIES } from '@/types'
import { cn } from '@/lib/utils'
import { MapPin, Plus, Trash2, Search, Check } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface CitiesPageProps {
  cities: City[]
  onAddCity: (city: City) => void
  onRemoveCity: (cityId: string) => void
}

export function CitiesPage({ cities, onAddCity, onRemoveCity }: CitiesPageProps) {
  const [searchTerm, setSearchTerm] = useState('')
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
