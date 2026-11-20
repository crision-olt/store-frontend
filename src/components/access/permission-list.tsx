import { useLingui } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { accessUseCases } from '@/features/access/access'
import type { Permission } from '@/features/access/domain/access'
import { hasHttpStatus } from '@/features/access/application/http-error'

function PermissionRow({ permission }: { permission: Permission }) {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const [name, setName] = useState<string | null>(null)
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['permissions'] }),
    queryClient.invalidateQueries({ queryKey: ['roles'] }),
  ])
  const update = useMutation({
    mutationFn: (value: string) => accessUseCases.updatePermission(permission.id, value),
    onSuccess: async () => {
      setName(null)
      await refresh()
    },
  })
  const remove = useMutation({
    mutationFn: () => accessUseCases.deletePermission(permission.id),
    onSuccess: refresh,
  })
  const error = update.error ?? remove.error
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (name?.trim()) update.mutate(name.trim())
  }

  return (
    <li className="flex flex-col gap-1">
      {name === null ? (
        <div className="flex items-center justify-between gap-2">
          <span className="break-all text-sm">{permission.name}</span>
          <div className="flex shrink-0 gap-1">
            <Button type="button" variant="outline" size="sm" aria-label={t`Edit permission ${permission.name}`}
              onClick={() => { update.reset(); remove.reset(); setName(permission.name) }}>
              {t`Edit`}
            </Button>
            <Button type="button" variant="outline" size="sm" aria-label={t`Delete permission ${permission.name}`}
              disabled={remove.isPending}
              onClick={() => { if (window.confirm(t`Delete permission ${permission.name}?`)) remove.mutate() }}>
              {t`Delete`}
            </Button>
          </div>
        </div>
      ) : (
        <form className="flex items-center gap-2" onSubmit={submit}>
          <Input aria-label={t`Permission name`} value={name} maxLength={100} required
            onChange={(event) => setName(event.target.value)} />
          <Button type="submit" size="sm" disabled={!name.trim() || update.isPending}>{t`Save`}</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setName(null)}>{t`Cancel`}</Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {hasHttpStatus(error, 409)
            ? t`This permission is protected, already exists, or is still assigned to a role.`
            : t`Could not update permission. Please try again.`}
        </p>
      )}
    </li>
  )
}

export function PermissionList({ permissions }: { permissions: Permission[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {permissions.map((permission) => <PermissionRow key={permission.id} permission={permission} />)}
    </ul>
  )
}
