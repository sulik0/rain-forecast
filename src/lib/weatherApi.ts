import type { WeatherData } from '@/types'

// 和风天气 API 配置
const QWEATHER_API_BASE = 'https://devapi.qweather.com/v7'
const QWEATHER_API_KEY = import.meta.env.VITE_QWEATHER_API_KEY

// 和风天气 API 响应类型
interface QWeatherResponse {
  code: string
  updateTime: string
  fxLink: string
}

interface QWeatherDaily {
  fxDate: string
  tempMax: string
  tempMin: string
  textDay: string
  iconDay: string
  precip: string
  pop: string // 降水概率
}

interface QWeatherDailyResponse extends QWeatherResponse {
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
 * 获取城市天气预报（3天）
 * API 文档: https://dev.qweather.com/docs/api/weather/weather-daily-forecast/
 */
export async function getWeatherForecast(
  cityCode: string
): Promise<QWeatherDailyResponse | null> {
  try {
    const response = await fetch(
      `${QWEATHER_API_BASE}/weather/${import.meta.env.VITE_QWEATHER_API_VERSION || 'v7'}/weather/${cityCode}3d?key=${QWEATHER_API_KEY}`
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
    const response = await fetch(
      `${QWEATHER_API_BASE}/weather/${import.meta.env.VITE_QWEATHER_API_VERSION || 'v7'}/now?key=${QWEATHER_API_KEY}&location=${cityCode}`
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
 * 城市查询结果类型
 */
export interface CityLookupResult {
  location: {
    id: string // 城市代码
    name: string
    country: string
    path: string // 完整路径，如 "北京,北京,中国"
    lat: string
    lon: string
  }
}

/**
 * 查询城市（支持城市名称、拼音、IP）
 * API 文档: https://dev.qweather.com/docs/api/geoapi/city-lookup/
 */
export async function lookupCity(cityName: string): Promise<CityLookupResult[] | null> {
  if (!QWEATHER_API_KEY || QWEATHER_API_KEY === 'your_qweather_api_key_here') {
    console.warn('未配置和风天气 API Key，无法查询城市')
    return null
  }

  try {
    const response = await fetch(
      `${QWEATHER_API_BASE}/city/lookup?key=${QWEATHER_API_KEY}&location=${encodeURIComponent(cityName)}`
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

    return data.location || []
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
    const response = await fetch(
      `${QWEATHER_API_BASE}/weather/${import.meta.env.VITE_QWEATHER_API_VERSION || 'v7'}/now?key=${apiKey}&location=101010100`
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
