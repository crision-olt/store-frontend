import type { RowData } from '@tanstack/react-table'
import type { ChangeEvent } from 'react'
import type { FilterComponentProps } from '@/components/table/filters'
import { Input } from '@/components/ui/input'

export const TextInputFilter = <TData extends RowData>({
  inputRef,
  header,
  onChange,
}: FilterComponentProps<TData, unknown>) => (
  <Input
    type="text"
    data-testid="table-filter-input"
    tabIndex={0}
    ref={inputRef}
    defaultValue={String(header.column.getFilterValue() ?? '')}
    placeholder={typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header.toUpperCase() : ''}
    className="h-7 text-xs font-medium"
    onChange={(event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      header.column.setFilterValue(event.target.value)
    }}
  />
)
