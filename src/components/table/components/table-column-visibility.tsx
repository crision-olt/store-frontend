import { Checkbox } from '@base-ui/react/checkbox'
import { Popover } from '@base-ui/react/popover'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { Feedback, KeyboardSensor, PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react'
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable'
import { useLingui } from '@lingui/react/macro'
import type { RowData } from '@tanstack/react-table'
import { CheckIcon, ChevronDownIcon, Columns3Icon, GripVerticalIcon, LockIcon, XIcon } from 'lucide-react'
import type { DataColumn, DataTable } from '@/components/table/features'
import { reorderTableColumns } from '@/components/table/utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props<T extends RowData> = {
  table: DataTable<T>
  columnLabels?: Readonly<Record<string, string>>
  excludedColumnIds?: readonly string[]
}

const SENSORS = [
  PointerSensor.configure({
    activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })],
  }),
  KeyboardSensor,
]
const MODIFIERS = [RestrictToVerticalAxis]

function ColumnOption<T extends RowData>({ column, index, label }: {
  column: DataColumn<T>
  index: number
  label: string
}) {
  const { t } = useLingui()
  const pinned = Boolean(column.getIsPinned())
  const locked = pinned || !column.getCanHide()
  const checked = column.getIsVisible()
  const group = column.parent?.id ?? 'root'
  const { ref, handleRef, isDragSource, isDropTarget } = useSortable({
    id: column.id,
    index,
    group,
    type: group,
    accept: group,
    disabled: pinned,
  })

  return (
    <div
      ref={ref}
      role="listitem"
      className={cn(
        'flex min-w-0 items-center rounded-md pr-0.5 text-sm',
        isDragSource && 'opacity-50',
        isDropTarget && !isDragSource && 'bg-muted ring-1 ring-inset ring-ring',
      )}
    >
      <Checkbox.Root
        checked={checked}
        disabled={locked}
        tabIndex={-1}
        aria-label={label}
        onPointerDown={(event) => event.preventDefault()}
        onCheckedChange={(visible) => column.toggleVisibility(visible)}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 self-stretch rounded-md pl-2.5 outline-none',
          locked ? 'text-muted-foreground' : 'cursor-pointer hover:bg-muted',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded border border-input',
            checked && 'border-primary bg-primary text-primary-foreground',
            locked && 'opacity-60',
          )}
        >
          <Checkbox.Indicator><CheckIcon className="size-3" aria-hidden="true" /></Checkbox.Indicator>
        </span>
        <span className="min-w-0 flex-1 break-words py-2">{label}</span>
        {locked && (
          <span className="flex shrink-0 items-center gap-1 text-xs" aria-hidden="true">
            <LockIcon className="size-3" />
            {pinned ? t`Pinned` : t`Required`}
          </span>
        )}
      </Checkbox.Root>
      <Button
        ref={handleRef}
        variant="ghost"
        size="icon"
        disabled={pinned}
        aria-label={t`Reorder ${label}`}
        className="size-11 shrink-0 touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVerticalIcon aria-hidden="true" />
      </Button>
    </div>
  )
}

export function TableColumnVisibility<T extends RowData>({ table, columnLabels, excludedColumnIds }: Props<T>) {
  const { t } = useLingui()
  const leafColumns = table.getAllLeafColumns()
  const pinnedColumns = (side: 'start' | 'end') => table.state.columnPinning[side]
    .flatMap((id) => leafColumns.find((column) => column.id === id) ?? [])
  const columns = [
    ...pinnedColumns('start'),
    ...leafColumns.filter((column) => !column.getIsPinned()),
    ...pinnedColumns('end'),
  ].filter((column) => !excludedColumnIds?.includes(column.id))
  const groupIndexes = new Map<string | undefined, number>()

  function handleDragEnd(event: DragEndEvent) {
    event.suspend().abort()
    if (event.canceled || !isSortableOperation(event.operation)) return
    const { source, target } = event.operation
    if (!source || !target) return
    const activeColumn = leafColumns.find((column) => column.id === String(source.id))
    const overColumn = leafColumns.find((column) => column.id === String(target.id))
    if (!activeColumn || !overColumn) return
    if (activeColumn.getIsPinned() || overColumn.getIsPinned()) return
    if (activeColumn.parent?.id !== overColumn.parent?.id) return
    const siblings = columns.filter((column) => column.parent?.id === activeColumn.parent?.id)
    const targetColumn = siblings[source.index]
    if (!targetColumn || targetColumn === activeColumn || targetColumn.getIsPinned()) return
    reorderTableColumns(table, activeColumn, targetColumn)
  }

  return (
    <Popover.Root>
      <Popover.Trigger render={<Button variant="outline" size="sm" className="group" />}>
        <Columns3Icon aria-hidden="true" />
        {t`Columns`}
        <ChevronDownIcon aria-hidden="true" className="group-aria-expanded:rotate-180" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8} collisionPadding={16} className="isolate z-40">
          <Popover.Popup className="max-h-(--available-height) w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-xl outline-none">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
              <Popover.Title className="text-sm font-semibold">{t`Visible columns`}</Popover.Title>
              <Popover.Close render={<Button variant="ghost" size="icon-sm" />} aria-label={t`Close column settings`}>
                <XIcon aria-hidden="true" />
              </Popover.Close>
            </div>
            <DragDropProvider
              sensors={SENSORS}
              modifiers={MODIFIERS}
              plugins={(defaults) => [...defaults, Feedback.configure({ dropAnimation: null })]}
              onDragEnd={handleDragEnd}
            >
              <div role="list" data-testid="column-visibility-list" className="flex flex-col gap-0.5 p-1.5">
                {columns.map((column) => {
                  const group = column.parent?.id
                  const index = groupIndexes.get(group) ?? 0
                  groupIndexes.set(group, index + 1)
                  return (
                    <ColumnOption
                      key={column.id}
                      column={column}
                      index={index}
                      label={columnLabels?.[column.id]
                        ?? (typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id)}
                    />
                  )
                })}
              </div>
            </DragDropProvider>
            <Popover.Description className="border-t px-4 py-3 text-xs text-muted-foreground">
              {t`Drag handles to reorder columns. Or focus a handle, press Space, then use the arrow keys.`}
              {columns.some((column) => column.getIsPinned()) && <> {t`Pinned columns cannot be hidden or moved.`}</>}
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
