import type { City, WeatherData, NotificationConfig, NotificationSchedule } from '@/types'
import { sendRainAlertNotification } from './notification'

const STORAGE_KEYS = {
  lastNotificationTime: 'rain-scheduler-last-time',
  notificationHistory: 'rain-scheduler-history',
}

export interface NotificationRecord {
  id: string
  scheduleId: string
  cityId: string
  timestamp: number
  sent: boolean
  message?: string
}

/**
 * 检查当前时间是否匹配通知时间表
 */
export function shouldTriggerNotification(schedule: NotificationSchedule): boolean {
  if (!schedule.enabled) return false

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // 检查时间是否匹配（允许1分钟的误差）
  const scheduleTime = schedule.time
  const [scheduleHour, scheduleMinute] = scheduleTime.split(':').map(Number)
  const [currentHour, currentMinute] = currentTime.split(':').map(Number)

  // 计算时间差（分钟）
  const scheduleTotalMinutes = scheduleHour * 60 + scheduleMinute
  const currentTotalMinutes = currentHour * 60 + currentMinute
  const timeDiff = Math.abs(currentTotalMinutes - scheduleTotalMinutes)

  // 允许2分钟的误差范围
  if (timeDiff > 2) return false

  // 检查是否已经发送过通知
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${schedule.id}`
  const lastSent = localStorage.getItem(`rain-scheduler-${todayKey}`)

  if (lastSent) {
    const lastSentTime = parseInt(lastSent)
    const hoursSinceLastSent = (now.getTime() - lastSentTime) / (1000 * 60 * 60)
    // 如果12小时内已经发送过，跳过
    if (hoursSinceLastSent < 12) return false
  }

  return true
}

/**
 * 标记通知已发送
 */
export function markNotificationSent(scheduleId: string): void {
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${scheduleId}`
  localStorage.setItem(`rain-scheduler-${todayKey}`, String(now.getTime()))
}

/**
 * 获取降雨概率数据
 */
export function getRainProbability(
  city: City,
  weatherDataMap: Map<string, WeatherData[]>,
  targetDate: 'today' | 'tomorrow'
): number {
  const cityData = weatherDataMap.get(city.id)
  if (!cityData || cityData.length === 0) return 0

  // 获取今天或明天的数据
  const now = new Date()
  const targetDateObj = new Date(now)

  if (targetDate === 'tomorrow') {
    targetDateObj.setDate(targetDateObj.getDate() + 1)
  }

  const targetDateStr = targetDateObj.toISOString().split('T')[0]

  // 查找匹配日期的数据
  const matchedData = cityData.find(data => {
    const dataDateStr = new Date(data.date).toISOString().split('T')[0]
    return dataDateStr === targetDateStr
  })

  return matchedData?.rainProbability || 0
}

/**
 * 执行通知检查和发送
 */
export async function checkAndSendNotifications(
  cities: City[],
  weatherDataMap: Map<string, WeatherData[]>,
  config: NotificationConfig,
  calculateWeightedProbability: (cityId: string) => number
): Promise<NotificationRecord[]> {
  if (!config.enabled || !config.wechatPushToken) {
    return []
  }

  const records: NotificationRecord[] = []
  const now = new Date()

  for (const schedule of config.schedules) {
    if (!shouldTriggerNotification(schedule)) continue

    let sentCount = 0

    for (const city of cities) {
      const probability = calculateWeightedProbability(city.id)

      // 只在超过阈值时发送通知
      if (probability >= config.threshold) {
        const weatherData = weatherDataMap.get(city.id)?.[0]
        const result = await sendRainAlertNotification(
          config.wechatPushToken,
          city.name,
          probability,
          config.threshold,
          weatherData?.weather || '未知'
        )

        records.push({
          id: `${schedule.id}-${city.id}-${now.getTime()}`,
          scheduleId: schedule.id,
          cityId: city.id,
          timestamp: now.getTime(),
          sent: result.success,
          message: result.message,
        })

        if (result.success) {
          sentCount++
        }
      }
    }

    // 标记该时间表已处理
    if (sentCount > 0) {
      markNotificationSent(schedule.id)
    }
  }

  // 保存记录
  if (records.length > 0) {
    saveNotificationRecords(records)
  }

  return records
}

/**
 * 保存通知记录
 */
function saveNotificationRecords(records: NotificationRecord[]): void {
  try {
    const existing = getNotificationRecords()
    const updated = [...records, ...existing].slice(0, 100) // 保留最近100条
    localStorage.setItem(STORAGE_KEYS.notificationHistory, JSON.stringify(updated))
  } catch (error) {
    console.error('保存通知记录失败:', error)
  }
}

/**
 * 获取通知记录
 */
export function getNotificationRecords(): NotificationRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.notificationHistory)
    if (!stored) return []

    return JSON.parse(stored)
  } catch (error) {
    console.error('读取通知记录失败:', error)
    return []
  }
}

/**
 * 清空通知记录
 */
export function clearNotificationRecords(): void {
  localStorage.removeItem(STORAGE_KEYS.notificationHistory)
}

/**
 * 获取下次通知时间
 */
export function getNextNotificationTime(config: NotificationConfig): Date | null {
  if (!config.enabled || config.schedules.length === 0) return null

  const now = new Date()
  const enabledSchedules = config.schedules.filter(s => s.enabled)

  if (enabledSchedules.length === 0) return null

  // 找到下一个最近的定时任务
  let nextTime: Date | null = null
  let minDiff = Infinity

  for (const schedule of enabledSchedules) {
    const [hour, minute] = schedule.time.split(':').map(Number)
    const scheduleTime = new Date(now)
    scheduleTime.setHours(hour, minute, 0, 0)

    // 如果今天的时间已过，设置为明天
    if (scheduleTime <= now) {
      scheduleTime.setDate(scheduleTime.getDate() + 1)
    }

    const diff = scheduleTime.getTime() - now.getTime()
    if (diff < minDiff && diff > 0) {
      minDiff = diff
      nextTime = scheduleTime
    }
  }

  return nextTime
}

/**
 * 格式化剩余时间
 */
export function formatTimeRemaining(targetTime: Date): string {
  const now = new Date()
  const diff = targetTime.getTime() - now.getTime()

  if (diff <= 0) return '即将执行'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}天${hours % 24}小时后`
  }

  if (hours > 0) {
    return `${hours}小时${minutes}分钟后`
  }

  return `${minutes}分钟后`
}
