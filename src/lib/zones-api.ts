import { z } from 'zod'
import { resolveServiceUrl } from '@/lib/http'

export const zonesQueryKey = ['restaurant-zones'] as const

const zoneSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  hasOutside: z.boolean(),
  isBase: z.boolean(),
  tableNumbers: z.array(z.number().int().min(1).max(50)),
})

export type Zone = z.infer<typeof zoneSchema>
export type ZoneInput = Omit<Zone, 'id'>

export class ZonesApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Zones request failed with HTTP ${status}`)
    this.name = 'ZonesApiError'
    this.status = status
  }
}

async function request(path: string, options: RequestInit) {
  const response = await fetch(resolveServiceUrl(import.meta.env.AUTH_SERVICE_URL, path), {
    ...options,
    credentials: 'include',
  })
  if (!response.ok) throw new ZonesApiError(response.status)
  return response.json()
}

export async function listZones(signal: AbortSignal) {
  return z.array(zoneSchema).parse(await request('/zones', { signal }))
}

export async function saveZone(id: number | undefined, input: ZoneInput) {
  return zoneSchema.parse(await request(id === undefined ? '/zones' : `/zones/${id}`, {
    method: id === undefined ? 'POST' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }))
}
