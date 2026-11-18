// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '@/test/setup-dom'
import { AppWrapper } from '@/test/utils'
import { archiveProduct, createProduct, ProductsApiError, type Product } from '@/lib/products-api'
import { CreateProductDialog } from '@/components/products/create-product-dialog'
import { ProductsTable } from '@/components/products/products-table'
import { defineBoundingClientRect, defineClientDimensions } from '@/test/dom'

defineBoundingClientRect()
defineClientDimensions()

vi.mock('@/lib/allergens-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/allergens-api')>(),
  listAllergens: vi.fn().mockResolvedValue([
    { id: 3, code: 'eggs', name: 'Eggs', nameEs: 'Huevos' },
    { id: 7, code: 'milk', name: 'Milk', nameEs: 'Leche' },
  ]),
}))

vi.mock('@/lib/products-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/products-api')>(),
  createProduct: vi.fn(),
  archiveProduct: vi.fn(),
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
  subcategoryName: null, price: 20, allergenIds: [], created_at: '2026-01-01',
}

const savedProduct = { ...existingProduct, id: 9, name: 'Blue Mug', sku: 'MUG-1', price: 9.99 }

function SavedProducts({ queryFn }: { queryFn: () => Promise<Product[]> }) {
  const { data, isPending, isFetching } = useQuery({ queryKey, queryFn, staleTime: Infinity })
  return <ProductsTable products={data} isLoading={isPending} isFetching={isFetching}
    sorting={[{ id: 'price', desc: true }]} onSortingChange={() => {}}
    columnFilters={[{ id: 'name', value: 'Existing' }]} onColumnFiltersChange={() => {}}
    categories={[{ id: 1, name: 'Kitchen' }, { id: 3, name: 'Office' }]}
    subcategories={[{ id: 2, name: 'Mugs', categoryId: 1 }, { id: 4, name: 'Pens', categoryId: 3 }]}
    onCategoryChange={() => {}} />
}

function setup(queryFn = async () => [existingProduct], initialProducts: Product[] | null = [existingProduct]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  if (initialProducts !== null) client.setQueryData(queryKey, initialProducts)
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const user = userEvent.setup()
  render(
    <AppWrapper>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/products']}>
          <Routes>
            <Route path="/products" element={<>
              <CreateProductDialog />
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
  vi.mocked(archiveProduct).mockReset()
})

it('shows a pending product inside the table without changing the cache and keeps it through refetch', async () => {
  let finish!: () => void
  vi.mocked(createProduct).mockImplementation(() => new Promise((resolve) => {
    finish = () => resolve(savedProduct)
  }))
  let finishRefetch!: (products: Product[]) => void
  const refetch = vi.fn(() => new Promise<Product[]>((resolve) => { finishRefetch = resolve }))
  const { user, invalidate, client, queryKey } = setup(refetch)
  const trigger = screen.getByRole('button', { name: 'Create product' })
  expect(screen.queryByRole('dialog', { name: 'Create product' })).not.toBeInTheDocument()
  await user.click(trigger)
  await fillRequired(user)
  await user.click(screen.getByRole('combobox', { name: 'Allergens (optional)' }))
  await user.click(await screen.findByRole('option', { name: 'Eggs' }))
  await user.click(screen.getByRole('option', { name: 'Milk' }))
  await user.keyboard('{Escape}')
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create product' }))

  expect(createProduct).toHaveBeenCalledOnce()
  expect(vi.mocked(createProduct).mock.calls[0][0]).toEqual({
    name: 'Blue Mug', sku: 'MUG-1', description: null,
    categoryId: 1, subcategoryId: null, price: 9.99, allergenIds: [3, 7],
  })
  expect(screen.getByRole('button', { name: 'Creating product…' })).toHaveAttribute('aria-disabled', 'true')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  const table = screen.getByRole('table')
  const pendingRow = await within(table).findByRole('row', { name: /Blue Mug/ })
  expect(within(table).getAllByRole('row')[1]).toBe(pendingRow)
  expect(within(pendingRow).getByRole('status')).toHaveTextContent('Creating product…')
  expect(within(pendingRow).getByRole('cell', { name: 'MUG-1' })).toBeInTheDocument()
  expect(within(pendingRow).getByRole('cell', { name: 'Kitchen' })).toBeInTheDocument()
  expect(within(pendingRow).getByRole('cell', { name: '€9.99' })).toBeInTheDocument()
  expect(within(pendingRow).getByRole('button', { name: 'Edit product Blue Mug' })).toBeDisabled()
  expect(within(pendingRow).getByRole('button', { name: 'Archive product Blue Mug' })).toBeDisabled()
  expect(client.getQueryData(queryKey)).toEqual([existingProduct])
  expect(refetch).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Creating product…' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(createProduct).toHaveBeenCalledOnce()
  await user.keyboard('{Escape}')
  finish()
  await waitFor(() => expect(refetch).toHaveBeenCalledOnce())
  expect(within(table).getByRole('row', { name: /Blue Mug/ })).toContainElement(within(table).getByRole('status'))
  expect(screen.getByRole('button', { name: 'Creating product…' })).toHaveAttribute('aria-disabled', 'true')
  finishRefetch([existingProduct, savedProduct])
  await waitFor(() => expect(within(table).queryByRole('status')).not.toBeInTheDocument())
  expect(within(table).getAllByRole('row', { name: /Blue Mug/ })).toHaveLength(1)
  expect(within(table).getByRole('button', { name: 'Edit product Blue Mug' })).toBeEnabled()
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
  const table = screen.getByRole('table')
  expect(await within(table).findByRole('row', { name: /Blue Mug/ })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  reject(new ProductsApiError(409))
  expect(await screen.findByRole('alert')).toHaveTextContent('A product with this SKU already exists.')
  expect(within(table).queryByRole('status', { hidden: true })).not.toBeInTheDocument()
  expect(within(table).queryByText('Blue Mug')).not.toBeInTheDocument()
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

it('keeps the pending row visible while the initial catalog is still loading', async () => {
  let finishInitial!: (products: Product[]) => void
  const queryFn = vi.fn()
    .mockImplementationOnce(() => new Promise<Product[]>((resolve) => { finishInitial = resolve }))
    .mockResolvedValue([existingProduct])
  let reject!: (error: Error) => void
  vi.mocked(createProduct).mockImplementationOnce(() => new Promise((_resolve, rejectPromise) => {
    reject = rejectPromise
  }))
  const { user, client, queryKey } = setup(queryFn, null)
  await user.click(screen.getByRole('button', { name: 'Create product' }))
  await fillRequired(user)
  await user.click(within(screen.getByRole('dialog', { name: 'Create product' })).getByRole('button', { name: 'Create product' }))
  const table = screen.getByRole('table')
  expect(await within(table).findByRole('row', { name: /Blue Mug/ })).toBeVisible()
  expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
  expect(client.getQueryData(queryKey)).toBeUndefined()
  finishInitial([existingProduct])
  await waitFor(() => expect(within(table).getByText('Existing product')).toBeInTheDocument())
  reject(new ProductsApiError(409))
  expect(await screen.findByRole('alert')).toHaveTextContent('A product with this SKU already exists.')
  expect(within(table).queryByText('Blue Mug')).not.toBeInTheDocument()
})

it('confirms archiving and removes the row only after the request and catalog refresh finish', async () => {
  let finish!: () => void
  vi.mocked(archiveProduct).mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve }))
  let finishRefetch!: (products: Product[]) => void
  const refetch = vi.fn(() => new Promise<Product[]>((resolve) => { finishRefetch = resolve }))
  const { user, client, queryKey } = setup(refetch)
  const table = screen.getByRole('table')
  await user.click(screen.getByRole('button', { name: 'Archive product Existing product' }))
  let dialog = screen.getByRole('dialog', { name: 'Archive product' })
  expect(dialog).toHaveTextContent('Existing product')
  expect(dialog).toHaveTextContent('its data will be kept')
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  expect(archiveProduct).not.toHaveBeenCalled()
  expect(within(table).getByText('Existing product')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Archive product Existing product' }))
  dialog = screen.getByRole('dialog', { name: 'Archive product' })
  await user.click(within(dialog).getByRole('button', { name: 'Archive' }))
  expect(archiveProduct).toHaveBeenCalledExactlyOnceWith(8)
  expect(within(dialog).getByRole('button', { name: 'Archiving…' })).toBeDisabled()
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
  await user.keyboard('{Escape}')
  expect(dialog).toBeInTheDocument()
  expect(client.getQueryData(queryKey)).toEqual([existingProduct])
  finish()
  await waitFor(() => expect(refetch).toHaveBeenCalledOnce())
  expect(dialog).toBeInTheDocument()
  expect(within(table).getByText('Existing product')).toBeInTheDocument()
  finishRefetch([])
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Archive product' })).not.toBeInTheDocument())
  expect(within(table).queryByText('Existing product')).not.toBeInTheDocument()
  expect(client.getQueryData(queryKey)).toEqual([])
})

it.each([
  [500, 'Could not archive the product. Please try again.'],
  [404, 'This product no longer exists.'],
])('keeps the product and allows retry after an archive HTTP %s error', async (status, message) => {
  vi.mocked(archiveProduct).mockRejectedValueOnce(new ProductsApiError(status)).mockResolvedValueOnce(undefined)
  const { user, client, queryKey } = setup(async () => [])
  const table = screen.getByRole('table')
  await user.click(screen.getByRole('button', { name: 'Archive product Existing product' }))
  const dialog = screen.getByRole('dialog', { name: 'Archive product' })
  await user.click(within(dialog).getByRole('button', { name: 'Archive' }))
  expect(await within(dialog).findByRole('alert')).toHaveTextContent(message)
  expect(within(table).getByText('Existing product')).toBeInTheDocument()
  expect(client.getQueryData(queryKey)).toEqual([existingProduct])
  await user.click(within(dialog).getByRole('button', { name: 'Archive' }))
  await waitFor(() => expect(dialog).not.toBeInTheDocument())
  expect(archiveProduct).toHaveBeenCalledTimes(2)
  expect(within(table).queryByText('Existing product')).not.toBeInTheDocument()
})

it('redirects expired sessions when archiving without changing the catalog cache', async () => {
  vi.mocked(archiveProduct).mockRejectedValueOnce(new ProductsApiError(401))
  const { user, client, queryKey } = setup()
  await user.click(screen.getByRole('button', { name: 'Archive product Existing product' }))
  await user.click(within(screen.getByRole('dialog', { name: 'Archive product' })).getByRole('button', { name: 'Archive' }))
  expect(await screen.findByText('Sign in again')).toBeInTheDocument()
  expect(client.getQueryData(queryKey)).toEqual([existingProduct])
})
