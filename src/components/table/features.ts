import {
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createSortedRowModel,
  filterFns,
  rowExpandingFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  type Cell,
  type CellData,
  type Column,
  type ColumnDef,
  type Header,
  type ReactTable,
  type Row,
  type RowData,
} from '@tanstack/react-table'

/**
 * The TanStack Table features the `Table` component relies on, plus the client side filtered, sorted and expanded row
 * models. Create the table with them: `useTable({ features: tableFeatureSet, columns, data })`.
 *
 * Server side tables keep working: pass `manualSorting`, `manualFiltering`... and the matching row model is skipped.
 */
export const tableFeatureSet = tableFeatures({
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  // The full registries keep every built-in `filterFn` / `sortFn` name (and `auto`) available to the columns
  filterFns,
  sortFns,
})

export type TableFeatureSet = typeof tableFeatureSet

/** Table instance returned by `useTable({ features: tableFeatureSet, ... })`. */
export type DataTable<TData extends RowData> = ReactTable<TableFeatureSet, TData>
export type DataRow<TData extends RowData> = Row<TableFeatureSet, TData>
export type DataCell<TData extends RowData, TValue extends CellData = CellData> = Cell<TableFeatureSet, TData, TValue>
export type DataHeader<TData extends RowData, TValue extends CellData = CellData> = Header<
  TableFeatureSet,
  TData,
  TValue
>
export type DataColumn<TData extends RowData, TValue extends CellData = CellData> = Column<
  TableFeatureSet,
  TData,
  TValue
>
export type DataColumnDef<TData extends RowData, TValue extends CellData = CellData> = ColumnDef<
  TableFeatureSet,
  TData,
  TValue
>
