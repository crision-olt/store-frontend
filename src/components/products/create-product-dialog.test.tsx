// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '@/test/setup-dom'
import { AppWrapper } from '@/test/utils'
import { createProduct, ProductsApiError, type Product } from '@/lib/products-api'
import { CreateProductDialog } from '@/components/products/create-product-dialog'
import { PendingProducts } from '@/components/products/pending-products'

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

const queryKey = ['products', { search: 'Existing', sortBy: 'price', sortOrder: 'desc' }] as const
const existingProduct: Product = {
  id: 8, name: 'Existing product', sku: 'OLD-1', description: null,
  categoryId: 1, categoryName: 'Kitchen', subcategoryId: null,
  subcategoryName: null, price: 20, stock: 5, created_at: '2026-01-01',
}

const savedProduct = { ...existingProduct, id: 9, name: 'Blue Mug', sku: 'MUG-1', price: 9.99, stock: 0 }

function SavedProducts({ queryFn }: { queryFn: () => Promise<Product[]> }) {
  const { data } = useQuery({ queryKey, queryFn, staleTime: Infinity })
  return <ul aria-label="Saved products">{data?.map((product) => <li key={product.id}>{product.name}</li>)}</ul>
}

function setup(queryFn = async () => [existingProduct]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  client.setQueryData(queryKey, [existingProduct])
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const user = userEvent.setup()
  render(
    <AppWrapper>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/products']}>
          <Routes>
            <Route path="/products" element={<>
              <CreateProductDialog />
              <PendingProducts />
              <SavedProducts queryFn={queryFn} />
            </>} />
            <Route path="/login" element={<p>Sign in again</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </AppWrapper>,
  )
  return { user, invalidate, client, queryKey }
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

it('shows a pending product without changing the cache and keeps it visible through refetch', async () => {
  let finish!: () => void
  vi.mocked(createProduct).mockImplementation(() => new Promise((resolve) => {
    finish = () => resolve(savedProduct)
  }))
  let finishRefetch!: (products: Product[]) => void
  const refetch = vi.fn(() => new Promise<Product[]>((resolve) => { finishRefetch = resolve }))
  const { user, invalidate, client, queryKey } = setup(refetch)
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
  expect(screen.getByRole('button', { name: 'Creating product…' })).toHaveAttribute('aria-disabled', 'true')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(await screen.findByRole('status')).toHaveTextContent('Blue Mug')
  expect(screen.getByRole('status')).toHaveTextContent('MUG-1')
  expect(client.getQueryData(queryKey)).toEqual([existingProduct])
  expect(refetch).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Creating product…' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(createProduct).toHaveBeenCalledOnce()
  await user.keyboard('{Escape}')
  finish()
  await waitFor(() => expect(refetch).toHaveBeenCalledOnce())
  expect(screen.getByRole('status')).toHaveTextContent('Blue Mug')
  expect(screen.getByRole('button', { name: 'Creating product…' })).toHaveAttribute('aria-disabled', 'true')
  finishRefetch([existingProduct, savedProduct])
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  expect(within(screen.getByRole('list', { name: 'Saved products' })).getByText('Blue Mug')).toBeInTheDocument()
  expect(client.getQueryData(queryKey)).toEqual([existingProduct, savedProduct])
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['products'] })
  await waitFor(() => expect(trigger).toHaveFocus())
})

it('clears incompatible subcategories, preserves errors for retry, and resets on cancel', async () => {
  let reject!: (error: Error) => void
  vi.mocked(createProduct).mockImplementationOnce(() => new Promise((_resolve, rejectPromise) => {
    reject = rejectPromise
  }))
  const { user, invalidate, client, queryKey } = setup()
  await user.click(screen.getByRole('button', { name: 'Create product' }))
  await fillRequired(user)
  await user.click(screen.getByRole('combobox', { name: 'Subcategory (optional)' }))
  expect(screen.queryByRole('option', { name: 'Pens' })).not.toBeInTheDocument()
  await user.click(await screen.findByRole('option', { name: 'Mugs' }))
  await user.click(screen.getByRole('combobox', { name: 'Category' }))
  await user.click(await screen.findByRole('option', { name: 'Office' }))
  expect(screen.getByRole('combobox', { name: 'Subcategory (optional)' })).toHaveTextContent('None')
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create product' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Blue Mug')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  reject(new ProductsApiError(409))
  expect(await screen.findByRole('alert')).toHaveTextContent('A product with this SKU already exists.')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Name')).toHaveValue('Blue Mug')
  expect(screen.getByLabelText('SKU')).toHaveValue('MUG-1')
  expect(screen.getByLabelText('Price')).toHaveValue(9.99)
  expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Office')
  expect(client.getQueryData(queryKey)).toEqual([existingProduct])
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['products'] })
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
