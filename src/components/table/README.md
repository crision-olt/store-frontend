# table

Virtualized table with sorting, filtering, pinned columns, column reordering (drag and drop), sub-rows and sticky
header, footer and rows. It is built with the shadcn components in `src/components/ui` (`table`, `button`, `input`,
`tooltip`) and Tailwind classes.

## Usage

Create the table with TanStack Table's `useTable` hook and the table's feature set, then pass it to `Table`:

```tsx
import { useTable } from '@tanstack/react-table'
import { Table } from '@/components/table'
import { tableFeatureSet, type DataColumnDef } from '@/components/table/features'

const columns: DataColumnDef<Product>[] = [
  // ...
]

const table = useTable({ features: tableFeatureSet, columns, data })

return (
  <div className="h-96">
    <Table table={table} />
  </div>
)
```

`tableFeatureSet` registers the features the table uses (sorting, filtering, ordering, pinning, sizing, resizing,
visibility, expanding, selection) and the client side filtered, sorted and expanded row models. For server side data
pass `manualSorting` / `manualFiltering` as usual. Do not pass a state selector to `useTable`: the table reads the
full state. `features.ts` also exports the matching types (`DataTable`, `DataRow`, `DataColumnDef`...).

The table fills the height of its parent. Every prop is documented in `components/table-container.tsx`.
Column options (`align`, `lineClamp`, `width`, `className`, `showFilter`, `Filter`...) go in the column `meta`.

### Sizing (`sizeMode`)

- `full` (default): columns use their `size` or `meta.width` and grow proportionally to fill the container.
  Set `meta.fillRemainingWidth` on one non-resizable leaf column (such as a trailing actions column) to absorb any
  leftover width after manual resizing or hiding columns. Other columns keep their resolved widths.
- `fixed`: columns keep their sizes and the table is exactly as wide as the sum of its visible columns.
- `auto`: the browser sizes the columns from their content (slower with many rows).

### Column ordering

Pass `enableColumnOrdering` and control `columnOrder` with `onColumnOrderChange`. The order may start empty: columns
that are not listed keep their definition order. Columns move among their siblings only (inside the same group, or
top level columns and whole groups).

### Filters

Columns with `meta.showFilter` show a filter button. A column that already has a filter value (for example from the
initial state) opens with its filter input visible and filled.

For a dropdown above the table instead, use `TableFilters`. It renders in a portal, so opening it does not move the
table. Keep `meta.showFilter` off on these columns to avoid duplicate controls in the headers.

```tsx
import { Table, TableFilters, type TableFilterField } from '@/components/table'

// Use the same table instance as <Table>.
const name = table.getColumn('name')?.getFilterValue()
const fields: TableFilterField[] = [
  {
    id: 'name',
    label: 'Name',
    value: typeof name === 'string' ? name : '',
    fullWidth: true,
  },
]

return (
  <div className="flex flex-col gap-3">
    <TableFilters table={table} title="Filters" fields={fields} />
    <Table table={table} className="h-96" />
  </div>
)
```

Each field's `id` matches a column ID; `label` and `value` are the readable active-filter chip text.
Use `value: ''` when the filter is inactive, and localize the title, labels and formatted values in the caller.
`fullWidth` lets a control span both dropdown columns.

Controls reuse the column's `meta.Filter`, or the standard text filter when none is provided.
The component manages its own dropdown visibility, initially opening when a field is active. Chips stay visible
when the dropdown closes. Removing a chip clears that column; **Clear filters** sets the table's column filters to
an empty array. Both controlled and uncontrolled column-filter state work through the table's existing setters.

Pass `onRemoveFilter={(id) => ...}` to override chip removal for dependent filters. The callback must clear the
requested filter as well as its dependents. For example, the products table clears subcategory when category is
removed; product labels, selected-value formatting and dependency rules stay outside `TableFilters`.
The product field definitions are built by
[`getProductFilterFields`](../products/products-table-filters.config.ts), a pure function that receives the current
column filters, category data and Lingui instance. It adds no hooks or render-triggering state.

### Column visibility and order

Use `TableColumnVisibility` next to the filters with the same table instance:

```tsx
import { TableColumnVisibility } from '@/components/table'

<TableColumnVisibility table={table} columnLabels={{ name: 'Name', created_at: 'Created' }} />
```

The dropdown lists every leaf column, including hidden ones, with its current visibility checked.
Group headers are not separate options. Pinned columns and columns with `enableHiding: false` have disabled
checkboxes. Set `enableHiding: false` in a column definition when it must also reject the table's individual
visibility toggle API, as the products table does for its pinned name column.
Visibility checkboxes are skipped by keyboard navigation and do not receive focus when clicked.
Reorder handles retain keyboard access.

`columnLabels` is optional: string column headers are used by default, falling back to the column ID for
function or JSX headers. Supply translated labels for those headers; product labels are defined in
[`products-table-columns.config.ts`](../products/products-table-columns.config.ts).
Visibility updates the table's existing state directly, without maintaining another copy or persisting it.
Drag a row's handle to reorder columns, including hidden ones. With the keyboard, focus a handle, press Space,
use the arrow keys, and press Space to drop or Escape to cancel. Pinned columns stay at their respective edges
and cannot be dragged; required but unpinned columns can still move. Grouped columns can only move among siblings.
The popover previews the new order as you drag: other options shift aside without changing the table's order.
The popover and header dragging share the same ordering helper. Table order changes only on drop and is not
persisted across page reloads. Canceling a drag restores the original option order.

## Dependencies

- `@tanstack/react-table` v9 (native `useTable` API; the deprecated `/legacy` v8 compatibility layer is not used)
- `@tanstack/react-virtual` for row virtualization
- `@dnd-kit/react`, `@dnd-kit/dom` and `@dnd-kit/abstract` for column reordering

## Notes for v9

- Column pinning uses `start` and `end` (`columnPinning: { start: ['id'], end: [] }`), both arrays are required.
- The table instance changes on every render. Do not use it as an effect dependency if the effect updates table state.

## Tests

The tests run in jsdom: start them with `// @vitest-environment jsdom` and import `@/test/setup-dom`. The `Person`
factory and the layout helpers are in `src/test`.
