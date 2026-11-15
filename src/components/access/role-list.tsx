import { useLingui } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { PermissionChecklist } from '@/components/access/permission-checklist'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AccessApiError, deleteRole, updateRole, type Permission, type Role } from '@/lib/access-api'

type Draft = { name: string; permissionIds: number[] }

function RoleRow({ role, permissions }: { role: Role; permissions: Permission[] }) {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Draft | null>(null)
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['roles'] }),
    queryClient.invalidateQueries({ queryKey: ['users'] }),
  ])
  const update = useMutation({
    mutationFn: (value: Draft) => updateRole(role.id, value.name, value.permissionIds),
    onSuccess: async () => {
      setDraft(null)
      await refresh()
    },
  })
  const remove = useMutation({ mutationFn: () => deleteRole(role.id), onSuccess: refresh })
  const error = update.error ?? remove.error
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (draft?.name.trim()) update.mutate({ ...draft, name: draft.name.trim() })
  }

  return (
    <li className="flex flex-col gap-2">
      {draft === null ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="break-all text-sm font-medium">{role.name}</span>
            <div className="flex shrink-0 gap-1">
              <Button type="button" variant="outline" size="sm" aria-label={t`Edit role ${role.name}`}
                onClick={() => {
                  update.reset()
                  remove.reset()
                  setDraft({ name: role.name, permissionIds: role.permissions.map((permission) => permission.id) })
                }}>
                {t`Edit`}
              </Button>
              <Button type="button" variant="outline" size="sm" aria-label={t`Delete role ${role.name}`}
                disabled={remove.isPending}
                onClick={() => { if (window.confirm(t`Delete role ${role.name}?`)) remove.mutate() }}>
                {t`Delete`}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {role.permissions.length === 0
              ? <span className="text-sm text-muted-foreground">{t`No permissions assigned.`}</span>
              : role.permissions.map((permission) => <Badge key={permission.id} variant="secondary">{permission.name}</Badge>)}
          </div>
        </>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <Input aria-label={t`Role name`} value={draft.name} maxLength={100} required
            onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t`Permissions`}</legend>
            <PermissionChecklist permissions={permissions} selected={draft.permissionIds}
              onChange={(permissionIds) => setDraft({ ...draft, permissionIds })} />
          </fieldset>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!draft.name.trim() || update.isPending}>{t`Save`}</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setDraft(null)}>{t`Cancel`}</Button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error instanceof AccessApiError && error.status === 409
            ? t`This role is protected, already exists, or is assigned to users.`
            : t`Could not update role. Please try again.`}
        </p>
      )}
    </li>
  )
}

export function RoleList({ roles, permissions }: { roles: Role[]; permissions: Permission[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {roles.map((role) => <RoleRow key={role.id} role={role} permissions={permissions} />)}
    </ul>
  )
}
