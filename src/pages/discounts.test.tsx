// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import '@/test/setup-dom'
import { AppWrapper } from '@/test/utils'
import { listDiscounts, saveDiscount } from '@/lib/discounts-api'
import { DiscountsPage } from '@/pages/discounts'
import { queryKeys } from '@/lib/query-keys'

vi.mock('@/components/auth/require-auth', () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/hooks/use-session-guard', () => ({ useSessionGuard: vi.fn() }))
vi.mock('@/lib/access-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/access-api')>(),
  listRoles: vi.fn().mockResolvedValue([
    { id: 1, name: 'Admin', permissions: [] },
    { id: 2, name: 'Cashier', permissions: [] },
  ]),
}))
vi.mock('@/lib/discounts-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/discounts-api')>(),
  listDiscounts: vi.fn(),
  saveDiscount: vi.fn(),
}))

test('creates an invoice-wide discount and requires an eligible role', async () => {
  const discount = {
    id: 1, name: 'Staff discount', nameEs: 'Descuento para el personal',
    kind: 'percentage' as const, amount: 10, roleIds: [2],
  }
  vi.mocked(listDiscounts).mockReset().mockResolvedValue([])
  vi.mocked(saveDiscount).mockReset().mockResolvedValue(discount)
  const user = userEvent.setup()
  const client = new QueryClient()
  render(
    <AppWrapper>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/discounts']}><DiscountsPage /></MemoryRouter>
      </QueryClientProvider>
    </AppWrapper>,
  )

  await user.type(await screen.findByLabelText('Name (English)'), discount.name)
  expect(screen.getByText('Discounts can be configured here, but applying them to invoices is not available yet.')).toBeTruthy()
  await user.type(screen.getByLabelText('Name (Spanish)'), discount.nameEs)
  await user.type(screen.getByLabelText('Discount (%)'), '10')
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Create discount' }).disabled).toBe(true)
  await user.click(screen.getByRole('checkbox', { name: 'Cashier' }))
  expect(screen.queryByText(/eligible products/i)).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Create discount' }))

  expect(saveDiscount).toHaveBeenCalledWith({
    name: discount.name,
    nameEs: discount.nameEs,
    kind: 'percentage',
    amount: 10,
    roleIds: [2],
  }, undefined)
  expect(client.getQueryCache().getAll().map(({ queryKey }) => queryKey)).toEqual(
    expect.arrayContaining([queryKeys.discounts, queryKeys.roles]),
  )
})

test('creates a fixed-amount invoice discount', async () => {
  const discount = {
    id: 2, name: 'Courtesy credit', nameEs: 'Crédito de cortesía',
    kind: 'fixed_amount' as const, amount: 5, roleIds: [1],
  }
  vi.mocked(listDiscounts).mockReset().mockResolvedValue([])
  vi.mocked(saveDiscount).mockReset().mockResolvedValue(discount)
  const user = userEvent.setup()
  render(
    <AppWrapper>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/discounts']}><DiscountsPage /></MemoryRouter>
      </QueryClientProvider>
    </AppWrapper>,
  )

  await user.click(await screen.findByRole('combobox', { name: 'Discount type' }))
  await user.click(await screen.findByRole('option', { name: 'Fixed amount' }))
  await user.type(screen.getByLabelText('Name (English)'), discount.name)
  await user.type(screen.getByLabelText('Name (Spanish)'), discount.nameEs)
  await user.type(screen.getByLabelText('Discount amount (€)'), '5')
  await user.click(screen.getByRole('checkbox', { name: 'Admin' }))
  await user.click(screen.getByRole('button', { name: 'Create discount' }))

  expect(saveDiscount).toHaveBeenCalledWith({
    name: discount.name,
    nameEs: discount.nameEs,
    kind: 'fixed_amount',
    amount: 5,
    roleIds: [1],
  }, undefined)
})
