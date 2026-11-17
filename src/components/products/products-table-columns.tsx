import { Trans } from '@lingui/react/macro'
import { useLingui } from '@lingui/react/macro'
import { createColumnHelper } from '@tanstack/react-table'
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

const columnHelper = createColumnHelper<typeof tableFeatureSet, Product>()
const ALL = '__all__'

type PriceRange = { minPrice: string; maxPrice: string }

function getTextFilterValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
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
  const { t } = useLingui()

  return columnHelper.columns([
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
            placeholder={t`Name, SKU or description`}
            aria-label={t`Search products`}
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
          const value = getTextFilterValue(header.column.getFilterValue())
          return (
            <Select
              value={value || ALL}
              onValueChange={(nextValue) => {
                header.column.setFilterValue(nextValue === ALL || nextValue === null ? undefined : nextValue)
                onCategoryChange()
              }}
            >
              <SelectTrigger className="w-full" aria-label={t`Filter by category`}>
                <SelectValue>{categories.find((category) => String(category.id) === value)?.name ?? t`All`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t`All`}</SelectItem>
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
          const value = getTextFilterValue(header.column.getFilterValue())
          const selectedSubcategory = subcategories.find((subcategory) => String(subcategory.id) === value)
          const subcategoryLabel = (subcategory: Subcategory) => {
            const category = categories.find((item) => item.id === subcategory.categoryId)
            const categoryFilter = header.column.table.getColumn('category')?.getFilterValue()
            return !categoryFilter && category ? `${subcategory.name} (${category.name})` : subcategory.name
          }

          return (
            <Select
              value={value || ALL}
              onValueChange={(nextValue) =>
                header.column.setFilterValue(nextValue === ALL || nextValue === null ? undefined : nextValue)
              }
            >
              <SelectTrigger className="w-full" aria-label={t`Filter by subcategory`}>
                <SelectValue>{selectedSubcategory ? subcategoryLabel(selectedSubcategory) : t`All`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t`All`}</SelectItem>
                {subcategories.map((subcategory) => (
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
                placeholder={t`Min`}
                aria-label={t`Minimum price`}
                value={range.minPrice ?? ''}
                onChange={(event) => update('minPrice', event.currentTarget.value)}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder={t`Max`}
                aria-label={t`Maximum price`}
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
          const stock = value === 'in' || value === 'out' ? value : 'all'
          const labels = {
            all: t`All`,
            in: t`In stock`,
            out: t`Out of stock`,
          }

          return (
            <Select
              value={stock}
              onValueChange={(nextValue) => header.column.setFilterValue(nextValue === 'all' ? undefined : nextValue)}
            >
              <SelectTrigger className="w-full" aria-label={t`Filter by availability`}>
                <SelectValue>{labels[stock]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.all}</SelectItem>
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
  ])
}
