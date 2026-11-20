import { useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { getAllergenErrorStatus } from '@/features/allergens/application/error-status'
import { listAllergensUseCase } from '@/features/allergens/list-allergens'
import { buildLinkWithRedirect } from '@/lib/redirect'

function AllergensContent() {
  const { t, i18n } = useLingui()
  const { pathname, search } = useLocation()
  const allergens = useQuery({ queryKey: ['allergens'], queryFn: ({ signal }) => listAllergensUseCase(signal), retry: false })
  if (getAllergenErrorStatus(allergens.error) === 401) {
    return <Navigate to={buildLinkWithRedirect('/login', pathname + search)} replace />
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t`Allergens`}</h1>
        <p className="text-sm text-muted-foreground">{t`The 14 food allergen categories listed by the European Union.`}</p>
        <p className="text-sm text-muted-foreground">{t`This reference does not indicate which allergens a product contains.`}</p>
      </header>
      {allergens.isPending ? (
        <p role="status" className="text-sm text-muted-foreground">{t`Loading allergens…`}</p>
      ) : allergens.isError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">{t`Could not load allergens.`}</p>
          <Button variant="outline" size="sm" disabled={allergens.isFetching} onClick={() => void allergens.refetch()}>{t`Try again`}</Button>
        </div>
      ) : allergens.data.length > 0 ? (
        <ol role="list" className="grid gap-2 sm:grid-cols-2">
          {allergens.data.map(({ id, name, nameEs }) => (
            <li key={id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm font-medium">
              <span aria-hidden="true" className="w-6 shrink-0 text-muted-foreground tabular-nums">{id}</span>
              {i18n.locale === 'es' ? nameEs : name}
            </li>
          ))}
        </ol>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">{t`No allergens found.`}</p>
      )}
    </div>
  )
}

export function AllergensPage() {
  return (
    <RequireAuth>
      <StoreLayout><AllergensContent /></StoreLayout>
    </RequireAuth>
  )
}
