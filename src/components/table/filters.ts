import type { ChangeEvent, RefObject } from 'react'
import type { LegacyHeader } from '@tanstack/react-table/legacy'
import type { RowData } from '@tanstack/react-table'

export type FilterComponentProps<TData extends RowData, TValue> = {
  inputRef: RefObject<HTMLInputElement | null>
  header: LegacyHeader<TData, TValue>
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}
