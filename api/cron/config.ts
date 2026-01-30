import { kvGet, kvSet, hasKvConfig } from './_kv'

const ADMIN_SECRET = process.env.ADMIN_SECRET
const FORECAST_DAYS = clampDays(process.env.FORECAST_DAYS, 3)

type ForecastTarget = 'today' | 'tomorrow' | 'range'

interface SlotConfig {
  enabled: boolean
  target: ForecastTarget
  days: 1 | 2 | 3
}

interface RemoteConfig {
  enabled?: boolean
  slots?: Record<string, Partial<SlotConfig>>
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

function getBaseSlotConfig(slot: string): SlotConfig {
  const key = slot.toUpperCase()
  const enabled = parseEnabled(process.env[`FORECAST_SLOT_${key}_ENABLED`], true)
  const target = parseTarget(process.env[`FORECAST_SLOT_${key}_TARGET`]) ?? defaultTargetForSlot(slot)
  const days = clampDays(process.env[`FORECAST_SLOT_${key}_DAYS`], FORECAST_DAYS)
  return { enabled, target, days }
}

function getBaseConfig(): Required<RemoteConfig> {
  return {
    enabled: true,
    slots: {
      morning: getBaseSlotConfig('morning'),
      evening: getBaseSlotConfig('evening'),
      night: getBaseSlotConfig('night'),
    },
  }
}

function hasValidSecret(req: any): boolean {
  if (!ADMIN_SECRET) return false
  const authHeader = req?.headers?.authorization || ''
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length) === ADMIN_SECRET
  }
  return false
}

function sanitizeTarget(value: any): ForecastTarget | undefined {
  if (value === 'today' || value === 'tomorrow' || value === 'range') return value
  return undefined
}

function sanitizeSlot(value: any): Partial<SlotConfig> | undefined {
  if (!value || typeof value !== 'object') return undefined
  const out: Partial<SlotConfig> = {}
  if (typeof value.enabled === 'boolean') out.enabled = value.enabled
  const target = sanitizeTarget(value.target)
  if (target) out.target = target
  if (value.days === 1 || value.days === 2 || value.days === 3) {
    out.days = value.days
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function mergeConfig(base: Required<RemoteConfig>, override: RemoteConfig | null): Required<RemoteConfig> {
  if (!override) return base
  return {
    enabled: override.enabled ?? base.enabled,
    slots: {
      morning: { ...base.slots.morning, ...(override.slots?.morning ?? {}) },
      evening: { ...base.slots.evening, ...(override.slots?.evening ?? {}) },
      night: { ...base.slots.night, ...(override.slots?.night ?? {}) },
    },
  }
}

export default async function handler(req: any, res: any) {
  if (!hasKvConfig()) {
    res.status(400).json({ ok: false, error: 'KV not configured' })
    return
  }

  if (!hasValidSecret(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return
  }

  const base = getBaseConfig()
  const raw = await kvGet('rain-forecast:config')
  let stored: RemoteConfig | null = null
  if (raw) {
    try {
      stored = JSON.parse(raw) as RemoteConfig
    } catch {
      stored = null
    }
  }

  if (req.method === 'GET') {
    res.status(200).json({ ok: true, config: mergeConfig(base, stored) })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  let body: any = req.body
  if (typeof req.body === 'string') {
    try {
      body = JSON.parse(req.body)
    } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON body' })
      return
    }
  }
  const updates: RemoteConfig = {}

  if (typeof body?.enabled === 'boolean') {
    updates.enabled = body.enabled
  }

  if (body?.slots && typeof body.slots === 'object') {
    const slots: Record<string, Partial<SlotConfig>> = {}
    const morning = sanitizeSlot(body.slots.morning)
    const evening = sanitizeSlot(body.slots.evening)
    const night = sanitizeSlot(body.slots.night)
    if (morning) slots.morning = morning
    if (evening) slots.evening = evening
    if (night) slots.night = night
    if (Object.keys(slots).length > 0) updates.slots = slots
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ ok: false, error: 'No valid updates' })
    return
  }

  const merged = mergeConfig(base, {
    ...stored,
    ...updates,
    slots: { ...(stored?.slots ?? {}), ...(updates.slots ?? {}) },
  })

  await kvSet('rain-forecast:config', JSON.stringify(merged), 60 * 60 * 24 * 30)
  res.status(200).json({ ok: true, config: merged })
}
