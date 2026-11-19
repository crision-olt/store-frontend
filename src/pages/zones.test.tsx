// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@/test/setup-dom'
import { AppWrapper } from '@/test/utils'
import { listTables } from '@/lib/tables-api'
import { listZones, saveZone } from '@/lib/zones-api'
import { ZonesPage } from '@/pages/zones'

vi.mock('@/components/auth/require-auth', () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/hooks/use-session-guard', () => ({ useSessionGuard: vi.fn() }))
vi.mock('@/lib/tables-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/tables-api')>(),
  listTables: vi.fn(),
}))
vi.mock('@/lib/zones-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/zones-api')>(),
  listZones: vi.fn(),
  saveZone: vi.fn(),
}))

test('creates and edits a zone without offering tables assigned to another zone', async () => {
  const existing = { id: 1, name: 'Dining room', hasOutside: false, tableNumbers: [1] }
  const input = { name: 'Gallery', hasOutside: true, tableNumbers: [2, 3] }
  let zones = [existing]
  vi.mocked(listZones).mockImplementation(async () => zones)
  vi.mocked(listTables).mockResolvedValue([1, 2, 3].map((number) => ({
    number, capacity: 2, isOutside: number === 2, isAccessible: false,
  })))
  vi.mocked(saveZone).mockImplementation(async (id, values) => {
    const saved = { id: id ?? 2, ...values }
    zones = [...zones.filter((zone) => zone.id !== saved.id), saved]
    return saved
  })
  const user = userEvent.setup()
  render(<AppWrapper><QueryClientProvider client={new QueryClient()}><MemoryRouter>
    <ZonesPage />
  </MemoryRouter></QueryClientProvider></AppWrapper>)

  await user.click(await screen.findByRole('button', { name: 'Create zone' }))
  const picker = () => within(screen.getByRole('group', { name: 'Tables' }))
  expect(picker().queryByRole('checkbox', { name: 'Table 1' })).not.toBeInTheDocument()
  expect(picker().queryByRole('checkbox', { name: 'Table 2 (outdoor)' })).not.toBeInTheDocument()
  await user.type(screen.getByLabelText('Zone name'), 'Gallery')
  await user.click(screen.getByLabelText('Has an outdoor area'))
  await user.click(picker().getByRole('checkbox', { name: 'Table 2 (outdoor)' }))
  await user.click(picker().getByRole('checkbox', { name: 'Table 3' }))
  await user.click(screen.getByRole('button', { name: 'Save zone' }))
  await user.click(await screen.findByRole('button', { name: 'Edit Gallery' }))
  expect(saveZone).toHaveBeenNthCalledWith(1, undefined, input)
  expect(picker().getByRole('checkbox', { name: 'Table 2 (outdoor)' })).toBeChecked()
  expect(picker().getByRole('checkbox', { name: 'Table 3' })).toBeChecked()
  await user.click(screen.getByLabelText('Has an outdoor area'))
  expect(picker().queryByRole('checkbox', { name: 'Table 2 (outdoor)' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Save zone' }))
  expect(saveZone).toHaveBeenNthCalledWith(2, 2, { ...input, hasOutside: false, tableNumbers: [3] })
  const diningRoom = await screen.findByRole('button', { name: 'Edit Dining room' })
  await user.click(diningRoom)
  await user.click(screen.getByLabelText('Has an outdoor area'))
  expect(picker().getByRole('checkbox', { name: 'Table 1' })).toBeChecked()
  expect(picker().getByRole('checkbox', { name: 'Table 2 (outdoor)' })).not.toBeChecked()
  expect(picker().queryByRole('checkbox', { name: 'Table 3' })).not.toBeInTheDocument()
})
