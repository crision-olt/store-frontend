import { useLingui } from '@lingui/react/macro'
import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserForm } from '@/components/users/user-form'
import { UsersTable } from '@/components/users/users-table'
import { useCreateUser, useUsers } from '@/features/users/hooks'
import { useRoles } from '@/features/access/hooks'
import { hasHttpStatus } from '@/features/users/application/http-error'
import { buildLinkWithRedirect } from '@/lib/redirect'

function UsersContent() {
  const { t } = useLingui()
  const location = useLocation()
  const [formKey, setFormKey] = useState(0)
  const users = useUsers()
  const roles = useRoles()
  const create = useCreateUser({
    onSuccess: () => {
      setFormKey((key) => key + 1)
    },
  })

  if ([users.error, roles.error, create.error].some((error) => hasHttpStatus(error, 401))) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t`Users`}</h1>
        <p className="text-sm text-muted-foreground">{t`Create users, change their email or password, and assign roles.`}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <Card className="w-full max-w-xl">
          <CardHeader><CardTitle>{t`Create user`}</CardTitle></CardHeader>
          <CardContent>
            {roles.isPending ? <p className="text-sm text-muted-foreground">{t`Loading roles…`}</p> : roles.isError ? (
              <div className="flex flex-col items-start gap-2">
                <p role="alert" className="text-sm text-destructive">{t`Could not load roles. Please try again.`}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => roles.refetch()}>{t`Try again`}</Button>
              </div>
            ) : (
              <UserForm key={formKey} idPrefix="new-user" roles={roles.data} passwordRequired
                submitLabel={t`Create user`} pending={create.isPending} error={create.error}
                onSubmit={({ password, ...input }) => password && create.mutate({ ...input, password })} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t`All users`}</CardTitle></CardHeader>
          <CardContent>
            {users.isError ? (
              <div className="flex flex-col items-start gap-2">
                <p role="alert" className="text-sm text-destructive">{t`Could not load users. Please try again.`}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => users.refetch()}>{t`Try again`}</Button>
              </div>
            ) : (
              <UsersTable users={users.data} roles={roles.data} isLoading={users.isPending} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function UsersPage() {
  return (
    <RequireAuth>
      <StoreLayout><UsersContent /></StoreLayout>
    </RequireAuth>
  )
}
