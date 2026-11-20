import { useLingui } from '@lingui/react/macro'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { PermissionMultiSelect } from '@/components/access/permission-multiselect'
import { PermissionList } from '@/components/access/permission-list'
import { RoleList } from '@/components/access/role-list'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreatePermission, useCreateRole, usePermissions, useRoles } from '@/features/access/hooks'
import { hasHttpStatus } from '@/features/access/application/http-error'
import { buildLinkWithRedirect } from '@/lib/redirect'

function AccessContent() {
  const { t } = useLingui()
  const location = useLocation()
  const [permissionName, setPermissionName] = useState('')
  const [roleName, setRoleName] = useState('')
  const [permissionIds, setPermissionIds] = useState<number[]>([])
  const permissions = usePermissions()
  const roles = useRoles()
  const permissionMutation = useCreatePermission({
    onSuccess: () => {
      setPermissionName('')
    },
  })
  const roleMutation = useCreateRole({
    onSuccess: () => {
      setRoleName('')
      setPermissionIds([])
    },
  })

  const errors = [permissions.error, roles.error, permissionMutation.error, roleMutation.error]
  if (errors.some((error) => hasHttpStatus(error, 401))) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  const submitPermission = (event: FormEvent) => {
    event.preventDefault()
    if (permissionName.trim()) permissionMutation.mutate(permissionName.trim())
  }
  const submitRole = (event: FormEvent) => {
    event.preventDefault()
    if (roleName.trim() && permissions.isSuccess) {
      roleMutation.mutate({ name: roleName.trim(), permissionIds })
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t`Roles and permissions`}</h1>
        <p className="text-sm text-muted-foreground">{t`Create, edit and delete roles and permissions.`}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t`Create permission`}</CardTitle></CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={submitPermission}>
              <Label htmlFor="permission-name">{t`Permission name`}</Label>
              <Input id="permission-name" value={permissionName} onChange={(event) => setPermissionName(event.target.value)} maxLength={100} required placeholder="products:read" />
              {permissionMutation.isError && <p role="alert" className="text-sm text-destructive">
                {hasHttpStatus(permissionMutation.error, 409)
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
                {permissions.data && <PermissionMultiSelect permissions={permissions.data} selected={permissionIds} onChange={setPermissionIds} />}
              </fieldset>
              {roleMutation.isError && <p role="alert" className="text-sm text-destructive">
                {hasHttpStatus(roleMutation.error, 409)
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
              <PermissionList permissions={permissions.data} />
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
              <RoleList roles={roles.data} permissions={permissions.data ?? []} />
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
