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
- `fixed`: columns keep their sizes and the table is exactly as wide as the sum of its visible columns.
- `auto`: the browser sizes the columns from their content (slower with many rows).

### Column ordering

Pass `enableColumnOrdering` and control `columnOrder` with `onColumnOrderChange`. The order may start empty: columns
that are not listed keep their definition order. Columns move among their siblings only (inside the same group, or
top level columns and whole groups).

### Filters

Columns with `meta.showFilter` show a filter button. A column that already has a filter value (for example from the
initial state) opens with its filter input visible and filled.

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
