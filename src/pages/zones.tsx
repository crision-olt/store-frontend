import { useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buildLinkWithRedirect } from '@/lib/redirect'
import { listTables, tablesQueryKey, TablesApiError, type RestaurantTable } from '@/lib/tables-api'
import { listZones, saveZone, zonesQueryKey, ZonesApiError, type Zone, type ZoneInput } from '@/lib/zones-api'

function ZoneForm({ zone, tables, busy, onSave, onCancel }: {
  zone?: Zone
  tables: RestaurantTable[]
  busy: boolean
  onSave: (input: ZoneInput) => void
  onCancel: () => void
}) {
  const { t } = useLingui()
  const [name, setName] = useState(zone?.name ?? '')
  const [hasOutside, setHasOutside] = useState(zone?.hasOutside ?? false)
  const [selected, setSelected] = useState(() => new Set(zone?.tableNumbers))
  const eligible = hasOutside ? tables : tables.filter((table) => !table.isOutside)

  return (
    <Card>
      <CardHeader><CardTitle>{zone ? t`Edit zone` : t`Create zone`}</CardTitle></CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={(event) => {
          event.preventDefault()
          if (!busy && name.trim()) {
            onSave({ name: name.trim(), hasOutside, tableNumbers: eligible.filter((table) => selected.has(table.number)).map((table) => table.number) })
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
          <fieldset className="space-y-2" disabled={busy}>
            <legend className="text-sm font-medium">{t`Tables`}</legend>
            <p className="text-sm text-muted-foreground">{t`Tables in another zone are not shown. Turning off the outdoor area clears outdoor selections.`}</p>
            {eligible.length === 0 ? <p className="text-sm">{t`No eligible tables available.`}</p> : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {eligible.map(({ number, isOutside }) => (
                  <label key={number} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <input type="checkbox" checked={selected.has(number)} onChange={(event) => {
                      const checked = event.target.checked
                      setSelected((previous) => {
                        const next = new Set(previous)
                        if (checked) next.add(number)
                        else next.delete(number)
                        return next
                      })
                    }} />
                    {isOutside ? t`Table ${number} (outdoor)` : t`Table ${number}`}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
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
  const zones = useQuery({ queryKey: zonesQueryKey, queryFn: ({ signal }) => listZones(signal), retry: false })
  const tables = useQuery({ queryKey: tablesQueryKey, queryFn: ({ signal }) => listTables(signal), retry: false })
  const assignedElsewhere = useMemo(() => new Set(zones.data?.flatMap((zone) =>
    zone.id === editor ? [] : zone.tableNumbers)), [zones.data, editor])
  const save = useMutation({
    mutationFn: (input: ZoneInput) => saveZone(typeof editor === 'number' ? editor : undefined, input),
    onSuccess: async (saved) => {
      await client.cancelQueries({ queryKey: zonesQueryKey })
      client.setQueryData<Zone[]>(zonesQueryKey, (previous = []) =>
        previous.some((zone) => zone.id === saved.id)
          ? previous.map((zone) => zone.id === saved.id ? saved : zone)
          : [...previous, saved])
      setEditor(undefined)
      void client.invalidateQueries({ queryKey: zonesQueryKey })
    },
    onError: async (error) => {
      if (error instanceof ZonesApiError && (error.status === 409 || error.status === 400)) {
        await Promise.all([zones.refetch(), tables.refetch()])
      }
    },
  })
  if ([zones.error, tables.error, save.error].some((error) =>
    (error instanceof ZonesApiError || error instanceof TablesApiError) && error.status === 401)) {
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
            {save.error instanceof ZonesApiError && [400, 409].includes(save.error.status)
              ? t`Could not save the zone. Review the current table options and try again.`
              : t`Could not save the zone. Please try again.`}
          </p>}
          {editor !== undefined && (
            <ZoneForm key={editor} zone={zones.data.find((zone) => zone.id === editor)}
              tables={tables.data.filter((table) => !assignedElsewhere.has(table.number))}
              busy={save.isPending} onSave={save.mutate} onCancel={() => openEditor()} />
          )}
          {zones.data.length === 0 && <p>{t`No zones configured yet.`}</p>}
          {zones.data.map((zone) => (
            <Card key={zone.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="wrap-break-word">{zone.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{zone.hasOutside ? t`Has an outdoor area` : t`Indoor only`}</p>
                </div>
                <Button variant="outline" disabled={editor !== undefined} aria-label={t`Edit ${zone.name}`}
                  onClick={() => openEditor(zone.id)}>{t`Edit`}</Button>
              </CardHeader>
              <CardContent className="text-sm">
                {zone.tableNumbers.length === 0 ? t`No tables assigned.` : (
                  <ul className="flex flex-wrap gap-2">
                    {zone.tableNumbers.map((number) => <li key={number} className="rounded-md border px-2 py-1">{t`Table ${number}`}</li>)}
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
