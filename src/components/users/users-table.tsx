import { useLingui } from '@lingui/react/macro'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Table, TableColumnVisibility, TableFilters } from '@/components/table'
import { TableFeedbackState } from '@/components/table/components/table-feedback-state'
import { TableLoading } from '@/components/table/components/table-loading'
import { tableFeatureSet, type TableFeatureSet } from '@/components/table/features'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { UserActions } from '@/components/users/user-actions'
import type { User } from '@/features/users/domain/user'
import type { Role } from '@/features/access/domain/access'

const columnHelper = createColumnHelper<TableFeatureSet, User>()
const emptyUsers: User[] = []
const emptyRoles: Role[] = []
const actionColumns = ['actions']
const selectClassName = 'h-7 w-full rounded-md border border-input bg-background px-2 text-xs'

export function UsersTable({ users = emptyUsers, roles = emptyRoles, isLoading }: {
  users?: User[]
  roles?: Role[]
  isLoading: boolean
}) {
  const { t, i18n } = useLingui()
  const locale = i18n.locale
  const labels = useMemo(() => ({
    email: t`Email`,
    role: t`Role`,
    status: t`Status`,
    created_at: t`Created`,
    active: t`Active`,
    blocked: t`Blocked`,
    allRoles: t`All roles`,
    allStatuses: t`All statuses`,
    filterEmail: t`Filter by email`,
    filterRole: t`Filter by role`,
    filterStatus: t`Filter by status`,
  }), [t])

  const columns = useMemo(() => columnHelper.columns([
    columnHelper.accessor('email', {
      header: labels.email,
      size: 260,
      enableHiding: false,
      filterFn: 'includesString',
      meta: {
        textEllipsis: true,
        enableCellTooltip: true,
        Filter: ({ header, inputRef }) => (
          <Input ref={inputRef} type="text" aria-label={labels.filterEmail}
            value={String(header.column.getFilterValue() ?? '')}
            onChange={(event) => header.column.setFilterValue(event.currentTarget.value)}
            className="h-7 text-xs" />
        ),
      },
    }),
    columnHelper.accessor(({ role }) => role.name, {
      id: 'role',
      header: labels.role,
      size: 120,
      filterFn: (row, _, value) => String(row.original.role.id) === value,
      cell: ({ cell }) => <Badge variant="secondary">{cell.getValue()}</Badge>,
      meta: {
        Filter: ({ header }) => (
          <select aria-label={labels.filterRole} className={selectClassName}
            value={String(header.column.getFilterValue() ?? '')}
            onChange={(event) => header.column.setFilterValue(event.currentTarget.value || undefined)}>
            <option value="">{labels.allRoles}</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        ),
      },
    }),
    columnHelper.accessor(({ blocked }) => blocked ? 'blocked' : 'active', {
      id: 'status',
      header: labels.status,
      size: 110,
      filterFn: 'equalsString',
      cell: ({ row }) => row.original.blocked
        ? <Badge variant="destructive">{labels.blocked}</Badge>
        : <Badge variant="secondary">{labels.active}</Badge>,
      meta: {
        Filter: ({ header }) => (
          <select aria-label={labels.filterStatus} className={selectClassName}
            value={String(header.column.getFilterValue() ?? '')}
            onChange={(event) => header.column.setFilterValue(event.currentTarget.value || undefined)}>
            <option value="">{labels.allStatuses}</option>
            <option value="active">{labels.active}</option>
            <option value="blocked">{labels.blocked}</option>
          </select>
        ),
      },
    }),
    columnHelper.accessor('created_at', {
      header: labels.created_at,
      size: 120,
      sortFn: 'text',
      cell: ({ cell }) => new Date(cell.getValue()).toLocaleDateString(locale),
    }),
    columnHelper.display({
      id: 'actions',
      size: 176,
      minSize: 176,
      meta: { fillRemainingWidth: true },
      enableHiding: false,
      enableResizing: false,
      cell: ({ row }) => <UserActions user={row.original} roles={roles} />,
    }),
  ]), [labels, locale, roles])
  const table = useTable({
    features: tableFeatureSet,
    columns,
    data: users,
    getRowId: ({ id }) => String(id),
    columnResizeMode: 'onChange',
    enableMultiSort: false,
    initialState: { columnPinning: { start: ['email'], end: [] } },
  })

  const email = table.getColumn('email')?.getFilterValue()
  const role = table.getColumn('role')?.getFilterValue()
  const status = table.getColumn('status')?.getFilterValue()
  const fields = [
    { id: 'email', label: labels.email, value: String(email ?? ''), fullWidth: true },
    { id: 'role', label: labels.role, value: roles.find(({ id }) => String(id) === role)?.name ?? String(role ?? '') },
    { id: 'status', label: labels.status, value: status === 'blocked' ? labels.blocked : status === 'active' ? labels.active : '' },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <TableFilters table={table} title={t`User filters`} fields={fields} />
        <TableColumnVisibility table={table} excludedColumnIds={actionColumns} />
      </div>
      <Table table={table}
        className={`rounded-lg border bg-card [&>div]:max-h-96 ${isLoading ? 'h-40' : 'h-auto'}`}
        feedbackState={isLoading ? <TableLoading /> : undefined}
        endSlot={!isLoading && table.getRowModel().rows.length === 0 && (
          <TableFeedbackState className="static h-24" title={users.length ? t`No users found.` : t`No users yet.`} />
        )} />
    </div>
  )
}
