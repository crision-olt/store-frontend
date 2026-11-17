import { Trans } from '@lingui/react/macro'
import { useLingui } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { tableFeatureSet } from '@/components/table/features'
import { DateCell, PriceCell, StockCell } from '@/components/products/products-table-cells'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category, Product, Subcategory } from '@/lib/products-api'
import type { StockFilter } from '@/lib/product-filters'

const columnHelper = createColumnHelper<typeof tableFeatureSet, Product>()

type PriceRange = { minPrice: string; maxPrice: string }

function getTextFilterValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function getTextFilterValues(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function getPriceRange(value: unknown): PriceRange {
  if (typeof value !== 'object' || value === null) return { minPrice: '', maxPrice: '' }

  return {
    minPrice: 'minPrice' in value && typeof value.minPrice === 'string' ? value.minPrice : '',
    maxPrice: 'maxPrice' in value && typeof value.maxPrice === 'string' ? value.maxPrice : '',
  }
}


type ProductColumnOptions = {
  categories: Category[]
  subcategories: Subcategory[]
  onCategoryChange: () => void
}

export function useProductColumns({ categories, subcategories, onCategoryChange }: ProductColumnOptions) {
  const { i18n } = useLingui()

  return useMemo(() => columnHelper.columns([
    columnHelper.accessor('name', {
      header: () => <Trans>Name</Trans>,
      cell: ({ cell, row }) => (
        <div className="flex min-w-48 flex-col">
          <span className="font-medium">{cell.getValue()}</span>
          {row.original.description && (
            <span className="line-clamp-1 text-xs text-muted-foreground">{row.original.description}</span>
          )}
        </div>
      ),
      meta: {
        showFilter: true,
        Filter: ({ header, inputRef }) => (
          <Input
            ref={inputRef}
            type="search"
            placeholder={i18n._(msg`Name, SKU or description`)}
            aria-label={i18n._(msg`Search products`)}
            value={getTextFilterValue(header.column.getFilterValue())}
            onChange={(event) => header.column.setFilterValue(event.currentTarget.value || undefined)}
          />
        ),
      },
    }),
    columnHelper.accessor('sku', {
      header: () => <Trans>SKU</Trans>,
      cell: ({ cell }) => <span className="font-mono text-xs">{cell.getValue()}</span>,
    }),
    columnHelper.accessor('categoryName', {
      id: 'category',
      header: () => <Trans>Category</Trans>,
      cell: ({ cell }) => <Badge variant="secondary">{cell.getValue()}</Badge>,
      meta: {
        showFilter: true,
        Filter: ({ header }) => {
          const selected = getTextFilterValues(header.column.getFilterValue())
          const chosen = categories.filter((category) => selected.includes(String(category.id)))
          return (
            <Select
              multiple
              value={selected}
              onValueChange={(values) => {
                header.column.setFilterValue(values.length > 0 ? values : undefined)
                onCategoryChange()
              }}
            >
              <SelectTrigger className="w-full" aria-label={i18n._(msg`Filter by category`)}>
                <SelectValue>
                  {chosen.length === 0
                    ? <span className="text-muted-foreground">{i18n._(msg`All`)}</span>
                    : <span className="flex flex-wrap gap-1">
                        {chosen.map((category) => <Badge key={category.id} variant="secondary">{category.name}</Badge>)}
                      </span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
      },
    }),
    columnHelper.accessor('subcategoryName', {
      id: 'subcategory',
      header: () => <Trans>Subcategory</Trans>,
      cell: ({ cell }) => cell.getValue() ?? <span className="text-muted-foreground">—</span>,
      meta: {
        showFilter: true,
        Filter: ({ header }) => {
          const selected = getTextFilterValues(header.column.getFilterValue())
          const selectedCategories = getTextFilterValues(
            header.column.table.getColumn('category')?.getFilterValue(),
          )
          const availableSubcategories =
            selectedCategories.length === 0
              ? subcategories
              : subcategories.filter((subcategory) => selectedCategories.includes(String(subcategory.categoryId)))
          const chosen = availableSubcategories.filter((subcategory) => selected.includes(String(subcategory.id)))
          const subcategoryLabel = (subcategory: Subcategory) => {
            const category = categories.find((item) => item.id === subcategory.categoryId)
            return selectedCategories.length === 0 && category
              ? `${subcategory.name} (${category.name})`
              : subcategory.name
          }

          return (
            <Select
              multiple
              value={selected}
              onValueChange={(values) => header.column.setFilterValue(values.length > 0 ? values : undefined)}
            >
              <SelectTrigger className="w-full" aria-label={i18n._(msg`Filter by subcategory`)}>
                <SelectValue>
                  {chosen.length === 0
                    ? <span className="text-muted-foreground">{i18n._(msg`All`)}</span>
                    : <span className="flex flex-wrap gap-1">
                        {chosen.map((subcategory) => (
                          <Badge key={subcategory.id} variant="secondary">{subcategoryLabel(subcategory)}</Badge>
                        ))}
                      </span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {availableSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={String(subcategory.id)}>
                    {subcategoryLabel(subcategory)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
      },
    }),
    columnHelper.accessor('price', {
      header: () => <Trans>Price</Trans>,
      cell: ({ cell }) => <PriceCell value={cell.getValue()} />,
      meta: {
        align: 'right',
        showFilter: true,
        Filter: ({ header }) => {
          const range = getPriceRange(header.column.getFilterValue())
          const update = (key: 'minPrice' | 'maxPrice', nextValue: string) => {
            const nextRange = { ...range, [key]: nextValue }
            header.column.setFilterValue(nextRange.minPrice || nextRange.maxPrice ? nextRange : undefined)
          }

          return (
            <div className="flex min-w-0 gap-1">
              <Input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder={i18n._(msg`Min`)}
                aria-label={i18n._(msg`Minimum price`)}
                value={range.minPrice ?? ''}
                onChange={(event) => update('minPrice', event.currentTarget.value)}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder={i18n._(msg`Max`)}
                aria-label={i18n._(msg`Maximum price`)}
                value={range.maxPrice ?? ''}
                onChange={(event) => update('maxPrice', event.currentTarget.value)}
              />
            </div>
          )
        },
      },
    }),
    columnHelper.accessor('stock', {
      header: () => <Trans>Stock</Trans>,
      cell: ({ cell }) => <StockCell value={cell.getValue()} />,
      meta: {
        align: 'right',
        showFilter: true,
        Filter: ({ header }) => {
          const value = header.column.getFilterValue()
          const selected = getTextFilterValues(value).filter(
            (item): item is StockFilter => item === 'in' || item === 'out',
          )
          const labels: Record<StockFilter, string> = {
            in: i18n._(msg`In stock`),
            out: i18n._(msg`Out of stock`),
          }

          return (
            <Select
              multiple
              value={selected}
              onValueChange={(values) => header.column.setFilterValue(values.length > 0 ? values : undefined)}
            >
              <SelectTrigger className="w-full" aria-label={i18n._(msg`Filter by availability`)}>
                <SelectValue>
                  {selected.length === 0 || selected.length === 2
                    ? <span className="text-muted-foreground">{i18n._(msg`All`)}</span>
                    : <span className="flex flex-wrap gap-1">
                        {selected.map((item) => <Badge key={item} variant="secondary">{labels[item]}</Badge>)}
                      </span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="in">{labels.in}</SelectItem>
                <SelectItem value="out">{labels.out}</SelectItem>
              </SelectContent>
            </Select>
          )
        },
      },
    }),
    columnHelper.accessor('created_at', {
      header: () => <Trans>Created</Trans>,
      cell: ({ cell }) => <DateCell value={cell.getValue()} />,
    }),
  ]), [categories, subcategories, onCategoryChange, i18n])
}
