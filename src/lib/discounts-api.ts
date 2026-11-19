import { z } from 'zod'
import { resolveServiceUrl } from '@/lib/http'

const discountSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  nameEs: z.string(),
  kind: z.enum(['percentage', 'fixed_amount']),
  amount: z.number(),
  roleIds: z.array(z.number().int().positive()),
})

export type Discount = z.infer<typeof discountSchema>
export type DiscountInput = Omit<Discount, 'id'>

export class DiscountsApiError extends Error {
  constructor(status: number) {
    super(`Discounts request failed with HTTP ${status}`)
    this.name = 'DiscountsApiError'
    this.status = status
  }

  readonly status: number
}

async function request(path: string, options: RequestInit) {
  const response = await fetch(resolveServiceUrl(import.meta.env.AUTH_SERVICE_URL, path), {
    ...options,
    credentials: 'include',
  })
  if (!response.ok) throw new DiscountsApiError(response.status)
  return response.json()
}

export async function listDiscounts(signal: AbortSignal) {
  return z.array(discountSchema).parse(await request('/discounts', { signal }))
}

export async function saveDiscount(input: DiscountInput, id?: number) {
  return discountSchema.parse(await request(id === undefined ? '/discounts' : `/discounts/${id}`, {
    method: id === undefined ? 'POST' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }))
}
