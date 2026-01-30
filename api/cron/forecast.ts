import { kvGet, kvSet, hasKvConfig } from './_kv'

const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY || process.env.VITE_QWEATHER_API_KEY
const QWEATHER_API_HOST = process.env.QWEATHER_API_HOST || 'devapi.qweather.com'
const QWEATHER_API_VERSION = process.env.QWEATHER_API_VERSION || 'v7'
const SERVERCHAN_TOKEN =
  process.env.WECHAT_PUSH_TOKEN ||
  process.env.SERVERCHAN_TOKEN ||
  process.env.VITE_WECHAT_PUSH_TOKEN
const FORECAST_DAYS = clampDays(process.env.FORECAST_DAYS, 3)
const FORECAST_CITIES = process.env.FORECAST_CITIES
const CRON_SECRET = process.env.CRON_SECRET
const CONFIG_KEY = 'rain-forecast:config'

interface CityConfig {
  name: string
  code: string
}

interface QWeatherDaily {
  fxDate: string
  tempMax: string
  tempMin: string
  textDay: string
  iconDay: string
  precip: string
  pop: string
}

interface QWeatherDailyResponse {
  code: string
  updateTime: string
  fxLink: string
  daily: QWeatherDaily[]
}

type ForecastTarget = 'today' | 'tomorrow' | 'range'

interface SlotConfig {
  enabled: boolean
  target: ForecastTarget
  days: 1 | 2 | 3
}

interface RemoteConfig {
  enabled?: boolean
  slots?: Record<string, { enabled?: boolean; target?: ForecastTarget; days?: 1 | 2 | 3 }>
}

function clampDays(raw: string | undefined, fallback: 1 | 2 | 3): 1 | 2 | 3 {
  const value = Number(raw)
  if (value === 1 || value === 2 || value === 3) return value
  return fallback
}

function parseEnabled(raw: string | undefined, fallback = true): boolean {
  if (raw === undefined) return fallback
  const value = raw.trim().toLowerCase()
  if (value === 'false' || value === '0' || value === 'no') return false
  if (value === 'true' || value === '1' || value === 'yes') return true
  return fallback
}

function parseTarget(raw: string | undefined): ForecastTarget | undefined {
  if (raw === 'today' || raw === 'tomorrow' || raw === 'range') return raw
  return undefined
}

function defaultTargetForSlot(slot: string): ForecastTarget {
  const normalized = slot.toLowerCase()
  if (normalized === 'morning') return 'today'
  if (normalized === 'evening' || normalized === 'night') return 'tomorrow'
  return 'range'
}

function getSlotConfig(slot: string): SlotConfig {
  const key = slot.toUpperCase()
  const enabled = parseEnabled(process.env[`FORECAST_SLOT_${key}_ENABLED`], true)
  const target = parseTarget(process.env[`FORECAST_SLOT_${key}_TARGET`]) ?? defaultTargetForSlot(slot)
  const days = clampDays(process.env[`FORECAST_SLOT_${key}_DAYS`], FORECAST_DAYS)
  return { enabled, target, days }
}

function parseCities(): CityConfig[] {
  if (!FORECAST_CITIES) {
    return defaultCities()
  }

  const trimmed = FORECAST_CITIES.trim()
  if (!trimmed) return defaultCities()

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item && item.name && item.code)
          .map(item => ({ name: String(item.name), code: String(item.code) }))
      }
    } catch {
      return defaultCities()
    }
  }

  return trimmed
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [name, code] = item.split(':')
      return { name: name?.trim() || '', code: code?.trim() || '' }
    })
    .filter(item => item.name && item.code)
}

function defaultCities(): CityConfig[] {
  return [
    { name: '北京', code: '101010100' },
    { name: '上海', code: '101020100' },
    { name: '广州', code: '101280101' },
    { name: '深圳', code: '101280601' },
    { name: '杭州', code: '101210101' },
    { name: '成都', code: '101270101' },
    { name: '武汉', code: '101200101' },
    { name: '南京', code: '101190101' },
    { name: '西安', code: '101110101' },
    { name: '重庆', code: '101040100' },
  ]
}

function formatForecastLines(
  daily: QWeatherDaily[],
  slotConfig: SlotConfig
): { lines: string[]; label: string } {
  if (slotConfig.target === 'today') {
    const item = daily[0]
    if (!item) return { lines: [], label: '今天' }
    const rainProb = parseInt(item.pop) || 0
    return {
      label: '今天',
      lines: [`今天：${item.textDay}，${item.tempMin}°~${item.tempMax}°，降雨概率 ${rainProb}%`],
    }
  }

  if (slotConfig.target === 'tomorrow') {
    const item = daily[1]
    if (!item) return { lines: [], label: '明天' }
    const rainProb = parseInt(item.pop) || 0
    return {
      label: '明天',
      lines: [`明天：${item.textDay}，${item.tempMin}°~${item.tempMax}°，降雨概率 ${rainProb}%`],
    }
  }

  return {
    label: '未来',
    lines: daily.slice(0, slotConfig.days).map((item, index) => {
      const label = index === 0 ? '今天' : index === 1 ? '明天' : '后天'
      const rainProb = parseInt(item.pop) || 0
      return `${label}：${item.textDay}，${item.tempMin}°~${item.tempMax}°，降雨概率 ${rainProb}%`
    }),
  }
}

function hasValidSecret(req: any): boolean {
  if (!CRON_SECRET) return true
  const authHeader = req?.headers?.authorization || ''
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length) === CRON_SECRET
  }
  return false
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let retryCount = 0
  while (retryCount <= maxRetries) {
    try {
      const response = await fetch(url, options)
      if (response.status !== 429) return response
    } catch {
      // ignore
    }
    retryCount += 1
    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
  }
  return fetch(url, options)
}

async function getWeatherForecast(cityCode: string): Promise<QWeatherDailyResponse | null> {
  if (!QWEATHER_API_KEY) return null

  const url = `https://${QWEATHER_API_HOST}/${QWEATHER_API_VERSION}/weather/3d?location=${encodeURIComponent(cityCode)}`
  const response = await fetchWithRetry(url, {
    headers: {
      'X-QW-Api-Key': QWEATHER_API_KEY,
      'Accept-Encoding': 'gzip',
    },
  })

  if (!response.ok) return null
  const data = (await response.json()) as QWeatherDailyResponse
  if (data.code !== '200') return null
  return data
}

async function sendServerChan(token: string, title: string, content: string) {
  const response = await fetch(`https://sctapi.ftqq.com/${token}.send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, desp: content }),
  })

  const data = await response.json()
  return {
    success: data.code === 0,
    message: data.message || (data.code === 0 ? '发送成功' : '发送失败'),
  }
}

function applyRemoteConfig(
  slotConfig: SlotConfig,
  remote: RemoteConfig | null,
  slot: string
): SlotConfig | null {
  if (!remote) return slotConfig
  if (remote.enabled === false) return null

  const override = remote.slots?.[slot]
  if (!override) return slotConfig
  if (override.enabled === false) return null

  return {
    enabled: slotConfig.enabled,
    target: override.target ?? slotConfig.target,
    days: override.days ?? slotConfig.days,
  }
}

export default async function handler(req: any, res: any) {
  if (!hasValidSecret(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return
  }

  if (!SERVERCHAN_TOKEN) {
    res.status(400).json({ ok: false, error: 'Missing WECHAT_PUSH_TOKEN' })
    return
  }

  const cities = parseCities()
  if (cities.length === 0) {
    res.status(400).json({ ok: false, error: 'No cities configured' })
    return
  }

  const slot = typeof req?.query?.slot === 'string' ? req.query.slot : 'default'
  const baseSlotConfig = getSlotConfig(slot)
  const remoteConfigRaw = await kvGet(CONFIG_KEY)
  let remoteConfig: RemoteConfig | null = null
  if (remoteConfigRaw) {
    try {
      remoteConfig = JSON.parse(remoteConfigRaw) as RemoteConfig
    } catch {
      remoteConfig = null
    }
  }
  const slotConfig = applyRemoteConfig(baseSlotConfig, remoteConfig, slot)

  if (!slotConfig || !slotConfig.enabled) {
    res.status(200).json({ ok: true, skipped: true, reason: 'Slot disabled', slot })
    return
  }

  const today = new Date()
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const dedupeKey = `rain-forecast:${dateKey}:${slot}`

  const existing = await kvGet(dedupeKey)
  if (existing) {
    res.status(200).json({ ok: true, skipped: true, reason: 'Already sent', slot, date: dateKey })
    return
  }

  const results = []
  for (const city of cities) {
    const forecast = await getWeatherForecast(city.code)
    if (!forecast) {
      results.push({ city: city.name, success: false, message: '获取天气失败' })
      continue
    }

    const { lines, label } = formatForecastLines(forecast.daily, slotConfig)
    if (lines.length === 0) {
      results.push({ city: city.name, success: false, message: `缺少${label}天气数据` })
      continue
    }
    const content = `天气预报

📍 城市：${city.name}
${lines.join('\n')}

---
数据更新时间：${forecast.updateTime}
推送时间：${new Date().toLocaleString('zh-CN')}
`

    const result = await sendServerChan(
      SERVERCHAN_TOKEN,
      `【每日天气预报】${city.name}`,
      content
    )

    results.push({
      city: city.name,
      success: result.success,
      message: result.message,
    })
  }

  const anySuccess = results.some((item: any) => item.success)
  if (anySuccess) {
    await kvSet(dedupeKey, String(Date.now()))
  }

  res.status(200).json({
    ok: true,
    slot,
    date: dateKey,
    target: slotConfig.target,
    days: slotConfig.days,
    results,
    dedupe: hasKvConfig(),
  })
}
