// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import '@/test/setup-dom'
import { AppWrapper } from '@/test/utils'
import {
  createCategory, createSubcategory, listCategories, listSubcategories,
} from '@/lib/products-api'
import { CategoriesPage } from '@/pages/categories'

vi.mock('@/components/auth/require-auth', () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/hooks/use-session-guard', () => ({ useSessionGuard: vi.fn() }))
vi.mock('@/lib/products-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/products-api')>(),
  createCategory: vi.fn(),
  createSubcategory: vi.fn(),
  listCategories: vi.fn().mockResolvedValue([{ id: 1, name: 'Kitchen', nameEs: 'Cocina' }]),
  listSubcategories: vi.fn().mockResolvedValue([]),
}))

test('creates categories and subcategories with both language names', async () => {
  vi.mocked(createCategory).mockResolvedValue({ id: 2, name: 'Office', nameEs: 'Oficina' })
  vi.mocked(createSubcategory).mockResolvedValue({ id: 3, name: 'Mugs', nameEs: 'Tazas', categoryId: 1 })
  const user = userEvent.setup()
  render(
    <AppWrapper>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/categories']}><CategoriesPage /></MemoryRouter>
      </QueryClientProvider>
    </AppWrapper>,
  )

  await user.type(await screen.findByLabelText('Category name (English)'), 'Office')
  await user.type(screen.getByLabelText('Category name (Spanish)'), 'Oficina')
  await user.click(screen.getByRole('button', { name: 'Create category' }))
  expect(createCategory).toHaveBeenCalledWith({ name: 'Office', nameEs: 'Oficina' })

  await user.click(screen.getByRole('combobox', { name: 'Category' }))
  await user.click(await screen.findByRole('option', { name: 'Kitchen' }))
  await user.type(screen.getByLabelText('Subcategory name (English)'), 'Mugs')
  await user.type(screen.getByLabelText('Subcategory name (Spanish)'), 'Tazas')
  await user.click(screen.getByRole('button', { name: 'Create subcategory' }))
  expect(createSubcategory).toHaveBeenCalledWith({ name: 'Mugs', nameEs: 'Tazas', categoryId: 1 })
  expect(listCategories).toHaveBeenCalled()
  expect(listSubcategories).toHaveBeenCalled()
})
