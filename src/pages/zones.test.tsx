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
  const existing = { id: 1, name: 'Dining room', hasOutside: false, tableNumbers: [1], isBase: true }
  const input = { name: 'Gallery', hasOutside: true, tableNumbers: [2, 3], isBase: true }
  let zones = [existing]
  vi.mocked(listZones).mockImplementation(async () => zones)
  vi.mocked(listTables).mockResolvedValue([1, 2, 3].map((number) => ({
    number, capacity: 2, isOutside: number === 2, isAccessible: number === 3,
  })))
  vi.mocked(saveZone).mockImplementation(async (id, values) => {
    const saved = { id: id ?? 2, ...values }
    zones = [...zones.filter((zone) => zone.id !== saved.id)
      .map((zone) => saved.isBase ? { ...zone, isBase: false } : zone), saved]
    return saved
  })
  const user = userEvent.setup()
  render(<AppWrapper><QueryClientProvider client={new QueryClient()}><MemoryRouter>
    <ZonesPage />
  </MemoryRouter></QueryClientProvider></AppWrapper>)

  await user.click(await screen.findByRole('button', { name: 'Create zone' }))
  expect(screen.getByText('Saving this zone as the base will replace Dining room.')).toBeVisible()
  await user.click(screen.getByRole('checkbox', { name: 'Base zone' }))
  const trigger = () => screen.getByRole('combobox', { name: 'Tables' })
  const picker = () => within(screen.getByRole('listbox'))
  const openPicker = async () => {
    trigger().focus()
    await user.keyboard('{ArrowDown}')
    await screen.findByRole('listbox')
  }
  await openPicker()
  expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true')
  expect(picker().queryByRole('option', { name: 'Table 1' })).not.toBeInTheDocument()
  expect(picker().queryByRole('option', { name: 'Table 2, Outdoor' })).not.toBeInTheDocument()
  await user.keyboard('{Escape}')
  await user.type(screen.getByLabelText('Zone name'), 'Gallery')
  await user.click(screen.getByLabelText('Has an outdoor area'))
  await openPicker()
  const outdoor = picker().getByRole('option', { name: 'Table 2, Outdoor' })
  const accessible = picker().getByRole('option', { name: 'Table 3, Accessible' })
  expect(within(outdoor).getByTitle('Outdoor')).toBeVisible()
  expect(within(accessible).getByTitle('Accessible')).toBeVisible()
  await user.click(outdoor)
  await user.click(accessible)
  await user.keyboard('{Escape}')
  await user.click(screen.getByRole('button', { name: 'Save zone' }))
  const editGallery = await screen.findByRole('button', { name: 'Edit Gallery' })
  expect(screen.getAllByText('Base zone')).toHaveLength(1)
  await user.click(editGallery)
  expect(screen.getByRole('checkbox', { name: 'Base zone' })).toBeChecked()
  expect(saveZone).toHaveBeenNthCalledWith(1, undefined, input)
  await openPicker()
  expect(picker().getByRole('option', { name: 'Table 2, Outdoor', selected: true })).toBeInTheDocument()
  expect(picker().getByRole('option', { name: 'Table 3, Accessible', selected: true })).toBeInTheDocument()
  await user.keyboard('{Escape}')
  await user.click(screen.getByLabelText('Has an outdoor area'))
  await openPicker()
  expect(picker().queryByRole('option', { name: 'Table 2, Outdoor' })).not.toBeInTheDocument()
  await user.keyboard('{Escape}')
  await user.click(screen.getByRole('button', { name: 'Save zone' }))
  expect(saveZone).toHaveBeenNthCalledWith(2, 2, { ...input, hasOutside: false, tableNumbers: [3] })
  const diningRoom = await screen.findByRole('button', { name: 'Edit Dining room' })
  await user.click(diningRoom)
  expect(screen.getByRole('checkbox', { name: 'Base zone' })).not.toBeChecked()
  await user.click(screen.getByLabelText('Has an outdoor area'))
  await openPicker()
  expect(picker().getByRole('option', { name: 'Table 1', selected: true })).toBeInTheDocument()
  expect(picker().getByRole('option', { name: 'Table 2, Outdoor', selected: false })).toBeInTheDocument()
  expect(picker().queryByRole('option', { name: 'Table 3, Accessible' })).not.toBeInTheDocument()
})
