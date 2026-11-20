import { createRestaurantUseCases } from '@/features/restaurant/application/restaurant'
import { RestaurantApiAdapter } from '@/features/restaurant/infrastructure/restaurant-api-adapter'
import { queryKeys } from '@/lib/query-keys'

export const restaurantUseCases = createRestaurantUseCases(new RestaurantApiAdapter())
export const tablesQueryKey = queryKeys.tables
export const zonesQueryKey = queryKeys.zones
export type { RestaurantTable, TableInput, Zone, ZoneInput } from '@/features/restaurant/domain/restaurant'
