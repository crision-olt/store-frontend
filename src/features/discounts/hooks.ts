import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EndpointMutationOptions, EndpointQueryOptions } from '@/hooks/endpoint-options'
import { listDiscountsUseCase, saveDiscountUseCase } from '@/features/discounts/operations'
import type { DiscountInput } from '@/features/discounts/domain/discount'
import { mutationKeys, queryKeys } from '@/lib/query-keys'

export function useDiscounts(options?: EndpointQueryOptions<Awaited<ReturnType<typeof listDiscountsUseCase>>>) {
  return useQuery({
    ...options,
    queryKey: queryKeys.discounts,
    queryFn: ({ signal }) => listDiscountsUseCase(signal),
  })
}

export function useSaveDiscount(
  discountId: number | undefined,
  options?: EndpointMutationOptions<Awaited<ReturnType<typeof saveDiscountUseCase>>, DiscountInput>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: discountId === undefined ? mutationKeys.createDiscount : mutationKeys.updateDiscount,
    mutationFn: (input: DiscountInput) => saveDiscountUseCase(input, discountId),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.discounts })
      await options?.onSuccess?.(...args)
    },
  })
}
