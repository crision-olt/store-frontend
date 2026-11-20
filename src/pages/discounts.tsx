import { useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { isDiscountAmountValid } from '@/features/discounts/domain/discount-rules'
import { getDiscountErrorStatus } from '@/features/discounts/application/error-status'
import { listDiscountsUseCase, listRolesUseCase, saveDiscountUseCase } from '@/features/discounts/operations'
import type { Discount, DiscountInput, DiscountRole } from '@/features/discounts/domain/discount'
import { localizedName } from '@/lib/localized-name'
import { buildLinkWithRedirect } from '@/lib/redirect'

const key = ['discounts'] as const
const formatMoney = (locale: string) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })

function DiscountForm({ discount, roles, saving, error, onCancel, onSave }: {
  discount?: Discount
  roles: DiscountRole[]
  saving: boolean
  error: unknown
  onCancel: () => void
  onSave: (input: DiscountInput) => void
}) {
  const { t } = useLingui()
  const [name, setName] = useState(discount?.name ?? '')
  const [nameEs, setNameEs] = useState(discount?.nameEs ?? '')
  const [kind, setKind] = useState<DiscountInput['kind']>(discount?.kind ?? 'percentage')
  const [amount, setAmount] = useState(discount ? String(discount.amount) : '')
  const [roleIds, setRoleIds] = useState<number[]>(discount?.roleIds ?? [])
  const value = Number(amount)
  const validAmount = isDiscountAmountValid(kind, amount)
  const roleSet = new Set(roles.map((role) => role.id))
  const valid = name.trim().length > 0 && nameEs.trim().length > 0 && validAmount &&
    roleIds.length > 0 && roleIds.every((id) => roleSet.has(id))

  const toggleRole = (id: number) => setRoleIds((previous) =>
    previous.includes(id) ? previous.filter((selectedId) => selectedId !== id) : [...previous, id],
  )

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (valid && !saving) onSave({
      name: name.trim(),
      nameEs: nameEs.trim(),
      kind,
      amount: value,
      roleIds,
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{discount ? t`Edit discount` : t`Create discount`}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <fieldset disabled={saving} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="discount-name">{t`Name (English)`}</Label>
              <Input id="discount-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="discount-name-es">{t`Name (Spanish)`}</Label>
              <Input id="discount-name-es" required maxLength={100} value={nameEs} onChange={(event) => setNameEs(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="discount-kind">{t`Discount type`}</Label>
              <Select value={kind} disabled={saving} onValueChange={(next) => {
                if (next !== null && next !== kind) {
                  setKind(next)
                  setAmount('')
                }
              }}>
                <SelectTrigger id="discount-kind" className="w-full">
                  <SelectValue>{kind === 'percentage' ? t`Percentage` : t`Fixed amount`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t`Percentage`}</SelectItem>
                  <SelectItem value="fixed_amount">{t`Fixed amount`}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="discount-amount">{kind === 'percentage' ? t`Discount (%)` : t`Discount amount (€)`}</Label>
              <Input id="discount-amount" type="number" step="0.01" min="0.01"
                max={kind === 'percentage' ? 100 : 99999999.99} required value={amount}
                onChange={(event) => setAmount(event.target.value)} />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">{t`Roles allowed to use this discount`}</legend>
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t`No roles exist yet.`} <Link className="underline underline-offset-4" to="/access">{t`Create a role`}</Link>
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {roles.map((role) => (
                    <label key={role.id} className="flex min-h-9 items-center gap-2 text-sm">
                      <input type="checkbox" className="size-4 accent-primary" checked={roleIds.includes(role.id)}
                        onChange={() => toggleRole(role.id)} />
                      {role.name}
                    </label>
                  ))}
                </div>
              )}
              {roleIds.length === 0 && roles.length > 0 && (
                <p className="text-sm text-muted-foreground">{t`Select at least one role.`}</p>
              )}
            </fieldset>
            <p className="text-sm text-muted-foreground">{t`This discount applies to the invoice total, regardless of purchased products.`}</p>
            {error ? <p role="alert" className="text-sm text-destructive">{t`Could not save this discount. Check the amount and selected roles, then try again.`}</p> : null}
            <div className="flex justify-end gap-2">
              {discount && <Button type="button" variant="outline" onClick={onCancel}>{t`Cancel`}</Button>}
              <Button type="submit" disabled={!valid || saving}>
                {saving ? t`Saving…` : discount ? t`Save` : t`Create discount`}
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  )
}

function DiscountsContent() {
  const { t, i18n } = useLingui()
  const location = useLocation()
  const client = useQueryClient()
  const [editing, setEditing] = useState<Discount>()
  const [formVersion, setFormVersion] = useState(0)
  const discounts = useQuery({ queryKey: key, queryFn: ({ signal }) => listDiscountsUseCase(signal), retry: false })
  const roles = useQuery({ queryKey: ['roles'], queryFn: listRolesUseCase, retry: false })
  const save = useMutation({
    mutationFn: (input: DiscountInput) => saveDiscountUseCase(input, editing?.id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key })
      setEditing(undefined)
      setFormVersion((current) => current + 1)
    },
  })

  if ([discounts.error, roles.error, save.error].some((error) => getDiscountErrorStatus(error) === 401)) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  const money = formatMoney(i18n.locale)
  const percent = new Intl.NumberFormat(i18n.locale, { style: 'percent', maximumFractionDigits: 2 })
  const selectDiscount = (discount?: Discount) => {
    save.reset()
    setEditing(discount)
    setFormVersion((current) => current + 1)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t`Discounts`}</h1>
        <p className="text-sm text-muted-foreground">{t`Create invoice-wide discounts and choose which roles can use them.`}</p>
      </header>
      <p role="status" className="text-sm text-muted-foreground">
        {t`Discounts can be configured here, but applying them to invoices is not available yet.`}
      </p>
      {discounts.isError || roles.isError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">{t`Could not load discounts or roles.`}</p>
          <Button size="sm" variant="outline" disabled={discounts.isFetching || roles.isFetching} onClick={() => {
            if (discounts.isError) void discounts.refetch()
            if (roles.isError) void roles.refetch()
          }}>{t`Try again`}</Button>
        </div>
      ) : !discounts.data || !roles.data ? (
        <p role="status" className="text-sm text-muted-foreground">{t`Loading discounts and roles…`}</p>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t`Saved discounts`}</CardTitle></CardHeader>
            <CardContent>
              {discounts.data.length === 0 ? <p className="text-sm text-muted-foreground">{t`No discounts yet.`}</p> : (
                <ul role="list" className="divide-y">
                  {discounts.data.map((discount) => (
                    <li key={discount.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 wrap-anywhere">
                        <p className="text-sm font-medium">{localizedName(discount.name, discount.nameEs, i18n.locale)}</p>
                        <p className="text-sm text-muted-foreground">
                          {discount.kind === 'percentage'
                            ? percent.format(discount.amount / 100)
                            : money.format(discount.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t`Allowed roles`}: {discount.roleIds.map((id) =>
                            roles.data.find((role) => role.id === id)?.name ?? String(id),
                          ).join(', ')}
                        </p>
                      </div>
                      <Button type="button" size="sm" variant="outline"
                        aria-label={t`Edit ${localizedName(discount.name, discount.nameEs, i18n.locale)} discount`}
                        disabled={save.isPending} onClick={() => selectDiscount(discount)}>{t`Edit`}</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <DiscountForm key={formVersion} discount={editing} roles={roles.data} saving={save.isPending}
            error={save.error} onCancel={() => selectDiscount()} onSave={(input) => save.mutate(input)} />
        </div>
      )}
    </div>
  )
}

export function DiscountsPage() {
  return <RequireAuth><StoreLayout><DiscountsContent /></StoreLayout></RequireAuth>
}
