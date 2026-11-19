// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import '@/test/setup-dom'
import { AppWrapper } from '@/test/utils'
import { listOffers, saveOffer } from '@/lib/offers-api'
import { OffersPage } from '@/pages/offers'

vi.mock('@/components/auth/require-auth', () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/hooks/use-session-guard', () => ({ useSessionGuard: vi.fn() }))
vi.mock('@/lib/products-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/products-api')>(),
  listAllProducts: vi.fn().mockResolvedValue([
    { id: 1, name: 'Main', nameEs: 'Principal', sku: 'MAIN', price: 10 },
    { id: 2, name: 'Drink', nameEs: 'Bebida', sku: 'DRINK', price: 4 },
    ...Array.from({ length: 6 }, (_, index) => ({
      id: index + 3, name: `Coffee ${index + 1}`, nameEs: `Café ${index + 1}`,
      sku: `COFFEE-${index + 1}`, price: 3,
    })),
  ]),
}))
vi.mock('@/lib/offers-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/offers-api')>(),
  listOffers: vi.fn(),
  saveOffer: vi.fn(),
}))

test('creates a menu, then edits it into a promotion with a discounted total', async () => {
  const menu = { id: 1, name: 'Lunch deal', nameEs: 'Oferta de almuerzo', kind: 'menu' as const, amount: 12, productIds: [1, 2] }
  const promotion = { ...menu, kind: 'promotion' as const, amount: 10 }
  vi.mocked(listOffers).mockResolvedValueOnce([]).mockResolvedValueOnce([menu]).mockResolvedValue([promotion])
  vi.mocked(saveOffer).mockResolvedValueOnce(menu).mockResolvedValueOnce(promotion)
  const user = userEvent.setup()
  render(
    <AppWrapper>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/offers']}><OffersPage /></MemoryRouter>
      </QueryClientProvider>
    </AppWrapper>,
  )

  await user.type(await screen.findByLabelText('Name (English)'), 'Lunch deal')
  await user.type(screen.getByLabelText('Name (Spanish)'), 'Oferta de almuerzo')
  await user.click(screen.getByRole('checkbox', { name: /Main/ }))
  await user.click(screen.getByRole('checkbox', { name: /Drink/ }))
  await user.type(screen.getByLabelText('Fixed price (€)'), '12')
  expect(screen.getByText('Bundle total: €12.00')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Create offer' }))
  expect(saveOffer).toHaveBeenNthCalledWith(1, {
    name: 'Lunch deal', nameEs: 'Oferta de almuerzo', kind: 'menu', amount: 12, productIds: [1, 2],
  }, undefined)

  await user.click(await screen.findByRole('button', { name: 'Edit Lunch deal' }))
  expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(2)
  await user.click(screen.getByRole('combobox', { name: 'Offer type' }))
  await user.click(await screen.findByRole('option', { name: 'Promotion' }))
  await user.type(screen.getByLabelText('Discount (%)'), '10')
  expect(screen.getByText('Bundle total: €12.60')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(saveOffer).toHaveBeenNthCalledWith(2, {
    name: 'Lunch deal', nameEs: 'Oferta de almuerzo', kind: 'promotion', amount: 10, productIds: [1, 2],
  }, 1)
  await screen.findByText('Promotion · 10%')
})

test('requires a valid minimum and saves any four of six different eligible coffees', async () => {
  const existing = {
    id: 2, name: 'Coffee for the table', nameEs: 'Café para la mesa',
    kind: 'promotion' as const, amount: 10, productIds: [3, 4, 5, 6, 7, 8],
  }
  const saved = { ...existing, minimumDistinctProducts: 4 }
  vi.mocked(listOffers).mockReset().mockResolvedValueOnce([existing]).mockResolvedValue([saved])
  vi.mocked(saveOffer).mockReset().mockResolvedValue(saved)
  const user = userEvent.setup()
  render(
    <AppWrapper>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/offers']}><OffersPage /></MemoryRouter>
      </QueryClientProvider>
    </AppWrapper>,
  )

  await user.click(await screen.findByRole('button', { name: 'Edit Coffee for the table' }))
  const minimum = screen.getByLabelText('Minimum different products (optional)')
  await user.type(minimum, '7')
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Save' }).disabled).toBe(true)
  await user.clear(minimum)
  await user.type(minimum, '4')
  screen.getByText('Qualifies with any 4 different products from the selected list.')
  expect(screen.queryByText(/Bundle total/)).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(saveOffer).toHaveBeenCalledWith({
    name: existing.name, nameEs: existing.nameEs, kind: 'promotion',
    amount: 10, productIds: existing.productIds, minimumDistinctProducts: 4,
  }, 2))
  await screen.findByText('Any 4 different eligible products')
  await user.click(screen.getByRole('button', { name: 'Edit Coffee for the table' }))
  expect(screen.getByLabelText<HTMLInputElement>('Minimum different products (optional)').value).toBe('4')
})
