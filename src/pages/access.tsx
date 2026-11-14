import { useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccessApiError, createPermission, createRole, listPermissions, listRoles } from '@/lib/access-api'
import { buildLinkWithRedirect } from '@/lib/redirect'

function AccessContent() {
  const { t } = useLingui()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [permissionName, setPermissionName] = useState('')
  const [roleName, setRoleName] = useState('')
  const [permissionIds, setPermissionIds] = useState<number[]>([])
  const permissions = useQuery({ queryKey: ['permissions'], queryFn: listPermissions, retry: false })
  const roles = useQuery({ queryKey: ['roles'], queryFn: listRoles, retry: false })
  const permissionMutation = useMutation({
    mutationFn: createPermission,
    onSuccess: async () => {
      setPermissionName('')
      await queryClient.invalidateQueries({ queryKey: ['permissions'] })
    },
  })
  const roleMutation = useMutation({
    mutationFn: ({ name, ids }: { name: string; ids: number[] }) => createRole(name, ids),
    onSuccess: async () => {
      setRoleName('')
      setPermissionIds([])
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })

  const errors = [permissions.error, roles.error, permissionMutation.error, roleMutation.error]
  if (errors.some((error) => error instanceof AccessApiError && error.status === 401)) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }
  if (errors.some((error) => error instanceof AccessApiError && error.status === 403)) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t`Roles and permissions`}</h1>
        <p role="alert" className="mt-4 text-sm text-destructive">
          {t`You need the access:manage permission to manage roles and permissions.`}
        </p>
      </div>
    )
  }

  const submitPermission = (event: FormEvent) => {
    event.preventDefault()
    if (permissionName.trim()) permissionMutation.mutate(permissionName.trim())
  }
  const submitRole = (event: FormEvent) => {
    event.preventDefault()
    if (roleName.trim() && permissions.isSuccess) {
      roleMutation.mutate({ name: roleName.trim(), ids: permissionIds })
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t`Roles and permissions`}</h1>
        <p className="text-sm text-muted-foreground">{t`Create permissions and assign them to new roles.`}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t`Create permission`}</CardTitle></CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={submitPermission}>
              <Label htmlFor="permission-name">{t`Permission name`}</Label>
              <Input id="permission-name" value={permissionName} onChange={(event) => setPermissionName(event.target.value)} maxLength={100} required placeholder="products:read" />
              {permissionMutation.isError && <p role="alert" className="text-sm text-destructive">
                {permissionMutation.error instanceof AccessApiError && permissionMutation.error.status === 409
                  ? t`This permission already exists.` : t`Could not create permission. Please try again.`}
              </p>}
              <Button type="submit" disabled={!permissionName.trim() || permissionMutation.isPending}>{t`Create permission`}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t`Create role`}</CardTitle></CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={submitRole}>
              <Label htmlFor="role-name">{t`Role name`}</Label>
              <Input id="role-name" value={roleName} onChange={(event) => setRoleName(event.target.value)} maxLength={100} required />
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium">{t`Permissions`}</legend>
                {permissions.isPending && <p className="text-sm text-muted-foreground">{t`Loading permissions…`}</p>}
                {permissions.isError && <p role="alert" className="text-sm text-destructive">{t`Could not load permissions. Please try again.`}</p>}
                {permissions.isError && <Button type="button" variant="outline" size="sm" onClick={() => permissions.refetch()}>{t`Try again`}</Button>}
                {permissions.isSuccess && permissions.data.length === 0 && <p className="text-sm text-muted-foreground">{t`No permissions yet.`}</p>}
                {permissions.data?.map((permission) => (
                  <label key={permission.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={permissionIds.includes(permission.id)}
                      onChange={(event) => setPermissionIds((current) => event.target.checked
                        ? [...current, permission.id]
                        : current.filter((id) => id !== permission.id))}
                    />
                    {permission.name}
                  </label>
                ))}
              </fieldset>
              {permissions.data?.some((permission) => permission.name === 'access:manage' && permissionIds.includes(permission.id)) && (
                <p className="text-sm text-muted-foreground">{t`The access:manage permission grants control over roles and permissions.`}</p>
              )}
              {roleMutation.isError && <p role="alert" className="text-sm text-destructive">
                {roleMutation.error instanceof AccessApiError && roleMutation.error.status === 409
                  ? t`This role already exists.` : t`Could not create role. Please try again.`}
              </p>}
              <Button type="submit" disabled={!roleName.trim() || roleMutation.isPending || !permissions.isSuccess}>{t`Create role`}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t`Permissions`}</CardTitle></CardHeader>
          <CardContent>
            {permissions.isPending ? <p>{t`Loading permissions…`}</p> : permissions.isError ? null : permissions.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t`No permissions yet.`}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {permissions.data.map((permission) => <li key={permission.id} className="break-all text-sm">{permission.name}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t`Roles`}</CardTitle></CardHeader>
          <CardContent>
            {roles.isPending ? <p>{t`Loading roles…`}</p> : roles.isError ? (
              <div className="flex flex-col items-start gap-2">
                <p role="alert" className="text-sm text-destructive">{t`Could not load roles. Please try again.`}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => roles.refetch()}>{t`Try again`}</Button>
              </div>
            ) : roles.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t`No roles yet.`}</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {roles.data.map((role) => (
                  <li key={role.id} className="flex flex-col gap-2">
                    <span className="break-all text-sm font-medium">{role.name}</span>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.length === 0
                        ? <span className="text-sm text-muted-foreground">{t`No permissions assigned.`}</span>
                        : role.permissions.map((permission) => <Badge key={permission.id} variant="secondary">{permission.name}</Badge>)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function AccessPage() {
  return (
    <RequireAuth>
      <StoreLayout><AccessContent /></StoreLayout>
    </RequireAuth>
  )
}
