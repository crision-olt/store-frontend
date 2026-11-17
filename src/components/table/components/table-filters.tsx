import { Popover } from '@base-ui/react/popover'
import { useLingui } from '@lingui/react/macro'
import type { RowData } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronUpIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { TextInputFilter } from '@/components/table/components/filters/text-input-filter'
import type { DataTable } from '@/components/table/features'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type TableFilterField = {
  id: string
  label: string
  value: string
  fullWidth?: boolean
}

type Props<T extends RowData> = {
  table: DataTable<T>
  title: string
  fields: readonly TableFilterField[]
  onRemoveFilter?: (id: string) => void
}

export function TableFilters<T extends RowData>({
  table,
  title,
  fields,
  onRemoveFilter = (id) => table.setColumnFilters((current) => current.filter((filter) => filter.id !== id)),
}: Props<T>) {
  const { t } = useLingui()
  const activeFilters = fields.filter((field) => field.value !== '')
  const [filtersVisible, setFiltersVisible] = useState(() => activeFilters.length > 0)
  const filtersId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover.Root open={filtersVisible} onOpenChange={setFiltersVisible} triggerId={filtersId}>
        <Popover.Trigger id={filtersId} render={<Button variant="outline" size="sm" />}>
          <SlidersHorizontalIcon aria-hidden="true" />
          {t`Filters`}
          {activeFilters.length > 0 && <Badge variant="secondary">{activeFilters.length}</Badge>}
          {filtersVisible ? <ChevronUpIcon aria-hidden="true" /> : <ChevronDownIcon aria-hidden="true" />}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner align="start" sideOffset={8} collisionPadding={16} className="isolate z-40">
            <Popover.Popup
              initialFocus={(interaction) => interaction === 'touch' ? true : inputRef.current}
              className="max-h-(--available-height) w-[min(32rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-xl outline-none"
            >
              <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                <Popover.Title className="text-sm font-semibold">{title}</Popover.Title>
                <Popover.Close render={<Button variant="ghost" size="icon-sm" />} aria-label={t`Close filter`}>
                  <XIcon aria-hidden="true" />
                </Popover.Close>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                {table.getFlatHeaders().map((header) => {
                  const field = fields.find((item) => item.id === header.column.id)
                  if (!field || header.isPlaceholder) return null
                  const Filter = header.column.columnDef.meta?.Filter ?? TextInputFilter
                  return (
                    <div
                      key={header.id}
                      role="group"
                      aria-label={field.label}
                      className={cn('flex min-w-0 flex-col gap-1.5', field.fullWidth && 'sm:col-span-2')}
                    >
                      <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                      <Filter inputRef={inputRef} header={header} />
                    </div>
                  )
                })}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {activeFilters.length > 0 && (
        <>
          <div role="group" aria-label={t`Active filters`} className="flex min-w-0 flex-wrap gap-1.5">
            {activeFilters.map(({ id, label, value }) => (
              <Button
                key={id}
                type="button"
                variant="secondary"
                size="sm"
                className="min-w-0 max-w-full font-normal"
                aria-label={t`Remove filter: ${label}`}
                title={`${label}: ${value}`}
                onClick={() => onRemoveFilter(id)}
              >
                <span className="max-w-64 truncate"><span className="text-muted-foreground">{label}:</span> {value}</span>
                <XIcon aria-hidden="true" />
              </Button>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => table.setColumnFilters([])}>
            {t`Clear filters`}
          </Button>
        </>
      )}
    </div>
  )
}
