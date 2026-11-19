import { useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { listTables, resizeTables, saveTable, TablesApiError, type RestaurantTable, type TableInput } from '@/lib/tables-api'
import { buildLinkWithRedirect } from '@/lib/redirect'

const key = ['restaurant-tables'] as const

function TableForm({ table, busy, onSave }: {
  table: RestaurantTable
  busy: boolean
  onSave: (number: number, input: TableInput) => void
}) {
  const { t } = useLingui()
  const [capacity, setCapacity] = useState(table.capacity)
  const [isOutside, setOutside] = useState(table.isOutside)
  const [isAccessible, setAccessible] = useState(table.isAccessible)

  return (
    <form className="flex flex-wrap items-end gap-4 border-b py-4 last:border-0"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(table.number, { capacity, isOutside, isAccessible })
      }}>
      <p className="w-full font-medium">{t`Table ${table.number}`}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`capacity-${table.number}`}>{t`Capacity for table ${table.number}`}</Label>
        <select id={`capacity-${table.number}`} value={capacity} disabled={busy}
          className="h-9 rounded-md border bg-background px-3 text-sm"
          onChange={(event) => {
            const value = Number(event.target.value)
            if (value === 2 || value === 4 || value === 6 || value === 8) setCapacity(value)
          }}>
          {[2, 4, 6, 8].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      <label className="flex min-h-9 items-center gap-2 text-sm">
        <input type="checkbox" checked={isOutside} disabled={busy}
          onChange={(event) => setOutside(event.target.checked)} />
        {t`Outside for table ${table.number}`}
      </label>
      <label className="flex min-h-9 items-center gap-2 text-sm">
        <input type="checkbox" checked={isAccessible} disabled={busy}
          onChange={(event) => setAccessible(event.target.checked)} />
        {t`Accessible for table ${table.number}`}
      </label>
      <Button type="submit" disabled={busy}>{t`Save table ${table.number}`}</Button>
    </form>
  )
}

function TablesContent() {
  const { t } = useLingui()
  const location = useLocation()
  const client = useQueryClient()
  const [count, setCount] = useState('')
  const [confirmation, setConfirmation] = useState<{ count: number, expectedCount: number }>()
  const tables = useQuery({ queryKey: key, queryFn: ({ signal }) => listTables(signal), retry: false })
  const resize = useMutation({
    mutationFn: ({ count, expectedCount }: { count: number, expectedCount: number }) => resizeTables(count, expectedCount),
    onSuccess: (data) => {
      client.setQueryData(key, data)
      setConfirmation(undefined)
    },
  })
  const save = useMutation({
    mutationFn: ({ number, input }: { number: number, input: TableInput }) => saveTable(number, input),
    onSuccess: (updated) => {
      client.setQueryData<RestaurantTable[]>(key, (previous) =>
        previous?.map((table) => table.number === updated.number ? updated : table))
    },
  })
  if ([tables.error, resize.error, save.error].some((error) => error instanceof TablesApiError && error.status === 401)) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }
  const busy = resize.isPending || save.isPending
  const target = Number(count)
  const validCount = count !== '' && Number.isInteger(target) && target >= 1 && target <= 50
  const submitCount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validCount || busy || !tables.data) return
    resize.reset()
    if (target < tables.data.length) setConfirmation({ count: target, expectedCount: tables.data.length })
    else resize.mutate({ count: target, expectedCount: tables.data.length })
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t`Tables`}</h1>
        <p className="text-sm text-muted-foreground">{t`Configure the number and settings of your restaurant tables.`}</p>
      </header>
      {tables.isError ? (
        <div>
          <p role="alert" className="text-sm text-destructive">{t`Could not load tables.`}</p>
          <Button variant="outline" onClick={() => void tables.refetch()}>{t`Try again`}</Button>
        </div>
      ) : !tables.data ? <p role="status">{t`Loading tables…`}</p> : (
        <>
          <Card>
            <CardHeader><CardTitle>{t`Table count`}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submitCount} className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="table-count">{t`Number of tables`}</Label>
                  <Input id="table-count" type="number" min="1" max="50" step="1" required
                    placeholder={String(tables.data.length)} value={count} disabled={busy}
                    onChange={(event) => { setCount(event.target.value); setConfirmation(undefined) }} />
                </div>
                <Button type="submit" disabled={!validCount || busy}>{t`Update table count`}</Button>
              </form>
              {confirmation && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p role="alert">{t`Tables above the new count will be permanently removed.`}</p>
                  <Button type="button" disabled={busy} onClick={() => resize.mutate(confirmation)}>{t`Remove tables`}</Button>
                  <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmation(undefined)}>{t`Cancel`}</Button>
                </div>
              )}
              {resize.isError && (
                <div className="mt-3">
                  <p role="alert" className="text-sm text-destructive">{t`Could not update the table count. Reload the tables and try again.`}</p>
                  <Button type="button" variant="outline" disabled={busy} onClick={() => {
                    setConfirmation(undefined)
                    resize.reset()
                    void tables.refetch()
                  }}>{t`Reload tables`}</Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t`Table settings`}</CardTitle></CardHeader>
            <CardContent>
              {tables.data.length === 0 && <p>{t`No tables configured yet.`}</p>}
              {save.isError && <p role="alert" className="text-sm text-destructive">{t`Could not save table settings.`}</p>}
              {tables.data.map((table) => (
                <TableForm key={`${table.number}-${table.capacity}-${table.isOutside}-${table.isAccessible}`}
                  table={table} busy={busy} onSave={(number, input) => save.mutate({ number, input })} />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export function TablesPage() {
  return <RequireAuth><StoreLayout><TablesContent /></StoreLayout></RequireAuth>
}
