import { useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccessApiError, listUsers, updateUserRole, type AccessUser, type Role } from '@/lib/access-api'

function UserRow({ user, roles }: { user: AccessUser; roles: Role[] }) {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const change = useMutation({
    mutationFn: (roleId: number) => updateUserRole(user.id, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-users'] }),
  })

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="break-all text-sm">{user.email}</span>
        <Select value={String(user.role.id)} onValueChange={(value) => value && change.mutate(Number(value))}>
          <SelectTrigger className="w-40 shrink-0" aria-label={t`Role for ${user.email}`} disabled={change.isPending}>
            <SelectValue>{user.role.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {change.isError && (
        <p role="alert" className="text-sm text-destructive">
          {change.error instanceof AccessApiError && change.error.status === 409
            ? t`At least one user must keep the access:manage permission.`
            : t`Could not change the role. Please try again.`}
        </p>
      )}
    </li>
  )
}

export function UserRolesCard({ roles }: { roles: Role[] }) {
  const { t } = useLingui()
  const users = useQuery({ queryKey: ['access-users'], queryFn: listUsers, retry: false })

  return (
    <Card>
      <CardHeader><CardTitle>{t`Users`}</CardTitle></CardHeader>
      <CardContent>
        {users.isPending ? <p>{t`Loading users…`}</p> : users.isError ? (
          <div className="flex flex-col items-start gap-2">
            <p role="alert" className="text-sm text-destructive">{t`Could not load users. Please try again.`}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => users.refetch()}>{t`Try again`}</Button>
          </div>
        ) : users.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t`No users yet.`}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {users.data.map((user) => <UserRow key={user.id} user={user} roles={roles} />)}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
