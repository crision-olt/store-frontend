import { useLingui } from '@lingui/react/macro'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { hasHttpStatus } from '@/features/users/application/http-error'
import type { Role } from '@/features/access/domain/access'
import type { UserInput } from '@/features/users/domain/user'

type Props = {
  idPrefix: string
  roles: Role[]
  initial?: { email: string; roleId: number }
  passwordRequired: boolean
  submitLabel: string
  pending: boolean
  error: unknown
  onSubmit: (input: UserInput) => void
  onCancel?: () => void
}

export function UserForm({ idPrefix, roles, initial, passwordRequired, submitLabel, pending, error, onSubmit, onCancel }: Props) {
  const { t } = useLingui()
  const [email, setEmail] = useState(initial?.email ?? '')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState<number | null>(initial?.roleId ?? null)
  const selectedRole = roles.find((role) => role.id === roleId)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (roleId === null) return
    onSubmit({ email: email.trim(), roleId, ...(password ? { password } : {}) })
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-email`}>{t`Email`}</Label>
        <Input id={`${idPrefix}-email`} type="email" value={email} maxLength={255} required autoComplete="off"
          onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-password`}>{passwordRequired ? t`Password` : t`New password (optional)`}</Label>
        <Input id={`${idPrefix}-password`} type="password" value={password} minLength={8} maxLength={72}
          required={passwordRequired} autoComplete="new-password"
          onChange={(event) => setPassword(event.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-role`}>{t`Role`}</Label>
        <Select value={roleId === null ? null : String(roleId)} onValueChange={(value) => setRoleId(value ? Number(value) : null)}>
          <SelectTrigger id={`${idPrefix}-role`} className="w-full">
            <SelectValue>{selectedRole?.name ?? t`Select a role`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {hasHttpStatus(error, 409)
            ? t`A user with this email already exists.`
            : hasHttpStatus(error, 400)
              ? t`Check the email, the password (8 to 72 characters) and the role.`
              : t`Could not save the user. Please try again.`}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || roleId === null || !email.trim()}>{submitLabel}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{t`Cancel`}</Button>}
      </div>
    </form>
  )
}
