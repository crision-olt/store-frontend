# table

Virtualized table with sorting, filtering, pinned columns, column reordering (drag and drop), sub-rows and sticky
header, footer and rows. It is built with the shadcn components in `src/components/ui` (`table`, `button`, `input`,
`tooltip`) and Tailwind classes.

## Usage

Create the table with TanStack Table's `useLegacyTable` hook and pass it to `Table`:

```tsx
import { getCoreRowModel, getSortedRowModel, useLegacyTable } from '@tanstack/react-table/legacy'
import { Table } from '@/components/table'

const table = useLegacyTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})

return (
  <div className="h-96">
    <Table table={table} />
  </div>
)
```

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

- `@tanstack/react-table` (v9, the `/legacy` entry keeps the v8 style `getCoreRowModel()` options)
- `@tanstack/react-virtual` for row virtualization
- `@dnd-kit/react`, `@dnd-kit/dom` and `@dnd-kit/abstract` for column reordering

## Notes for v9

- Column pinning uses `start` and `end` (`columnPinning: { start: ['id'], end: [] }`), both arrays are required.
- The table instance changes on every render. Do not use it as an effect dependency if the effect updates table state.

## Tests

The tests run in jsdom: start them with `// @vitest-environment jsdom` and import `@/test/setup-dom`. The `Person`
factory and the layout helpers are in `src/test`.
