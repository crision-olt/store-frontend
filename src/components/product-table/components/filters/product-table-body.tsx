import type { RowData } from '@tanstack/react-table'
import type { LegacyRow, LegacyTable } from '@tanstack/react-table/legacy'
import type { ComponentType, MouseEventHandler, PropsWithChildren, ReactElement } from 'react'
import { Fragment } from 'react'
import { ProductTableRow } from '@/components/product-table/components/product-table-row'
import { ProductTableRowExpanded } from '@/components/product-table/components/product-table-row-expanded'
import { useProductTable } from '@/components/product-table/providers/product-table-provider'
import { TableBody } from '@/components/ui/table'

export type ProductTableBodyProps<T extends RowData> = {
  table: LegacyTable<T>
  testId: string
  getClickRow?: (row: T) => MouseEventHandler | undefined
  getDblClickRow?: (row: T) => MouseEventHandler | undefined
  rowClassName?: (row: LegacyRow<T>) => string | undefined
  RowProvider?: ComponentType<PropsWithChildren & { row: LegacyRow<T> }>
  renderSubComponent?: (props: { row: LegacyRow<T> }) => ReactElement
}

const DefaultRowProvider = ({ children }: PropsWithChildren) => <>{children}</>

export const ProductTableBody = <T extends RowData>({
  table,
  getClickRow,
  getDblClickRow,
  rowClassName,
  renderSubComponent,
  RowProvider = DefaultRowProvider,
  testId,
}: ProductTableBodyProps<T>) => {
  const { tbodyRef } = useProductTable()
  return (
    <TableBody ref={tbodyRef}>
      {table.getRowModel().rows.map((row) => (
        <Fragment key={row.id}>
          <RowProvider row={row}>
            <ProductTableRow
              row={row}
              getClickRow={getClickRow}
              getDblClickRow={getDblClickRow}
              rowClassName={rowClassName}
              testId={testId}
            />
          </RowProvider>
          {row.getIsExpanded() && renderSubComponent && (
            <ProductTableRowExpanded row={row} testId={testId} renderSubComponent={renderSubComponent} />
          )}
        </Fragment>
      ))}
    </TableBody>
  )
}
