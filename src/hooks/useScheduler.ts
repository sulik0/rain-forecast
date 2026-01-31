import { useEffect, useRef, useState, useCallback } from 'react'
import type { City, NotificationConfig, WeatherData } from '@/types'
import {
  checkAndSendNotifications,
  checkAndSendForecastNotifications,
  getNextNotificationTime,
  formatTimeRemaining,
  getNotificationRecords,
  type NotificationRecord,
} from '@/lib/scheduler'

interface UseSchedulerOptions {
  userId?: string
  cities: City[]
  weatherDataMap: Map<string, WeatherData[]>
  config: NotificationConfig
  calculateWeightedProbability: (cityId: string) => number
  onNotificationSent?: (records: NotificationRecord[]) => void
}

export function useScheduler({
  userId,
  cities,
  weatherDataMap,
  config,
  calculateWeightedProbability,
  onNotificationSent,
}: UseSchedulerOptions) {
  const [nextNotificationTime, setNextNotificationTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null)
  const [notificationHistory, setNotificationHistory] = useState<NotificationRecord[]>([])
  const intervalRef = useRef<number | null>(null)

  // 更新下次通知时间
  const updateNextNotificationTime = useCallback(() => {
    const nextTime = getNextNotificationTime(config)
    setNextNotificationTime(nextTime)

    if (nextTime) {
      setTimeRemaining(formatTimeRemaining(nextTime))
    } else {
      setTimeRemaining('')
    }
  }, [config])

  // 加载通知历史
  const loadNotificationHistory = useCallback(() => {
    const records = getNotificationRecords(userId)
    setNotificationHistory(records)
  }, [userId])

  // 执行通知检查
  const checkNotifications = useCallback(async () => {
    if (!config.wechatPushToken) return

    try {
      const alertRecords = config.enabled
        ? await checkAndSendNotifications(
            cities,
            weatherDataMap,
            config,
            calculateWeightedProbability,
            userId
          )
        : []

      const forecastRecords = config.forecast?.enabled
        ? await checkAndSendForecastNotifications(cities, config, userId)
        : []

      const records = [...alertRecords, ...forecastRecords]

      if (records.length > 0) {
        console.log(`✅ 发送了 ${records.length} 条通知`)
      }

      setLastCheckTime(new Date())

      if (records.length > 0 && onNotificationSent) {
        onNotificationSent(records)
      }

      // 刷新历史记录
      loadNotificationHistory()

      // 更新下次通知时间
      updateNextNotificationTime()
    } catch (error) {
      console.error('通知检查失败:', error)
    }
  }, [
    cities,
    weatherDataMap,
    config,
    calculateWeightedProbability,
    userId,
    onNotificationSent,
    updateNextNotificationTime,
    loadNotificationHistory,
  ])

  // 启动定时器
  useEffect(() => {
    const schedulerEnabled = config.enabled || config.forecast?.enabled
    if (!schedulerEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // 立即检查一次
    checkNotifications()

    // 加载历史记录
    loadNotificationHistory()

    // 每分钟检查一次
    intervalRef.current = window.setInterval(() => {
      checkNotifications()
    }, 60 * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [config.enabled, config.forecast?.enabled, checkNotifications, loadNotificationHistory])

  // 每秒更新剩余时间显示
  useEffect(() => {
    if (!nextNotificationTime) return

    const timer = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(nextNotificationTime))
    }, 1000)

    return () => clearInterval(timer)
  }, [nextNotificationTime])

  // 配置变化时更新下次通知时间
  useEffect(() => {
    updateNextNotificationTime()
  }, [config, updateNextNotificationTime])

  return {
    nextNotificationTime,
    timeRemaining,
    lastCheckTime,
    notificationHistory,
    checkNow: checkNotifications,
  }
}
