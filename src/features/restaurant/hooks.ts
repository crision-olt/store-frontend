import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { restaurantUseCases } from '@/features/restaurant/restaurant'
import { hasHttpStatus } from '@/features/restaurant/application/http-error'
import type { RestaurantTable, TableInput, Zone, ZoneInput } from '@/features/restaurant/domain/restaurant'
import type { EndpointMutationOptions, EndpointQueryOptions } from '@/hooks/endpoint-options'
import { mutationKeys, queryKeys } from '@/lib/query-keys'

export function useTables(options?: EndpointQueryOptions<RestaurantTable[]>) {
  return useQuery({
    ...options,
    queryKey: queryKeys.tables,
    queryFn: ({ signal }) => restaurantUseCases.listTables(signal),
    retry: false,
  })
}

export function useZones(options?: EndpointQueryOptions<Zone[]>) {
  return useQuery({
    ...options,
    queryKey: queryKeys.zones,
    queryFn: ({ signal }) => restaurantUseCases.listZones(signal),
    retry: false,
  })
}

type ResizeTablesInput = { count: number; expectedCount: number }
type SaveTableInput = { number: number; input: TableInput }

export function useResizeTables(options?: EndpointMutationOptions<RestaurantTable[], ResizeTablesInput>) {
  const client = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: mutationKeys.resizeTables,
    mutationFn: ({ count, expectedCount }: ResizeTablesInput) => restaurantUseCases.resizeTables(count, expectedCount),
    onSuccess: (...args) => {
      client.setQueryData(queryKeys.tables, args[0])
      void client.invalidateQueries({ queryKey: queryKeys.zones })
      return options?.onSuccess?.(...args)
    },
  })
}

export function useSaveTable(options?: EndpointMutationOptions<RestaurantTable, SaveTableInput>) {
  const client = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: mutationKeys.saveTable,
    mutationFn: ({ number, input }: SaveTableInput) => restaurantUseCases.saveTable(number, input),
    onSuccess: (...args) => {
      const updated = args[0]
      client.setQueryData<RestaurantTable[]>(queryKeys.tables, (previous) =>
        previous?.map((table) => table.number === updated.number ? updated : table))
      return options?.onSuccess?.(...args)
    },
  })
}

export function useSaveZone(id: number | undefined, options?: EndpointMutationOptions<Zone, ZoneInput>) {
  const client = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: id === undefined ? mutationKeys.createZone : mutationKeys.updateZone,
    mutationFn: (input: ZoneInput) => restaurantUseCases.saveZone(id, input),
    onSuccess: async (...args) => {
      const saved = args[0]
      await client.cancelQueries({ queryKey: queryKeys.zones })
      client.setQueryData<Zone[]>(queryKeys.zones, (previous = []) => {
        const updated = previous.map((zone) => {
          if (zone.id === saved.id) return saved
          return saved.isBase && zone.isBase ? { ...zone, isBase: false } : zone
        })
        return previous.some((zone) => zone.id === saved.id) ? updated : [...updated, saved]
      })
      await options?.onSuccess?.(...args)
      void client.invalidateQueries({ queryKey: queryKeys.zones })
    },
    onError: async (...args) => {
      const error = args[0]
      if (hasHttpStatus(error, 409) || hasHttpStatus(error, 400)) {
        await Promise.all([
          client.refetchQueries({ queryKey: queryKeys.zones }),
          client.refetchQueries({ queryKey: queryKeys.tables }),
        ])
      }
      await options?.onError?.(...args)
    },
  })
}
