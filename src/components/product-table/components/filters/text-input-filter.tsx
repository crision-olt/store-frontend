import type { RowData } from '@tanstack/react-table'
import type { ChangeEvent } from 'react'
import type { FilterComponentProps } from '@/components/product-table/filters'
import { Input } from '@/components/ui/input'

export const TextInputFilter = <TData extends RowData>({
  inputRef,
  header,
  onChange,
}: FilterComponentProps<TData, unknown>) => (
  <Input
    type="text"
    data-testid="product-table-filter-input"
    tabIndex={0}
    ref={inputRef}
    placeholder={typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header.toUpperCase() : ''}
    className="h-7 text-xs font-medium"
    onChange={(event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      header.column.setFilterValue(event.target.value)
    }}
  />
)
