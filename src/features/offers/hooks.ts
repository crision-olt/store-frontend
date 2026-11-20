import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EndpointMutationOptions, EndpointQueryOptions } from '@/hooks/endpoint-options'
import { listAllProductsUseCase } from '@/features/products/catalog'
import { listOffersUseCase, saveOfferUseCase } from '@/features/offers/operations'
import type { OfferInput } from '@/features/offers/domain/offer'
import { mutationKeys, queryKeys } from '@/lib/query-keys'

export function useOffers(options?: EndpointQueryOptions<Awaited<ReturnType<typeof listOffersUseCase>>>) {
  return useQuery({
    ...options,
    queryKey: queryKeys.offers,
    queryFn: ({ signal }) => listOffersUseCase(signal),
  })
}

export function useOfferProductCatalog(
  options?: EndpointQueryOptions<Awaited<ReturnType<typeof listAllProductsUseCase>>>,
) {
  return useQuery({
    ...options,
    queryKey: queryKeys.offerCatalog,
    queryFn: ({ signal }) => listAllProductsUseCase({}, signal),
  })
}

export function useSaveOffer(
  offerId: number | undefined,
  options?: EndpointMutationOptions<Awaited<ReturnType<typeof saveOfferUseCase>>, OfferInput>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: offerId === undefined ? mutationKeys.createOffer : mutationKeys.updateOffer,
    mutationFn: (input: OfferInput) => saveOfferUseCase(input, offerId),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.offers })
      await options?.onSuccess?.(...args)
    },
  })
}
