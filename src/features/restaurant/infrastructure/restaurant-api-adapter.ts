import { listTables, resizeTables, saveTable } from '@/lib/tables-api'
import { listZones, saveZone } from '@/lib/zones-api'
import type { RestaurantRepository, TableInput, ZoneInput } from '@/features/restaurant/domain/restaurant'

export class RestaurantApiAdapter implements RestaurantRepository {
  listTables(signal: AbortSignal) {
    return listTables(signal)
  }

  resizeTables(count: number, expectedCount: number) {
    return resizeTables(count, expectedCount)
  }

  saveTable(number: number, input: TableInput) {
    return saveTable(number, input)
  }

  listZones(signal: AbortSignal) {
    return listZones(signal)
  }

  saveZone(id: number | undefined, input: ZoneInput) {
    return saveZone(id, input)
  }
}
