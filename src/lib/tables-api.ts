import { z } from 'zod'
import { resolveServiceUrl } from '@/lib/http'

export const tablesQueryKey = ['restaurant-tables'] as const

const tableSchema = z.object({
  number: z.number().int().min(1).max(50),
  capacity: z.union([z.literal(2), z.literal(4), z.literal(6), z.literal(8)]),
  isOutside: z.boolean(),
  isAccessible: z.boolean(),
})

export type RestaurantTable = z.infer<typeof tableSchema>
export type TableInput = Omit<RestaurantTable, 'number'>

export class TablesApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Tables request failed with HTTP ${status}`)
    this.name = 'TablesApiError'
    this.status = status
  }
}

async function request(path: string, options: RequestInit) {
  const response = await fetch(resolveServiceUrl(import.meta.env.AUTH_SERVICE_URL, path), {
    ...options,
    credentials: 'include',
  })
  if (!response.ok) throw new TablesApiError(response.status)
  return response.json()
}

export async function listTables(signal: AbortSignal) {
  return z.array(tableSchema).parse(await request('/tables', { signal }))
}

export async function resizeTables(count: number, expectedCount: number) {
  return z.array(tableSchema).parse(await request('/tables', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count, expectedCount }),
  }))
}

export async function saveTable(number: number, input: TableInput) {
  return tableSchema.parse(await request(`/tables/${number}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }))
}
