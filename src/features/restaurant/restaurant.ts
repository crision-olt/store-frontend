import { createRestaurantUseCases } from '@/features/restaurant/application/restaurant'
import { RestaurantApiAdapter } from '@/features/restaurant/infrastructure/restaurant-api-adapter'

export const restaurantUseCases = createRestaurantUseCases(new RestaurantApiAdapter())
export const tablesQueryKey = ['restaurant-tables'] as const
export const zonesQueryKey = ['restaurant-zones'] as const
export type { RestaurantTable, TableInput, Zone, ZoneInput } from '@/features/restaurant/domain/restaurant'
