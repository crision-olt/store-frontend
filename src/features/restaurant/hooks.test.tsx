// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import '@/test/setup-dom'
import { useResizeTables, useSaveZone } from '@/features/restaurant/hooks'
import { listTables, resizeTables } from '@/lib/tables-api'
import { listZones, saveZone, ZonesApiError } from '@/lib/zones-api'
import { mutationKeys, queryKeys } from '@/lib/query-keys'

vi.mock('@/lib/tables-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/tables-api')>(),
  listTables: vi.fn(),
  resizeTables: vi.fn(),
}))
vi.mock('@/lib/zones-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/zones-api')>(),
  listZones: vi.fn(),
  saveZone: vi.fn(),
}))

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return { client, wrapper }
}

it('updates the shared table cache and invalidates zones before the resize callback', async () => {
  const { client, wrapper } = setup()
  const tables = [{ number: 1, capacity: 2 as const, isOutside: false, isAccessible: false }]
  client.setQueryData(queryKeys.zones, [])
  vi.mocked(resizeTables).mockResolvedValueOnce(tables)
  const onSuccess = vi.fn(() => {
    expect(client.getQueryData(queryKeys.tables)).toEqual(tables)
    expect(client.getQueryState(queryKeys.zones)?.isInvalidated).toBe(true)
  })
  const { result } = renderHook(() => useResizeTables({ onSuccess }), { wrapper })
  await act(() => result.current.mutateAsync({ count: 1, expectedCount: 2 }))
  expect(resizeTables).toHaveBeenCalledWith(1, 2)
  expect(onSuccess).toHaveBeenCalledOnce()
  expect(client.getMutationCache().getAll()[0].options.mutationKey).toEqual(mutationKeys.resizeTables)
  client.clear()
})

it('refreshes both resource caches after a zone conflict without running success callbacks', async () => {
  const { client, wrapper } = setup()
  const zone = { id: 1, name: 'Main', hasOutside: false, isBase: true, tableNumbers: [1] }
  const tables = [{ number: 1, capacity: 2 as const, isOutside: false, isAccessible: false }]
  vi.mocked(listZones).mockResolvedValueOnce([zone])
  vi.mocked(listTables).mockResolvedValueOnce(tables)
  await client.fetchQuery({ queryKey: queryKeys.zones, queryFn: ({ signal }) => listZones(signal) })
  await client.fetchQuery({ queryKey: queryKeys.tables, queryFn: ({ signal }) => listTables(signal) })
  vi.mocked(listZones).mockResolvedValueOnce([])
  vi.mocked(listTables).mockResolvedValueOnce([])
  const conflict = new ZonesApiError(409)
  vi.mocked(saveZone).mockRejectedValueOnce(conflict)
  const onSuccess = vi.fn()
  const { result } = renderHook(() => useSaveZone(zone.id, { onSuccess }), { wrapper })
  await act(async () => {
    await expect(result.current.mutateAsync(zone)).rejects.toBe(conflict)
  })
  expect(client.getQueryData(queryKeys.zones)).toEqual([])
  expect(client.getQueryData(queryKeys.tables)).toEqual([])
  expect(onSuccess).not.toHaveBeenCalled()
  client.clear()
})
