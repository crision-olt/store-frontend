import type { ChangeEvent, RefObject } from 'react'
import type { DataHeader } from '@/components/table/features'
import type { RowData } from '@tanstack/react-table'

export type FilterComponentProps<TData extends RowData, TValue> = {
  inputRef: RefObject<HTMLInputElement | null>
  header: DataHeader<TData, TValue>
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}
