import { Trans } from '@lingui/react/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { DateCell, PriceCell, StockCell } from '@/components/products/products-table-cells'
import { Badge } from '@/components/ui/badge'
import { tableFeatureSet } from '@/components/table/features'
import type { Product } from '@/lib/products-api'

const columnHelper = createColumnHelper<typeof tableFeatureSet, Product>()

export const productColumns = columnHelper.columns([
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
  }),
  columnHelper.accessor('sku', {
    header: () => <Trans>SKU</Trans>,
    cell: ({ cell }) => <span className="font-mono text-xs">{cell.getValue()}</span>,
  }),
  columnHelper.accessor('categoryName', {
    id: 'category',
    header: () => <Trans>Category</Trans>,
    cell: ({ cell }) => <Badge variant="secondary">{cell.getValue()}</Badge>,
  }),
  columnHelper.accessor('subcategoryName', {
    id: 'subcategory',
    header: () => <Trans>Subcategory</Trans>,
    cell: ({ cell }) => cell.getValue() ?? <span className="text-muted-foreground">—</span>,
  }),
  columnHelper.accessor('price', {
    header: () => <Trans>Price</Trans>,
    cell: ({ cell }) => <PriceCell value={cell.getValue()} />,
    meta: { align: 'right' },
  }),
  columnHelper.accessor('stock', {
    header: () => <Trans>Stock</Trans>,
    cell: ({ cell }) => <StockCell value={cell.getValue()} />,
    meta: { align: 'right' },
  }),
  columnHelper.accessor('created_at', {
    header: () => <Trans>Created</Trans>,
    cell: ({ cell }) => <DateCell value={cell.getValue()} />,
  }),
])
