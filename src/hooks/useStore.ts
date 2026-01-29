import { useState, useEffect, useCallback } from 'react'
import type { 
  City, 
  DataSource, 
  NotificationConfig, 
  NotificationSchedule,
  WeatherData,
  RainAlert 
} from '@/types'
import { 
  DEFAULT_DATA_SOURCES, 
  DEFAULT_SCHEDULES, 
  PRESET_CITIES 
} from '@/types'
import { generateId } from '@/lib/utils'

const STORAGE_KEYS = {
  cities: 'rain-alert-cities',
  dataSources: 'rain-alert-sources',
  notification: 'rain-alert-notification',
  alerts: 'rain-alert-history',
}

// 城市管理 Hook
export function useCities() {
  const [cities, setCities] = useState<City[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.cities)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return [PRESET_CITIES[0]] // 默认北京
      }
    }
    return [PRESET_CITIES[0]]
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.cities, JSON.stringify(cities))
  }, [cities])

  const addCity = useCallback((city: City) => {
    setCities(prev => {
      if (prev.find(c => c.id === city.id)) return prev
      return [...prev, city]
    })
  }, [])

  const removeCity = useCallback((cityId: string) => {
    setCities(prev => prev.filter(c => c.id !== cityId))
  }, [])

  return { cities, addCity, removeCity, setCities }
}

// 数据源管理 Hook
export function useDataSources() {
  const [dataSources, setDataSources] = useState<DataSource[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.dataSources)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return DEFAULT_DATA_SOURCES
      }
    }
    return DEFAULT_DATA_SOURCES
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.dataSources, JSON.stringify(dataSources))
  }, [dataSources])

  const updateSource = useCallback((id: string, updates: Partial<DataSource>) => {
    setDataSources(prev => 
      prev.map(s => s.id === id ? { ...s, ...updates } : s)
    )
  }, [])

  const normalizeWeights = useCallback(() => {
    setDataSources(prev => {
      const enabled = prev.filter(s => s.enabled)
      const total = enabled.reduce((sum, s) => sum + s.weight, 0)
      if (total === 0) return prev
      return prev.map(s => ({
        ...s,
        weight: s.enabled ? s.weight / total : s.weight
      }))
    })
  }, [])

  return { dataSources, updateSource, normalizeWeights, setDataSources }
}

// 通知配置 Hook
export function useNotification() {
  const [config, setConfig] = useState<NotificationConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.notification)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return {
          enabled: false,
          threshold: 50,
          schedules: DEFAULT_SCHEDULES,
        }
      }
    }
    return {
      enabled: false,
      threshold: 50,
      schedules: DEFAULT_SCHEDULES,
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.notification, JSON.stringify(config))
  }, [config])

  const updateConfig = useCallback((updates: Partial<NotificationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const updateSchedule = useCallback((id: string, updates: Partial<NotificationSchedule>) => {
    setConfig(prev => ({
      ...prev,
      schedules: prev.schedules.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    }))
  }, [])

  return { config, updateConfig, updateSchedule }
}

// 预警历史 Hook
export function useAlertHistory() {
  const [alerts, setAlerts] = useState<RainAlert[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.alerts)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return parsed.map((a: RainAlert) => ({
          ...a,
          date: new Date(a.date),
          createdAt: new Date(a.createdAt),
        }))
      } catch {
        return []
      }
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(alerts))
  }, [alerts])

  const addAlert = useCallback((alert: Omit<RainAlert, 'id' | 'createdAt'>) => {
    const newAlert: RainAlert = {
      ...alert,
      id: generateId(),
      createdAt: new Date(),
    }
    setAlerts(prev => [newAlert, ...prev].slice(0, 100)) // 保留最近100条
  }, [])

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  return { alerts, addAlert, clearAlerts }
}

// 模拟天气数据获取
export function useWeatherData(cities: City[], dataSources: DataSource[]) {
  const [weatherData, setWeatherData] = useState<Map<string, WeatherData[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeatherData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newData = new Map<string, WeatherData[]>()
      const enabledSources = dataSources.filter(s => s.enabled)
      
      for (const city of cities) {
        const cityData: WeatherData[] = []
        
        for (const source of enabledSources) {
          // 模拟数据 - 实际项目中这里会调用真实API
          const mockProbability = Math.floor(Math.random() * 100)
          cityData.push({
            source: source.id,
            city: city.name,
            date: new Date(),
            rainProbability: mockProbability,
            temperature: {
              min: Math.floor(Math.random() * 10) + 5,
              max: Math.floor(Math.random() * 15) + 15,
            },
            weather: mockProbability > 50 ? '有雨' : '晴转多云',
            updatedAt: new Date(),
          })
        }
        
        newData.set(city.id, cityData)
      }
      
      setWeatherData(newData)
    } catch (err) {
      setError('获取天气数据失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [cities, dataSources])

  // 计算加权概率
  const calculateWeightedProbability = useCallback((cityId: string): number => {
    const cityData = weatherData.get(cityId)
    if (!cityData || cityData.length === 0) return 0
    
    const enabledSources = dataSources.filter(s => s.enabled)
    const totalWeight = enabledSources.reduce((sum, s) => sum + s.weight, 0)
    
    if (totalWeight === 0) return 0
    
    let weightedSum = 0
    for (const data of cityData) {
      const source = enabledSources.find(s => s.id === data.source)
      if (source) {
        weightedSum += data.rainProbability * (source.weight / totalWeight)
      }
    }
    
    return Math.round(weightedSum)
  }, [weatherData, dataSources])

  return { 
    weatherData, 
    loading, 
    error, 
    fetchWeatherData, 
    calculateWeightedProbability 
  }
}
