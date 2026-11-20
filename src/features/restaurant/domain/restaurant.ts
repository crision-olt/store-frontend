export type RestaurantTable = {
  number: number
  capacity: 2 | 4 | 6 | 8
  isOutside: boolean
  isAccessible: boolean
}

export type TableInput = Omit<RestaurantTable, 'number'>

export type Zone = {
  id: number
  name: string
  hasOutside: boolean
  isBase: boolean
  tableNumbers: number[]
}

export type ZoneInput = Omit<Zone, 'id'>

export interface RestaurantRepository {
  listTables(signal: AbortSignal): Promise<RestaurantTable[]>
  resizeTables(count: number, expectedCount: number): Promise<RestaurantTable[]>
  saveTable(number: number, input: TableInput): Promise<RestaurantTable>
  listZones(signal: AbortSignal): Promise<Zone[]>
  saveZone(id: number | undefined, input: ZoneInput): Promise<Zone>
}
