import { useLingui } from '@lingui/react/macro'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table'
import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { ProductsTable } from '@/components/products/products-table'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import {
  columnFiltersToProductFilters,
  hasActiveFilters,
  hasInvalidPriceRange,
  toProductsQuery,
} from '@/lib/product-filters'
import {
  listCategories,
  listAllProducts,
  listSubcategories,
  ProductsApiError,
  type ProductsQuery,
  type SortableColumn,
} from '@/lib/products-api'
import { buildLinkWithRedirect } from '@/lib/redirect'

const SEARCH_DEBOUNCE_MS = 300

function ProductsContent() {
  const { t } = useLingui()
  const location = useLocation()

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])

  const filters = columnFiltersToProductFilters(columnFilters)
  const appliedFilters = useDebouncedValue(filters, SEARCH_DEBOUNCE_MS)
  const sort = sorting[0]
  const query: Omit<ProductsQuery, 'page' | 'pageSize'> = {
    ...toProductsQuery(appliedFilters),
    sortBy: sort?.id as SortableColumn | undefined,
    sortOrder: sort?.desc ? 'desc' : 'asc',
  }

  const products = useQuery({
    queryKey: ['products', query],
    queryFn: ({ signal }) => listAllProducts(query, signal),
    placeholderData: keepPreviousData,
    retry: false,
    enabled: !hasInvalidPriceRange(appliedFilters),
  })
  const categories = useQuery({
    queryKey: ['product-categories'],
    queryFn: listCategories,
    retry: false,
  })
  const subcategories = useQuery({
    queryKey: ['product-subcategories', filters.category],
    queryFn: () => listSubcategories(filters.category || undefined),
    retry: false,
  })
  const clearFilters = () => setColumnFilters([])
  const clearSubcategoryFilter = () =>
    setColumnFilters((current) => current.filter((filter) => filter.id !== 'subcategory'))

  if (products.error instanceof ProductsApiError && products.error.status === 401) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t`Products`}</h1>
          <p className="text-sm text-muted-foreground">{t`Browse and filter the product catalog.`}</p>
        </div>

        {(categories.isError || subcategories.isError) && (
          <p role="alert" className="text-sm text-destructive">{t`Could not load categories. Please try again.`}</p>
        )}

        {hasInvalidPriceRange(filters) && (
          <p role="alert" className="text-sm text-destructive">
            {t`Enter a valid price range: the minimum cannot exceed the maximum.`}
          </p>
        )}

        {products.isError && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <span>{t`Could not load products. Please try again.`}</span>
            <Button variant="outline" size="sm" onClick={() => products.refetch()}>
              {t`Try again`}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" disabled={!hasActiveFilters(filters)} onClick={clearFilters}>
              {t`Clear filters`}
            </Button>
          </div>
          <ProductsTable
            products={products.data}
            isLoading={products.isPending && !products.isError}
            isFetching={products.isFetching}
            sorting={sorting}
            onSortingChange={setSorting}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            categories={categories.data ?? []}
            subcategories={subcategories.data ?? []}
            onCategoryChange={clearSubcategoryFilter}
          />
        </div>
    </div>
  )
}

export function ProductsPage() {
  return (
    <RequireAuth>
      <StoreLayout><ProductsContent /></StoreLayout>
    </RequireAuth>
  )
}
