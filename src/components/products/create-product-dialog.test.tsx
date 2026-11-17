// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '@/test/setup-dom'
import { AppWrapper } from '@/test/utils'
import { createProduct, ProductsApiError } from '@/lib/products-api'
import { CreateProductDialog } from '@/components/products/create-product-dialog'

vi.mock('@/lib/products-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/products-api')>(),
  createProduct: vi.fn(),
  listCategories: vi.fn().mockResolvedValue([
    { id: 1, name: 'Kitchen' }, { id: 3, name: 'Office' },
  ]),
  listSubcategories: vi.fn().mockResolvedValue([
    { id: 2, name: 'Mugs', categoryId: 1 }, { id: 4, name: 'Pens', categoryId: 3 },
  ]),
}))

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const user = userEvent.setup()
  render(
    <AppWrapper>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/products']}>
          <Routes>
            <Route path="/products" element={<CreateProductDialog />} />
            <Route path="/login" element={<p>Sign in again</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </AppWrapper>,
  )
  return { user, invalidate }
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), ' Blue Mug ')
  await user.type(screen.getByLabelText('SKU'), ' MUG-1 ')
  await user.type(screen.getByLabelText('Price'), '9.99')
  await user.click(screen.getByRole('combobox', { name: 'Category' }))
  await user.click(await screen.findByRole('option', { name: 'Kitchen' }))
}

beforeEach(() => {
  vi.mocked(createProduct).mockReset()
})

it('creates from the dialog, prevents duplicate submissions, and refreshes products', async () => {
  let finish!: () => void
  vi.mocked(createProduct).mockImplementation(() => new Promise((resolve) => {
    finish = () => resolve({
      id: 1, name: 'Blue Mug', sku: 'MUG-1', description: null,
      categoryId: 1, categoryName: 'Kitchen', subcategoryId: null,
      subcategoryName: null, price: 9.99, stock: 0, created_at: '2026-01-01',
    })
  }))
  const { user, invalidate } = setup()
  const trigger = screen.getByRole('button', { name: 'Create product' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await user.click(trigger)
  await fillRequired(user)
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create product' }))

  expect(createProduct).toHaveBeenCalledOnce()
  expect(vi.mocked(createProduct).mock.calls[0][0]).toEqual({
    name: 'Blue Mug', sku: 'MUG-1', description: null,
    categoryId: 1, subcategoryId: null, price: 9.99, stock: 0,
  })
  expect(screen.getByRole('button', { name: 'Creating product…' })).toBeDisabled()
  await user.keyboard('{Escape}')
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  finish()
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['products'] })
  await waitFor(() => expect(trigger).toHaveFocus())
})

it('clears incompatible subcategories, preserves errors for retry, and resets on cancel', async () => {
  vi.mocked(createProduct).mockRejectedValueOnce(new ProductsApiError(409))
  const { user, invalidate } = setup()
  await user.click(screen.getByRole('button', { name: 'Create product' }))
  await fillRequired(user)
  await user.click(screen.getByRole('combobox', { name: 'Subcategory (optional)' }))
  expect(screen.queryByRole('option', { name: 'Pens' })).not.toBeInTheDocument()
  await user.click(await screen.findByRole('option', { name: 'Mugs' }))
  await user.click(screen.getByRole('combobox', { name: 'Category' }))
  await user.click(await screen.findByRole('option', { name: 'Office' }))
  expect(screen.getByRole('combobox', { name: 'Subcategory (optional)' })).toHaveTextContent('None')
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create product' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('A product with this SKU already exists.')
  expect(screen.getByLabelText('Name')).toHaveValue(' Blue Mug ')
  expect(invalidate).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  await user.click(screen.getByRole('button', { name: 'Create product' }))
  expect(screen.getByLabelText('Name')).toHaveValue('')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('uses native constraints to reject invalid values before posting and redirects expired sessions', async () => {
  vi.mocked(createProduct).mockRejectedValueOnce(new ProductsApiError(401))
  const { user } = setup()
  await user.click(screen.getByRole('button', { name: 'Create product' }))
  await fillRequired(user)
  const price = screen.getByLabelText('Price')
  fireEvent.change(price, { target: { value: '-1' } })
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create product' }))
  expect(createProduct).not.toHaveBeenCalled()
  fireEvent.change(price, { target: { value: '0' } })
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create product' }))
  expect(await screen.findByText('Sign in again')).toBeInTheDocument()
})
