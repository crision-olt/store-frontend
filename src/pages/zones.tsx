import { useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Accessibility, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { restaurantUseCases, tablesQueryKey, zonesQueryKey, type RestaurantTable, type Zone, type ZoneInput } from '@/features/restaurant/restaurant'
import { hasHttpStatus } from '@/features/restaurant/application/http-error'
import { buildLinkWithRedirect } from '@/lib/redirect'

function ZoneTableLabel({ number, isOutside, isAccessible }: { number: number } & Partial<Pick<RestaurantTable, 'isOutside' | 'isAccessible'>>) {
  const { t } = useLingui()
  const name = t`Table ${number}`
  const outdoor = isOutside ? t`Outdoor` : ''
  const accessible = isAccessible ? t`Accessible` : ''
  return (
    <span>
      <span className="sr-only">{[name, outdoor, accessible].filter(Boolean).join(', ')}</span>
      <span aria-hidden="true" className="inline-flex items-center gap-1.5">
        {name}
        {outdoor && <span title={outdoor}><Sun className="size-4 text-amber-700 dark:text-amber-400" /></span>}
        {accessible && <span title={accessible}><Accessibility className="size-4 text-sky-700 dark:text-sky-400" /></span>}
      </span>
    </span>
  )
}

function ZoneForm({ zone, currentBaseName, tables, busy, onSave, onCancel }: {
  zone?: Zone
  currentBaseName?: string
  tables: RestaurantTable[]
  busy: boolean
  onSave: (input: ZoneInput) => void
  onCancel: () => void
}) {
  const { t } = useLingui()
  const [name, setName] = useState(zone?.name ?? '')
  const [hasOutside, setHasOutside] = useState(zone?.hasOutside ?? false)
  const [isBase, setIsBase] = useState(zone?.isBase ?? false)
  const [selected, setSelected] = useState(() => new Set(zone?.tableNumbers))
  const eligible = hasOutside ? tables : tables.filter((table) => !table.isOutside)
  const selectedTables = eligible.filter((table) => selected.has(table.number))

  return (
    <Card>
      <CardHeader><CardTitle>{zone ? t`Edit zone` : t`Create zone`}</CardTitle></CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={(event) => {
          event.preventDefault()
          if (!busy && name.trim()) {
            onSave({ name: name.trim(), hasOutside, isBase, tableNumbers: selectedTables.map((table) => table.number) })
          }
        }}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="zone-name">{t`Zone name`}</Label>
            <Input id="zone-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} disabled={busy} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasOutside} disabled={busy} onChange={(event) => {
              const checked = event.target.checked
              setHasOutside(checked)
              if (!checked) {
                setSelected((previous) => new Set(tables.filter((table) => !table.isOutside && previous.has(table.number)).map((table) => table.number)))
              }
            }} />
            {t`Has an outdoor area`}
          </label>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isBase} disabled={busy}
                aria-describedby={currentBaseName ? 'zone-base-help' : undefined}
                onChange={(event) => setIsBase(event.target.checked)} />
              {t`Base zone`}
            </label>
            {currentBaseName && <p id="zone-base-help" className="text-sm text-muted-foreground">
              {t`Saving this zone as the base will replace ${currentBaseName}.`}
            </p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label id="zone-tables-label" htmlFor="zone-tables">{t`Tables`}</Label>
            <p id="zone-tables-help" className="text-sm text-muted-foreground">{t`Tables in another zone are not shown. Turning off the outdoor area clears outdoor selections.`}</p>
            <Select multiple value={selectedTables.map(({ number }) => String(number))} disabled={busy || eligible.length === 0}
              onValueChange={(values) => setSelected(new Set(values.map(Number)))}>
              <SelectTrigger id="zone-tables" aria-labelledby="zone-tables-label" aria-describedby="zone-tables-help" className="w-full sm:max-w-sm">
                <SelectValue>{eligible.length === 0 ? t`No eligible tables available.` : t`Select tables`}</SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {eligible.map((table) => (
                  <SelectItem key={table.number} value={String(table.number)}><ZoneTableLabel {...table} /></SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTables.length > 0 && (
              <ul role="list" className="flex flex-wrap gap-2 text-sm">
                {selectedTables.map((table) => (
                  <li key={table.number} className="rounded-md bg-muted px-2 py-1"><ZoneTableLabel {...table} /></li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !name.trim()}>{t`Save zone`}</Button>
            <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>{t`Cancel`}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ZonesContent() {
  const { t } = useLingui()
  const location = useLocation()
  const client = useQueryClient()
  const [editor, setEditor] = useState<number | 'new'>()
  const zones = useQuery({ queryKey: zonesQueryKey, queryFn: ({ signal }) => restaurantUseCases.listZones(signal), retry: false })
  const tables = useQuery({ queryKey: tablesQueryKey, queryFn: ({ signal }) => restaurantUseCases.listTables(signal), retry: false })
  const currentBase = zones.data?.find((zone) => zone.isBase)
  const tablesByNumber = useMemo(() => new Map(tables.data?.map((table) => [table.number, table])), [tables.data])
  const assignedElsewhere = useMemo(() => new Set(zones.data?.flatMap((zone) =>
    zone.id === editor ? [] : zone.tableNumbers)), [zones.data, editor])
  const save = useMutation({
    mutationFn: (input: ZoneInput) => restaurantUseCases.saveZone(typeof editor === 'number' ? editor : undefined, input),
    onSuccess: async (saved) => {
      await client.cancelQueries({ queryKey: zonesQueryKey })
      client.setQueryData<Zone[]>(zonesQueryKey, (previous = []) => {
        const updated = previous.map((zone) => {
          if (zone.id === saved.id) return saved
          return saved.isBase && zone.isBase ? { ...zone, isBase: false } : zone
        })
        return previous.some((zone) => zone.id === saved.id) ? updated : [...updated, saved]
      })
      setEditor(undefined)
      void client.invalidateQueries({ queryKey: zonesQueryKey })
    },
    onError: async (error) => {
      if (hasHttpStatus(error, 409) || hasHttpStatus(error, 400)) {
        await Promise.all([zones.refetch(), tables.refetch()])
      }
    },
  })
  if ([zones.error, tables.error, save.error].some((error) => hasHttpStatus(error, 401))) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  function openEditor(next?: number | 'new') {
    save.reset()
    setEditor(next)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t`Zones`}</h1>
          <p className="text-sm text-muted-foreground">{t`Group your restaurant tables into zones.`}</p>
        </div>
        <Button disabled={!zones.data || !tables.data || editor !== undefined} onClick={() => openEditor('new')}>{t`Create zone`}</Button>
      </header>
      {zones.isError || tables.isError ? (
        <div>
          <p role="alert" className="text-sm text-destructive">{t`Could not load zones or tables.`}</p>
          <Button variant="outline" onClick={() => { void zones.refetch(); void tables.refetch() }}>{t`Try again`}</Button>
        </div>
      ) : !zones.data || !tables.data ? <p role="status">{t`Loading zones…`}</p> : (
        <>
          {save.isError && <p role="alert" className="text-sm text-destructive">
            {[400, 409].some((status) => hasHttpStatus(save.error, status))
              ? t`Could not save the zone. Review the current table options and try again.`
              : t`Could not save the zone. Please try again.`}
          </p>}
          {editor !== undefined && (
            <ZoneForm key={editor} zone={zones.data.find((zone) => zone.id === editor)}
              currentBaseName={currentBase?.id !== editor ? currentBase?.name : undefined}
              tables={tables.data.filter((table) => !assignedElsewhere.has(table.number))}
              busy={save.isPending} onSave={save.mutate} onCancel={() => openEditor()} />
          )}
          {zones.data.length === 0 && <p>{t`No zones configured yet.`}</p>}
          {zones.data.map((zone) => (
            <Card key={zone.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="wrap-break-word">{zone.name}</CardTitle>
                    {zone.isBase && <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{t`Base zone`}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{zone.hasOutside ? t`Has an outdoor area` : t`Indoor only`}</p>
                </div>
                <Button variant="outline" disabled={editor !== undefined} aria-label={t`Edit ${zone.name}`}
                  onClick={() => openEditor(zone.id)}>{t`Edit`}</Button>
              </CardHeader>
              <CardContent className="text-sm">
                {zone.tableNumbers.length === 0 ? t`No tables assigned.` : (
                  <ul className="flex flex-wrap gap-2">
                    {zone.tableNumbers.map((number) => (
                      <li key={number} className="rounded-md border px-2 py-1">
                        <ZoneTableLabel {...tablesByNumber.get(number)} number={number} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}

export function ZonesPage() {
  return <RequireAuth><StoreLayout><ZonesContent /></StoreLayout></RequireAuth>
}
