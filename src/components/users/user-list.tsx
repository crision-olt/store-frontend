import { useLingui } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { UserForm } from '@/components/users/user-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updateUser, type AccessUser, type Role } from '@/lib/access-api'

function UserRow({ user, roles }: { user: AccessUser; roles: Role[] }) {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const update = useMutation({
    mutationFn: (input: Parameters<typeof updateUser>[1]) => updateUser(user.id, input),
    onSuccess: async () => {
      setEditing(false)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  if (editing) {
    return (
      <li>
        <UserForm idPrefix={`user-${user.id}`} roles={roles} initial={{ email: user.email, roleId: user.role.id }}
          passwordRequired={false} submitLabel={t`Save`} pending={update.isPending} error={update.error}
          onSubmit={(input) => update.mutate(input)} onCancel={() => setEditing(false)} />
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="break-all text-sm font-medium">{user.email}</span>
        <span className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="secondary">{user.role.name}</Badge>
        <Button type="button" variant="outline" size="sm" aria-label={t`Edit user ${user.email}`}
          onClick={() => { update.reset(); setEditing(true) }}>
          {t`Edit`}
        </Button>
      </div>
    </li>
  )
}

export function UserList({ users, roles }: { users: AccessUser[]; roles: Role[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {users.map((user) => <UserRow key={user.id} user={user} roles={roles} />)}
    </ul>
  )
}
