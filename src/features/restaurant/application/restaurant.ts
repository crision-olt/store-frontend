import type { RestaurantRepository, TableInput, ZoneInput } from '@/features/restaurant/domain/restaurant'

export function createRestaurantUseCases(repository: RestaurantRepository) {
  return {
    listTables: (signal: AbortSignal) => repository.listTables(signal),
    resizeTables: (count: number, expectedCount: number) => repository.resizeTables(count, expectedCount),
    saveTable: (number: number, input: TableInput) => repository.saveTable(number, input),
    listZones: (signal: AbortSignal) => repository.listZones(signal),
    saveZone: (id: number | undefined, input: ZoneInput) => repository.saveZone(id, input),
  }
}
