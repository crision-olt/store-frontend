import { createRestaurantUseCases } from './restaurant'
import { RestaurantApiAdapter } from '@/features/restaurant/infrastructure/restaurant-api-adapter'
import { TablesApiError, listTables } from '@/lib/tables-api'

vi.mock('@/lib/tables-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/tables-api')>(),
  listTables: vi.fn(),
}))

describe('restaurant use cases', () => {
  it('delegates table and zone operations to the repository', async () => {
    const table = { number: 1, capacity: 2 as const, isOutside: false, isAccessible: false }
    const zone = { id: 2, name: 'Dining', hasOutside: false, isBase: true, tableNumbers: [1] }
    const signal = new AbortController().signal
    const repository = {
      listTables: vi.fn().mockResolvedValue([table]),
      resizeTables: vi.fn().mockResolvedValue([table]),
      saveTable: vi.fn().mockResolvedValue(table),
      listZones: vi.fn().mockResolvedValue([zone]),
      saveZone: vi.fn().mockResolvedValue(zone),
    }
    const useCases = createRestaurantUseCases(repository)

    await expect(useCases.listTables(signal)).resolves.toEqual([table])
    await expect(useCases.resizeTables(1, 2)).resolves.toEqual([table])
    await expect(useCases.saveTable(1, { capacity: 2, isOutside: false, isAccessible: false })).resolves.toEqual(table)
    await expect(useCases.listZones(signal)).resolves.toEqual([zone])
    await expect(useCases.saveZone(undefined, { name: 'Dining', hasOutside: false, isBase: true, tableNumbers: [1] })).resolves.toEqual(zone)

    expect(repository.listTables).toHaveBeenCalledWith(signal)
    expect(repository.resizeTables).toHaveBeenCalledWith(1, 2)
    expect(repository.saveTable).toHaveBeenCalledWith(1, { capacity: 2, isOutside: false, isAccessible: false })
    expect(repository.listZones).toHaveBeenCalledWith(signal)
    expect(repository.saveZone).toHaveBeenCalledWith(undefined, { name: 'Dining', hasOutside: false, isBase: true, tableNumbers: [1] })
  })

  it('preserves transport failures and their status at the feature boundary', async () => {
    const error = new TablesApiError(401)
    vi.mocked(listTables).mockRejectedValueOnce(error)

    await expect(new RestaurantApiAdapter().listTables(new AbortController().signal))
      .rejects.toBe(error)
  })
})
