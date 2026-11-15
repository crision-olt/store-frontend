import { useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserForm } from '@/components/users/user-form'
import { UserList } from '@/components/users/user-list'
import { AccessApiError, createUser, listRoles, listUsers } from '@/lib/access-api'
import { buildLinkWithRedirect } from '@/lib/redirect'

function UsersContent() {
  const { t } = useLingui()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [formKey, setFormKey] = useState(0)
  const users = useQuery({ queryKey: ['users'], queryFn: listUsers, retry: false })
  const roles = useQuery({ queryKey: ['roles'], queryFn: listRoles, retry: false })
  const create = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      setFormKey((key) => key + 1)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  if ([users.error, roles.error, create.error].some((error) => error instanceof AccessApiError && error.status === 401)) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t`Users`}</h1>
        <p className="text-sm text-muted-foreground">{t`Create users, change their email or password, and assign roles.`}</p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
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
            {users.isPending ? <p>{t`Loading users…`}</p> : users.isError ? (
              <div className="flex flex-col items-start gap-2">
                <p role="alert" className="text-sm text-destructive">{t`Could not load users. Please try again.`}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => users.refetch()}>{t`Try again`}</Button>
              </div>
            ) : users.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t`No users yet.`}</p>
            ) : (
              <UserList users={users.data} roles={roles.data ?? []} />
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
