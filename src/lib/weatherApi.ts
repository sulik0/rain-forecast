import type { WeatherData } from '@/types'

// 和风天气 API 配置
const QWEATHER_API_HOST = import.meta.env.VITE_QWEATHER_API_HOST || 'devapi.qweather.com'
const QWEATHER_API_VERSION = import.meta.env.VITE_QWEATHER_API_VERSION || 'v7'
const QWEATHER_API_KEY = import.meta.env.VITE_QWEATHER_API_KEY
const QWEATHER_API_BASE = `https://${QWEATHER_API_HOST}/${QWEATHER_API_VERSION}`
// GeoAPI 域名（城市查询使用独立域名和路径）
const QWEATHER_GEO_HOST = import.meta.env.VITE_QWEATHER_GEO_HOST || 'geoapi.qweather.com'
const QWEATHER_GEO_BASE = `https://${QWEATHER_GEO_HOST}/v2`

// 和风天气 API 响应类型
interface QWeatherResponse {
  code: string
  updateTime: string
  fxLink: string
}

export interface QWeatherDaily {
  fxDate: string
  tempMax: string
  tempMin: string
  textDay: string
  iconDay: string
  precip: string
  pop: string // 降水概率
}

export interface QWeatherDailyResponse extends QWeatherResponse {
  daily: QWeatherDaily[]
}

interface QWeatherNow {
  temp: string
  text: string
  icon: string
  precip: string
}

interface QWeatherNowResponse extends QWeatherResponse {
  now: QWeatherNow
}

/**
 * 指数退避算法 - 处理速率限制
 * @param errorCount 错误次数
 * @returns 等待毫秒数
 */
function exponentialBackoff(errorCount: number): number {
  const maxWait = 10000 // 最大等待 10 秒
  const baseWait = Math.pow(2, errorCount) * 1000 // 2^c 秒
  const jitter = Math.random() * 1000 // 随机抖动，避免冲突
  return Math.min(baseWait + jitter, maxWait)
}

/**
 * 带重试的请求函数
 * @param url 请求 URL
 * @param options 请求选项
 * @param maxRetries 最大重试次数
 * @returns 响应
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let retryCount = 0

  while (retryCount <= maxRetries) {
    try {
      const response = await fetch(url, options)

      // 429 错误（速率限制）需要指数退避重试
      if (response.status === 429) {
        if (retryCount < maxRetries) {
          const waitTime = exponentialBackoff(retryCount)
          console.warn(`速率限制，等待 ${waitTime}ms 后重试...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          retryCount++
          continue
        }
      }

      return response
    } catch (error) {
      if (retryCount < maxRetries) {
        const waitTime = exponentialBackoff(retryCount)
        console.warn(`请求失败，等待 ${waitTime}ms 后重试...`, error)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        retryCount++
        continue
      }
      throw error
    }
  }

  throw new Error('达到最大重试次数')
}

/**
 * 获取城市天气预报（3天）
 * API 文档: https://dev.qweather.com/docs/api/weather/weather-daily-forecast/
 */
export async function getWeatherForecast(
  cityCode: string
): Promise<QWeatherDailyResponse | null> {
  try {
    const response = await fetchWithRetry(
      `${QWEATHER_API_BASE}/weather/3d?location=${encodeURIComponent(cityCode)}`,
      {
        headers: {
          'X-QW-Api-Key': QWEATHER_API_KEY,
          'Accept-Encoding': 'gzip',
        },
      }
    )

    if (!response.ok) {
      console.error('和风天气 API 请求失败:', response.status, response.statusText)
      return null
    }

    const data: QWeatherDailyResponse = await response.json()

    // 和风天气返回 code "200" 表示成功
    if (data.code !== '200') {
      console.error('和风天气 API 返回错误:', data.code)
      return null
    }

    return data
  } catch (error) {
    console.error('获取天气预报失败:', error)
    return null
  }
}

/**
 * 获取城市实时天气
 * API 文档: https://dev.qweather.com/docs/api/weather/weather-now/
 */
export async function getWeatherNow(
  cityCode: string
): Promise<QWeatherNowResponse | null> {
  try {
    const response = await fetchWithRetry(
      `${QWEATHER_API_BASE}/weather/now?location=${encodeURIComponent(cityCode)}`,
      {
        headers: {
          'X-QW-Api-Key': QWEATHER_API_KEY,
          'Accept-Encoding': 'gzip',
        },
      }
    )

    if (!response.ok) {
      console.error('和风天气 API 请求失败:', response.status, response.statusText)
      return null
    }

    const data: QWeatherNowResponse = await response.json()

    if (data.code !== '200') {
      console.error('和风天气 API 返回错误:', data.code)
      return null
    }

    return data
  } catch (error) {
    console.error('获取实时天气失败:', error)
    return null
  }
}

/**
 * 将和风天气数据转换为应用格式
 */
export function transformQWeatherData(
  cityName: string,
  dailyData: QWeatherDailyResponse,
  _nowData?: QWeatherNowResponse
): WeatherData {
  const today = dailyData.daily[0]

  return {
    source: 'qweather',
    city: cityName,
    date: new Date(today.fxDate),
    rainProbability: parseInt(today.pop) || 0,
    temperature: {
      min: parseInt(today.tempMin),
      max: parseInt(today.tempMax),
    },
    weather: today.textDay,
    updatedAt: new Date(dailyData.updateTime),
  }
}

/**
 * 获取城市天气数据（完整流程）
 */
export async function fetchCityWeather(
  cityName: string,
  cityCode: string
): Promise<WeatherData | null> {
  // 如果没有配置 API Key，返回 null
  if (!QWEATHER_API_KEY || QWEATHER_API_KEY === 'your_qweather_api_key_here') {
    console.warn('未配置和风天气 API Key，请检查 .env 文件')
    return null
  }

  try {
    // 并行获取 3 天预报和实时天气
    const [dailyData, nowData] = await Promise.all([
      getWeatherForecast(cityCode),
      getWeatherNow(cityCode),
    ])

    if (!dailyData) {
      return null
    }

    return transformQWeatherData(cityName, dailyData, nowData ?? undefined)
  } catch (error) {
    console.error(`获取 ${cityName} 天气数据失败:`, error)
    return null
  }
}

/**
 * 城市查询结果类型（和风天气 GeoAPI 返回格式）
 */
export interface CityLookupResult {
  location: {
    id: string       // 城市ID
    name: string     // 城市名称
    lat: string      // 纬度
    lon: string      // 经度
    adm2: string     // 上级行政区划
    adm1: string     // 一级行政区域（省/市）
    country: string  // 国家
    tz: string       // 时区
    type: string     // 属性类型
    rank: string     // 地区评分
    fxLink: string   // 天气预报网页链接
  }
}

/**
 * 查询城市（支持城市名称、拼音、经纬度）
 * API 文档: https://dev.qweather.com/docs/api/geoapi/city-lookup/
 */
export async function lookupCity(cityName: string): Promise<CityLookupResult[] | null> {
  if (!QWEATHER_API_KEY || QWEATHER_API_KEY === 'your_qweather_api_key_here') {
    console.warn('未配置和风天气 API Key，无法查询城市')
    return null
  }

  try {
    const response = await fetchWithRetry(
      `${QWEATHER_GEO_BASE}/city/lookup?location=${encodeURIComponent(cityName)}&range=cn&number=10`,
      {
        headers: {
          'Authorization': `Bearer ${QWEATHER_API_KEY}`,
          'Accept-Encoding': 'gzip',
        },
      }
    )

    if (!response.ok) {
      console.error('城市查询 API 请求失败:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (data.code !== '200') {
      console.error('城市查询 API 返回错误:', data.code)
      return null
    }

    // 转换为统一格式
    const results: CityLookupResult[] = (data.location || []).map((loc: CityLookupResult['location']) => ({
      location: loc
    }))

    return results
  } catch (error) {
    console.error('查询城市失败:', error)
    return null
  }
}

/**
 * 检查 API Key 是否有效
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetchWithRetry(
      `${QWEATHER_API_BASE}/weather/now?location=101010100`,
      {
        headers: {
          'X-QW-Api-Key': apiKey,
          'Accept-Encoding': 'gzip',
        },
      }
    )

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.code === '200'
  } catch {
    return false
  }
}
