import type { DataColumnDef } from '@/components/table/features'

export type Person = {
  id: number
  firstName: string
  lastName: string
  age: number
  status: string
  createdAt: Date
}

type ColumnTypes = unknown
type ColumnMeta = NonNullable<DataColumnDef<Person, ColumnTypes>['meta']>
export type PersonColumn = DataColumnDef<Person, ColumnTypes> & { accessorKey: keyof Person }

const STATUSES = ['active', 'inactive', 'pending']
const HEADERS: Record<keyof Person, string> = {
  id: 'Id',
  firstName: 'First name',
  lastName: 'Last name',
  age: 'Age',
  status: 'Status',
  createdAt: 'Created at',
}

const column = (key: keyof Person, withFooter: boolean, meta?: ColumnMeta): PersonColumn => ({
  accessorKey: key,
  header: HEADERS[key],
  cell: (info) => String(info.getValue()),
  footer: withFooter ? `Footer ${HEADERS[key]}` : undefined,
  enableColumnFilter: true,
  enableSorting: true,
  meta,
})

export const TableFactory = {
  createData: (count: number): Person[] =>
    Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      firstName: `First${index + 1}`,
      lastName: `Last${index + 1}`,
      age: 20 + index,
      status: STATUSES[index % STATUSES.length],
      createdAt: new Date(2024, 0, index + 1),
    })),

  createColumns: (withFooter = false, meta?: ColumnMeta): PersonColumn[] =>
    (['id', 'firstName', 'lastName', 'age', 'status', 'createdAt'] as const).map((key) =>
      column(key, withFooter, meta),
    ),

  // `id`, `firstName` and `lastName` are grouped under one header, so they are one level deeper than the rest
  createWithNestedColumns: (withFooter = false): PersonColumn[] =>
    [
      {
        id: 'person',
        header: 'Person',
        footer: withFooter ? 'Footer Person' : undefined,
        columns: (['id', 'firstName', 'lastName'] as const).map((key) => column(key, withFooter)),
      },
      column('age', withFooter),
      column('status', withFooter),
      column('createdAt', withFooter),
    ] as unknown as PersonColumn[],
}
