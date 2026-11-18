import { z } from 'zod'
import { resolveServiceUrl } from '@/lib/http'

const allergensSchema = z.array(z.object({
  id: z.number().int().positive(),
  code: z.string().min(1),
  name: z.string().min(1),
  nameEs: z.string().min(1),
}))

export type Allergen = z.infer<typeof allergensSchema>[number]

export class AllergensApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Allergens request failed with HTTP ${status}`)
    this.name = 'AllergensApiError'
    this.status = status
  }
}

export async function listAllergens(signal: AbortSignal) {
  const url = resolveServiceUrl(import.meta.env.AUTH_SERVICE_URL, '/allergens')
  const response = await fetch(url, { credentials: 'include', signal })
  if (!response.ok) throw new AllergensApiError(response.status)
  return allergensSchema.parse(await response.json())
}
