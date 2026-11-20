// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import '@/test/setup-dom'
import { AppWrapper } from '@/test/utils'
import { listTables, resizeTables, saveTable } from '@/lib/tables-api'
import { queryKeys } from '@/lib/query-keys'
import { TablesPage } from '@/pages/tables'

vi.mock('@/components/auth/require-auth', () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/hooks/use-session-guard', () => ({ useSessionGuard: vi.fn() }))
vi.mock('@/lib/tables-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/tables-api')>(),
  listTables: vi.fn(),
  resizeTables: vi.fn(),
  saveTable: vi.fn(),
}))

test('resizes tables and confirms removal before reducing the count', async () => {
  const tables = [1, 2].map((number) => ({ number, capacity: 2 as const, isOutside: false, isAccessible: false }))
  vi.mocked(listTables).mockReset().mockResolvedValue(tables)
  vi.mocked(resizeTables).mockReset().mockResolvedValue(tables.slice(0, 1))
  const user = userEvent.setup()
  const client = new QueryClient()
  render(<AppWrapper><QueryClientProvider client={client}><MemoryRouter>
    <TablesPage />
  </MemoryRouter></QueryClientProvider></AppWrapper>)
  const count = await screen.findByLabelText('Number of tables')
  await waitFor(() => expect(client.getQueryData(queryKeys.tables)).toEqual(tables))
  await user.clear(count)
  await user.type(count, '1')
  await user.click(screen.getByRole('button', { name: 'Update table count' }))
  expect(resizeTables).not.toHaveBeenCalled()
  act(() => client.setQueryData(queryKeys.tables, [...tables, { ...tables[0], number: 3 }]))
  await user.click(screen.getByRole('button', { name: 'Remove tables' }))
  await waitFor(() => expect(resizeTables).toHaveBeenCalledWith(1, 2))
})

test('edits the capacity and accessibility of an individual table', async () => {
  const table = { number: 1, capacity: 2 as const, isOutside: false, isAccessible: false }
  vi.mocked(listTables).mockReset().mockResolvedValue([table])
  vi.mocked(saveTable).mockReset().mockResolvedValue({ ...table, capacity: 4, isOutside: true, isAccessible: true })
  const user = userEvent.setup()
  render(<AppWrapper><QueryClientProvider client={new QueryClient()}><MemoryRouter>
    <TablesPage />
  </MemoryRouter></QueryClientProvider></AppWrapper>)
  await user.selectOptions(await screen.findByLabelText('Capacity for table 1'), '4')
  await user.click(screen.getByLabelText('Outside for table 1'))
  await user.click(screen.getByLabelText('Accessible for table 1'))
  await user.click(screen.getByRole('button', { name: 'Save table 1' }))
  await waitFor(() => expect(saveTable).toHaveBeenCalledWith(1, { capacity: 4, isOutside: true, isAccessible: true }))
})
