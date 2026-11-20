import { useLingui } from '@lingui/react/macro'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/features/auth/hooks'
import { hasHttpStatus } from '@/features/auth/application/http-error'
import { buildLinkWithRedirect } from '@/lib/redirect'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { t } = useLingui()
  const location = useLocation()
  const { isPending, error, refetch } = useCurrentUser()

  if (hasHttpStatus(error, 401)) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  if (error) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
        <p className="text-sm text-muted-foreground">{t`Could not verify your session.`}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t`Try again`}
        </Button>
      </main>
    )
  }

  if (isPending) {
    return (
      <main className="min-h-svh p-6" aria-busy="true">
        <Skeleton className="h-8 w-48" />
      </main>
    )
  }

  return children
}
