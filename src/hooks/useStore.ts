import { useState, useEffect, useCallback, useRef } from 'react'
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
  DEFAULT_FORECAST_SCHEDULE,
  PRESET_CITIES 
} from '@/types'
import { generateId } from '@/lib/utils'
import { fetchCityWeather } from '@/lib/weatherApi'

const LEGACY_KEYS = {
  cities: 'rain-alert-cities',
  dataSources: 'rain-alert-sources',
  notification: 'rain-alert-notification',
  alerts: 'rain-alert-history',
}

const USER_STORAGE_PREFIX = 'rain-alert-user'
const LEGACY_OWNER_KEY = 'rain-alert-legacy-owner'

type StorageKey = keyof typeof LEGACY_KEYS

function getUserStorageKey(userId: string, key: StorageKey) {
  return `${USER_STORAGE_PREFIX}:${userId}:${key}`
}

function readUserStorage(userId: string, key: StorageKey) {
  const userKey = getUserStorageKey(userId, key)
  const stored = localStorage.getItem(userKey)
  if (stored) {
    return { raw: stored, userKey }
  }

  const legacy = localStorage.getItem(LEGACY_KEYS[key])
  if (!legacy) {
    return { raw: null, userKey }
  }

  const legacyOwner = localStorage.getItem(LEGACY_OWNER_KEY)
  if (legacyOwner && legacyOwner !== userId) {
    return { raw: null, userKey }
  }

  if (!legacyOwner) {
    localStorage.setItem(LEGACY_OWNER_KEY, userId)
  }

  localStorage.setItem(userKey, legacy)
  return { raw: legacy, userKey }
}

// 城市管理 Hook
export function useCities(userId: string) {
  const [cities, setCities] = useState<City[]>(() => {
    const { raw } = readUserStorage(userId, 'cities')
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch {
        return [PRESET_CITIES[0]]
      }
    }
    return [PRESET_CITIES[0]]
  })
  const loadedUserIdRef = useRef(userId)

  useEffect(() => {
    const { raw } = readUserStorage(userId, 'cities')
    if (raw) {
      try {
        setCities(JSON.parse(raw))
      } catch {
        setCities([PRESET_CITIES[0]])
      }
    } else {
      setCities([PRESET_CITIES[0]])
    }
    loadedUserIdRef.current = userId
  }, [userId])

  useEffect(() => {
    if (loadedUserIdRef.current !== userId) return
    localStorage.setItem(getUserStorageKey(userId, 'cities'), JSON.stringify(cities))
  }, [cities, userId])

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
export function useDataSources(userId: string) {
  const [dataSources, setDataSources] = useState<DataSource[]>(() => {
    const { raw } = readUserStorage(userId, 'dataSources')
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch {
        return DEFAULT_DATA_SOURCES
      }
    }
    return DEFAULT_DATA_SOURCES
  })
  const loadedUserIdRef = useRef(userId)

  useEffect(() => {
    const { raw } = readUserStorage(userId, 'dataSources')
    if (raw) {
      try {
        setDataSources(JSON.parse(raw))
      } catch {
        setDataSources(DEFAULT_DATA_SOURCES)
      }
    } else {
      setDataSources(DEFAULT_DATA_SOURCES)
    }
    loadedUserIdRef.current = userId
  }, [userId])

  useEffect(() => {
    if (loadedUserIdRef.current !== userId) return
    localStorage.setItem(getUserStorageKey(userId, 'dataSources'), JSON.stringify(dataSources))
  }, [dataSources, userId])

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
export function useNotification(userId: string) {
  const [config, setConfig] = useState<NotificationConfig>(() => {
    const { raw } = readUserStorage(userId, 'notification')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        return {
          enabled: parsed.enabled ?? false,
          wechatPushToken: parsed.wechatPushToken,
          threshold: parsed.threshold ?? 50,
          schedules: parsed.schedules ?? DEFAULT_SCHEDULES,
          forecast: parsed.forecast ?? DEFAULT_FORECAST_SCHEDULE,
        }
      } catch {
        return {
          enabled: false,
          threshold: 50,
          schedules: DEFAULT_SCHEDULES,
          forecast: DEFAULT_FORECAST_SCHEDULE,
        }
      }
    }
    return {
      enabled: false,
      threshold: 50,
      schedules: DEFAULT_SCHEDULES,
      forecast: DEFAULT_FORECAST_SCHEDULE,
    }
  })
  const loadedUserIdRef = useRef(userId)

  useEffect(() => {
    const { raw } = readUserStorage(userId, 'notification')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setConfig({
          enabled: parsed.enabled ?? false,
          wechatPushToken: parsed.wechatPushToken,
          threshold: parsed.threshold ?? 50,
          schedules: parsed.schedules ?? DEFAULT_SCHEDULES,
          forecast: parsed.forecast ?? DEFAULT_FORECAST_SCHEDULE,
        })
      } catch {
        setConfig({
          enabled: false,
          threshold: 50,
          schedules: DEFAULT_SCHEDULES,
          forecast: DEFAULT_FORECAST_SCHEDULE,
        })
      }
    } else {
      setConfig({
        enabled: false,
        threshold: 50,
        schedules: DEFAULT_SCHEDULES,
        forecast: DEFAULT_FORECAST_SCHEDULE,
      })
    }
    loadedUserIdRef.current = userId
  }, [userId])

  useEffect(() => {
    if (loadedUserIdRef.current !== userId) return
    localStorage.setItem(getUserStorageKey(userId, 'notification'), JSON.stringify(config))
  }, [config, userId])

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
export function useAlertHistory(userId: string) {
  const [alerts, setAlerts] = useState<RainAlert[]>(() => {
    const { raw } = readUserStorage(userId, 'alerts')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
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
  const loadedUserIdRef = useRef(userId)

  useEffect(() => {
    const { raw } = readUserStorage(userId, 'alerts')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setAlerts(parsed.map((a: RainAlert) => ({
          ...a,
          date: new Date(a.date),
          createdAt: new Date(a.createdAt),
        })))
      } catch {
        setAlerts([])
      }
    } else {
      setAlerts([])
    }
    loadedUserIdRef.current = userId
  }, [userId])

  useEffect(() => {
    if (loadedUserIdRef.current !== userId) return
    localStorage.setItem(getUserStorageKey(userId, 'alerts'), JSON.stringify(alerts))
  }, [alerts, userId])

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

// 天气数据获取 Hook
export function useWeatherData(cities: City[], dataSources: DataSource[]) {
  const [weatherData, setWeatherData] = useState<Map<string, WeatherData[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeatherData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const newData = new Map<string, WeatherData[]>()
      const enabledSources = dataSources.filter(s => s.enabled)

      for (const city of cities) {
        const cityData: WeatherData[] = []

        for (const source of enabledSources) {
          if (source.id === 'qweather') {
            // 使用真实的和风天气 API
            try {
              const realData = await fetchCityWeather(city.name, city.code)
              if (realData) {
                cityData.push(realData)
              } else {
                console.warn(`获取 ${city.name} 的和风天气数据失败`)
                // 不添加数据，UI 会显示暂无数据
              }
            } catch (err) {
              console.error(`获取 ${city.name} 天气数据出错:`, err)
              // 不添加数据，UI 会显示暂无数据
            }
          }
          // 其他数据源（cma, accuweather, owm）暂未接入真实 API，不返回数据
          // 未来可在此处添加对应的 API 调用逻辑
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
