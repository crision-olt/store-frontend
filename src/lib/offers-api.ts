import { z } from 'zod'
import { resolveServiceUrl } from '@/lib/http'

const offerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  kind: z.enum(['menu', 'promotion']),
  amount: z.number(),
  productIds: z.array(z.number().int().positive()),
  minimumDistinctProducts: z.number().int().positive().optional(),
})

export type Offer = z.infer<typeof offerSchema>
export type OfferInput = Omit<Offer, 'id'>

export class OffersApiError extends Error {
  constructor(status: number) {
    super(`Offers request failed with HTTP ${status}`)
    this.status = status
  }

  readonly status: number
}

async function request(path: string, options: RequestInit) {
  const response = await fetch(resolveServiceUrl(import.meta.env.AUTH_SERVICE_URL, path), {
    ...options,
    credentials: 'include',
  })
  if (!response.ok) throw new OffersApiError(response.status)
  return response.json()
}

export async function listOffers(signal: AbortSignal) {
  return z.array(offerSchema).parse(await request('/offers', { signal }))
}

export async function saveOffer(input: OfferInput, id?: number) {
  return offerSchema.parse(await request(id === undefined ? '/offers' : `/offers/${id}`, {
    method: id === undefined ? 'POST' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }))
}
