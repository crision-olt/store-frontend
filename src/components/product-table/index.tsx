import type { CellData, RowData, TableFeatures } from '@tanstack/react-table'
import type { CSSProperties, FC } from 'react'
import type { ProductTableProps } from '@/components/product-table/components/product-table-container'
import { ProductTableContainer } from '@/components/product-table/components/product-table-container'
import type { FilterComponentProps } from '@/components/product-table/filters'
import { ProductTableProvider } from '@/components/product-table/providers/product-table-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TFeatures extends TableFeatures, TData extends RowData, TValue extends CellData = CellData> {
    // Optional property for text alignment, applies to header, row and footer column cells
    align?: 'center' | 'left' | 'right'
    // Optional property for line clamping (only header and footer cells)
    lineClamp?: 1 | 2
    // Optional property to enable header tooltip when text is truncated (only header cells) (true by default)
    enableHeaderTooltip?: boolean
    // Optional property to enable cell tooltip when text is truncated (only row cells) (false by default)
    enableCellTooltip?: boolean
    // Optional property for text ellipsis (only row cells)
    textEllipsis?: boolean
    // Optional property for width in px or %, e.g., "10%", "100px"...
    width?: string
    // Optional property for custom styles, can be used to set minWidth, maxWidth, etc.
    style?: CSSProperties
    // Optional property for custom class names, can be used to set specific styles for a column
    className?: string
    // Optional property to show filter (only header cells)
    showFilter?: boolean
    // Optional property to set a custom filter component (only header cells)
    Filter?: FC<FilterComponentProps<TData, TValue>>
    // Optional property to set a custom testId for testing purposes (applies to header, row and footer column cells)
    testId?: string
  }
}

export const ProductTable = <T extends RowData>(props: ProductTableProps<T>) => (
  <TooltipProvider>
    <ProductTableProvider>
      <ProductTableContainer<T> {...props} />
    </ProductTableProvider>
  </TooltipProvider>
)
