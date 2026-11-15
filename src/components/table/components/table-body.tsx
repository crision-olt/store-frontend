import type { RowData } from '@tanstack/react-table'
import type { LegacyRow, LegacyTable } from '@tanstack/react-table/legacy'
import type { ComponentType, MouseEventHandler, PropsWithChildren, ReactElement } from 'react'
import { Fragment } from 'react'
import { TableRow } from '@/components/table/components/table-row'
import { TableRowExpanded } from '@/components/table/components/table-row-expanded'
import { useTableContext } from '@/components/table/providers/table-provider'
import { TableBody as UiTableBody } from '@/components/ui/table'

export type TableBodyProps<T extends RowData> = {
  table: LegacyTable<T>
  testId: string
  getClickRow?: (row: T) => MouseEventHandler | undefined
  getDblClickRow?: (row: T) => MouseEventHandler | undefined
  rowClassName?: (row: LegacyRow<T>) => string | undefined
  RowProvider?: ComponentType<PropsWithChildren & { row: LegacyRow<T> }>
  renderSubComponent?: (props: { row: LegacyRow<T> }) => ReactElement
}

const DefaultRowProvider = ({ children }: PropsWithChildren) => <>{children}</>

export const TableBody = <T extends RowData>({
  table,
  getClickRow,
  getDblClickRow,
  rowClassName,
  renderSubComponent,
  RowProvider = DefaultRowProvider,
  testId,
}: TableBodyProps<T>) => {
  const { tbodyRef } = useTableContext()
  return (
    <UiTableBody ref={tbodyRef}>
      {table.getRowModel().rows.map((row) => (
        <Fragment key={row.id}>
          <RowProvider row={row}>
            <TableRow
              row={row}
              getClickRow={getClickRow}
              getDblClickRow={getDblClickRow}
              rowClassName={rowClassName}
              testId={testId}
            />
          </RowProvider>
          {row.getIsExpanded() && renderSubComponent && (
            <TableRowExpanded row={row} testId={testId} renderSubComponent={renderSubComponent} />
          )}
        </Fragment>
      ))}
    </UiTableBody>
  )
}
