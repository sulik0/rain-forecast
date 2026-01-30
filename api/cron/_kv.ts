const KV_REST_API_URL = process.env.KV_REST_API_URL
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN

export async function kvGet(key: string): Promise<string | null> {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) return null
  const response = await fetch(`${KV_REST_API_URL}/get/${encodeURIComponent(key)}`, {
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
    },
  })
  if (!response.ok) return null
  const data = await response.json()
  return typeof data?.result === 'string' ? data.result : null
}

export async function kvSet(
  key: string,
  value: string,
  ttlSeconds = 60 * 60 * 36
): Promise<void> {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) return
  const url = `${KV_REST_API_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?ex=${ttlSeconds}`
  await fetch(url, {
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
    },
  })
}

export function hasKvConfig(): boolean {
  return Boolean(KV_REST_API_URL && KV_REST_API_TOKEN)
}
