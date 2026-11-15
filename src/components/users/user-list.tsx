import { useLingui } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { UserForm } from '@/components/users/user-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AccessApiError, blockUser, unblockUser, updateUser, type AccessUser, type Role } from '@/lib/access-api'

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

  const toggleBlock = useMutation({
    mutationFn: () => (user.blocked ? unblockUser(user.id) : blockUser(user.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
  const confirmBlock = () => {
    if (user.blocked || window.confirm(t`Block ${user.email}? Their session will be closed immediately and they will not be able to sign in.`)) {
      toggleBlock.mutate()
    }
  }

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
    <li className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="break-all text-sm font-medium">{user.email}</span>
          <span className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {user.blocked && <Badge variant="destructive">{t`Blocked`}</Badge>}
          <Badge variant="secondary">{user.role.name}</Badge>
          <Button type="button" variant="outline" size="sm" aria-label={t`Edit user ${user.email}`}
            onClick={() => { update.reset(); toggleBlock.reset(); setEditing(true) }}>
            {t`Edit`}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={toggleBlock.isPending}
            aria-label={user.blocked ? t`Unblock user ${user.email}` : t`Block user ${user.email}`}
            onClick={confirmBlock}>
            {user.blocked ? t`Unblock` : t`Block`}
          </Button>
        </div>
      </div>
      {toggleBlock.isError && (
        <p role="alert" className="text-sm text-destructive">
          {toggleBlock.error instanceof AccessApiError && toggleBlock.error.status === 409
            ? t`You cannot block your own account.`
            : t`Could not change the user status. Please try again.`}
        </p>
      )}
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
