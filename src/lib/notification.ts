import type { QWeatherDaily } from '@/lib/weatherApi'

// Server酱 API 配置
const SERVERCHAN_API_URL = 'https://sctapi.ftqq.com'

export interface NotificationPayload {
  token: string
  title: string
  content: string
}

export interface NotificationResult {
  success: boolean
  message: string
  data?: any
}

/**
 * 使用 Server酱 发送微信通知
 * @param payload 通知内容
 * @returns 发送结果
 */
export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const { token, title, content } = payload

  if (!token) {
    return {
      success: false,
      message: 'Token 不能为空'
    }
  }

  try {
    const response = await fetch(`${SERVERCHAN_API_URL}/${token}.send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        desp: content
      })
    })

    const data = await response.json()

    if (data.code === 0) {
      return {
        success: true,
        message: '通知发送成功',
        data
      }
    } else {
      return {
        success: false,
        message: data.message || '通知发送失败',
        data
      }
    }
  } catch (error) {
    console.error('发送通知出错:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误'
    }
  }
}

/**
 * 发送测试通知
 */
export async function sendTestNotification(token: string): Promise<NotificationResult> {
  return sendNotification({
    token,
    title: '【降雨预警系统】测试通知',
    content: `这是一条测试消息

如果您收到此消息，说明通知配置成功！

系统已准备就绪，可以在降雨概率超过阈值时发送预警通知。

---
时间：${new Date().toLocaleString('zh-CN')}
`
  })
}

/**
 * 发送降雨预警通知
 */
export async function sendRainAlertNotification(
  token: string,
  city: string,
  probability: number,
  threshold: number,
  weather: string
): Promise<NotificationResult> {
  const alertLevel = probability >= 80 ? '🔴 高' : probability >= 60 ? '🟠 中' : '🟡 低'

  return sendNotification({
    token,
    title: `【降雨预警】${city} - ${alertLevel}预警`,
    content: `预警详情

📍 城市：${city}
🌧️ 降雨概率：${probability}%
⚠️ 预警阈值：${threshold}%
🌤️ 天气状况：${weather}
${alertLevel} 风险等级

建议：${getSuggestion(probability)}

---
时间：${new Date().toLocaleString('zh-CN')}

请及时做好防雨准备！`
  })
}

/**
 * 发送每日天气预报通知
 */
export async function sendDailyForecastNotification(
  token: string,
  city: string,
  daily: QWeatherDaily[],
  updateTime: string,
  days: 1 | 2 | 3
): Promise<NotificationResult> {
  const slices = daily.slice(0, days)
  const lines = slices.map((item, index) => {
    const label = index === 0 ? '今天' : index === 1 ? '明天' : '后天'
    const rainProb = parseInt(item.pop) || 0
    return `${label}：${item.textDay}，${item.tempMin}°~${item.tempMax}°，降雨概率 ${rainProb}%`
  })

  return sendNotification({
    token,
    title: `【每日天气预报】${city}`,
    content: `天气预报

📍 城市：${city}
${lines.join('\n')}

---
数据更新时间：${updateTime}
推送时间：${new Date().toLocaleString('zh-CN')}
`
  })
}

/**
 * 根据降雨概率给出建议
 */
function getSuggestion(probability: number): string {
  if (probability >= 80) {
    return '🔴 降雨可能性极高，请务必携带雨具，避免外出'
  } else if (probability >= 60) {
    return '🟠 降雨可能性较大，建议携带雨具'
  } else if (probability >= 40) {
    return '🟡 可能有雨，建议随身携带雨伞'
  } else {
    return '✅ 降雨概率较低，可正常出行'
  }
}
