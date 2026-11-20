import { Dialog } from '@base-ui/react/dialog'
import { useLingui } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { UserForm } from '@/components/users/user-form'
import { Button } from '@/components/ui/button'
import { userUseCases } from '@/features/users/users'
import type { User } from '@/features/users/domain/user'
import type { Role } from '@/features/access/domain/access'
import { hasHttpStatus } from '@/features/users/application/http-error'

export function UserActions({ user, roles }: { user: User; roles: Role[] }) {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const update = useMutation({
    mutationFn: (input: Parameters<typeof userUseCases.updateUser>[1]) => userUseCases.updateUser(user.id, input),
    onSuccess: async () => {
      setEditing(false)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const toggleBlock = useMutation({
    mutationFn: () => (user.blocked ? userUseCases.unblockUser(user.id) : userUseCases.blockUser(user.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
  const confirmBlock = () => {
    if (user.blocked || window.confirm(t`Block ${user.email}? Their session will be closed immediately and they will not be able to sign in.`)) {
      toggleBlock.mutate()
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-end gap-2">
        <Dialog.Root open={editing} onOpenChange={(open) => {
          if (update.isPending) return
          if (open) { update.reset(); toggleBlock.reset() }
          setEditing(open)
        }}>
          <Dialog.Trigger render={<Button type="button" variant="outline" size="sm" />}
            aria-label={t`Edit user ${user.email}`}>
            {t`Edit`}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-4 overflow-y-auto rounded-xl border bg-background p-6 text-foreground shadow-lg outline-none">
              <Dialog.Title className="text-lg font-semibold">{t`Edit user`}</Dialog.Title>
              <UserForm idPrefix={`user-${user.id}`} roles={roles} initial={{ email: user.email, roleId: user.role.id }}
                passwordRequired={false} submitLabel={t`Save`} pending={update.isPending} error={update.error}
                onSubmit={(input) => update.mutate(input)} onCancel={() => setEditing(false)} />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <Button type="button" variant="outline" size="sm" disabled={toggleBlock.isPending}
          aria-label={user.blocked ? t`Unblock user ${user.email}` : t`Block user ${user.email}`}
          onClick={confirmBlock}>
          {user.blocked ? t`Unblock` : t`Block`}
        </Button>
      </div>
      {toggleBlock.isError && (
        <p role="alert" className="text-sm text-destructive">
          {hasHttpStatus(toggleBlock.error, 409)
            ? t`You cannot block your own account.`
            : t`Could not change the user status. Please try again.`}
        </p>
      )}
    </div>
  )
}
