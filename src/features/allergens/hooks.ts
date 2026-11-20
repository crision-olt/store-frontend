import { useQuery } from '@tanstack/react-query'
import type { EndpointQueryOptions } from '@/hooks/endpoint-options'
import { listAllergensUseCase } from '@/features/allergens/list-allergens'
import { queryKeys } from '@/lib/query-keys'

export function useAllergens(options?: EndpointQueryOptions<Awaited<ReturnType<typeof listAllergensUseCase>>>) {
  return useQuery({
    ...options,
    queryKey: queryKeys.allergens,
    queryFn: ({ signal }) => listAllergensUseCase(signal),
  })
}
