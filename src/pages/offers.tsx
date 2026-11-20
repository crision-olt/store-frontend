import { useLingui } from '@lingui/react/macro'
import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateOfferPricing, isOfferAmountValid, isOfferMinimumValid } from '@/features/offers/domain/offer-pricing'
import { useOfferProductCatalog, useOffers, useSaveOffer } from '@/features/offers/hooks'
import { getOfferErrorStatus } from '@/features/offers/application/error-status'
import type { Offer, OfferInput } from '@/features/offers/domain/offer'
import { getProductErrorStatus } from '@/features/products/application/error-status'
import type { Product } from '@/features/products/domain/product'
import { localizedName } from '@/lib/localized-name'
import { buildLinkWithRedirect } from '@/lib/redirect'

const formatMoney = (locale: string) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })

function OfferForm({ offer, products, saving, error, onCancel, onSave }: {
  offer?: Offer
  products: Product[]
  saving: boolean
  error: unknown
  onCancel: () => void
  onSave: (input: OfferInput) => void
}) {
  const { t, i18n } = useLingui()
  const [name, setName] = useState(offer?.name ?? '')
  const [nameEs, setNameEs] = useState(offer?.nameEs ?? '')
  const [kind, setKind] = useState<OfferInput['kind']>(offer?.kind ?? 'menu')
  const [amount, setAmount] = useState(offer ? String(offer.amount) : '')
  const [minimum, setMinimum] = useState(offer?.minimumDistinctProducts?.toString() ?? '')
  const [selected, setSelected] = useState(() => new Set(offer?.productIds))
  const [search, setSearch] = useState('')
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter(({ name, nameEs, sku }) =>
      name.toLowerCase().includes(term) || (nameEs ?? '').toLowerCase().includes(term) || sku.toLowerCase().includes(term),
    )
  }, [products, search])
  const selectedIds = [...selected]
  const unavailable = selectedIds.filter((id) => !byId.has(id))
  const value = Number(amount)
  const validAmount = isOfferAmountValid(kind, amount)
  const { subtotalCents, total: calculatedTotal } = calculateOfferPricing(
    kind, value, selectedIds.map((id) => byId.get(id)?.price ?? 0),
  )
  const fixed = kind === 'menu'
  const threshold = !fixed && minimum !== '' ? Number(minimum) : undefined
  const validThreshold = threshold === undefined || isOfferMinimumValid(minimum, selected.size)
  const valid = name.trim().length > 0 && nameEs.trim().length > 0 &&
    selected.size > 0 && unavailable.length === 0 && validAmount && validThreshold
  const money = formatMoney(i18n.locale)
  const total = validAmount ? calculatedTotal : undefined

  const toggle = (id: number) => setSelected((previous) => {
    const next = new Set(previous)
    if (next.has(id)) next.delete(id)
    else if (next.size < 100) next.add(id)
    return next
  })
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (valid && !saving) onSave({
      name: name.trim(), nameEs: nameEs.trim(), kind, amount: value, productIds: selectedIds,
      ...(threshold === undefined ? {} : { minimumDistinctProducts: threshold }),
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle>{offer ? t`Edit offer` : t`Create offer`}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <fieldset disabled={saving} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="offer-name">{t`Name (English)`}</Label>
              <Input id="offer-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="offer-name-es">{t`Name (Spanish)`}</Label>
              <Input id="offer-name-es" required maxLength={100} value={nameEs} onChange={(event) => setNameEs(event.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="offer-kind">{t`Offer type`}</Label>
                <Select value={kind} disabled={saving} onValueChange={(next) => {
                  if (next !== null && next !== kind) {
                    setKind(next)
                    setAmount('')
                    setMinimum('')
                  }
                }}>
                  <SelectTrigger id="offer-kind" className="w-full">
                    <SelectValue>{fixed ? t`Menu` : t`Promotion`}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="menu">{t`Menu`}</SelectItem>
                    <SelectItem value="promotion">{t`Promotion`}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="offer-amount">{fixed ? t`Fixed price (€)` : t`Discount (%)`}</Label>
                <Input id="offer-amount" type="number" step="0.01" min={fixed ? 0 : 0.01}
                  max={fixed ? 99999999.99 : 100} required value={amount} onChange={(event) => setAmount(event.target.value)} />
              </div>
            </div>
            <fieldset className="min-w-0">
              <legend className="mb-2 text-sm font-medium">{fixed ? t`Products in this bundle` : t`Eligible products`}</legend>
              {fixed && <p className="mb-2 text-sm text-muted-foreground">{t`The bundle includes one of each selected product.`}</p>}
              <Input type="search" aria-label={t`Find products`} placeholder={t`Find products`}
                value={search} onChange={(event) => setSearch(event.target.value)} />
              <div className="mt-2 max-h-52 overflow-auto rounded-md border">
                {visible.map((product) => (
                  <label key={product.id} className="flex min-h-10 items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0">
                    <input type="checkbox" className="size-4 shrink-0 accent-primary" checked={selected.has(product.id)}
                      disabled={selected.size >= 100 && !selected.has(product.id)} onChange={() => toggle(product.id)} />
                    <span className="min-w-0 flex-1 wrap-anywhere">
                      {localizedName(product.name, product.nameEs, i18n.locale)} <span className="text-muted-foreground">{product.sku}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{money.format(product.price)}</span>
                  </label>
                ))}
                {visible.length === 0 && <p className="p-3 text-sm text-muted-foreground">{t`No matching products.`}</p>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t`Selected products: ${selected.size} of 100`}</p>
              {unavailable.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p role="alert" className="text-sm text-destructive">{t`Remove unavailable products before saving.`}</p>
                  <Button type="button" size="sm" variant="outline" onClick={() =>
                    setSelected(new Set(selectedIds.filter((id) => byId.has(id))))
                  }>{t`Remove unavailable products`}</Button>
                </div>
              )}
            </fieldset>
            {!fixed && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="offer-minimum">{t`Minimum different products (optional)`}</Label>
                <Input id="offer-minimum" type="number" step={1} min={1} max={Math.max(1, selected.size)}
                  value={minimum} onChange={(event) => setMinimum(event.target.value)}
                  aria-describedby="offer-minimum-help" aria-invalid={!validThreshold} />
                <p id="offer-minimum-help" className="text-sm text-muted-foreground">
                  {validThreshold
                    ? t`Leave blank to require every selected product. Extra units of the same product do not count toward the minimum.`
                    : t`Enter a whole number between 1 and the number of eligible products.`}
                </p>
              </div>
            )}
            {threshold !== undefined && validThreshold && validAmount && unavailable.length === 0 && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm">
                {t`Qualifies with any ${threshold} different products from the selected list.`}
              </p>
            )}
            {threshold === undefined && selected.size > 0 && unavailable.length === 0 && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm tabular-nums">
                <p>{t`Products subtotal`}: {money.format(subtotalCents / 100)}</p>
                {total !== undefined && <p className="font-semibold">{t`Bundle total`}: {money.format(total)}</p>}
              </div>
            )}
            {error ? <p role="alert" className="text-sm text-destructive">{t`Could not save this offer. Check the price and selected products, then try again.`}</p> : null}
            <div className="flex justify-end gap-2">
              {offer && <Button type="button" variant="outline" onClick={onCancel}>{t`Cancel`}</Button>}
              <Button type="submit" disabled={!valid || saving}>{saving ? t`Saving…` : offer ? t`Save` : t`Create offer`}</Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  )
}

function OffersContent() {
  const { t, i18n } = useLingui()
  const location = useLocation()
  const [editing, setEditing] = useState<Offer>()
  const [formVersion, setFormVersion] = useState(0)
  const offers = useOffers({ retry: false })
  const catalog = useOfferProductCatalog({ retry: false })
  const save = useSaveOffer(editing?.id, {
    onSuccess: () => {
      setEditing(undefined)
      setFormVersion((current) => current + 1)
    },
  })
  if ([offers.error, save.error].some((error) => getOfferErrorStatus(error) === 401)
    || getProductErrorStatus(catalog.error) === 401) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }
  const products = catalog.data
  const money = formatMoney(i18n.locale)
  const percent = new Intl.NumberFormat(i18n.locale, { style: 'percent', maximumFractionDigits: 2 })
  const selectOffer = (offer?: Offer) => {
    save.reset()
    setEditing(offer)
    setFormVersion((current) => current + 1)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t`Menus and promotions`}</h1>
        <p className="text-sm text-muted-foreground">{t`Bundle products with a fixed menu price or a percentage discount.`}</p>
      </header>
      {offers.isError || catalog.isError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">{t`Could not load offers or products.`}</p>
          <Button size="sm" variant="outline" disabled={offers.isFetching || catalog.isFetching} onClick={() => {
            if (offers.isError) void offers.refetch()
            if (catalog.isError) void catalog.refetch()
          }}>{t`Try again`}</Button>
        </div>
      ) : !offers.data || !products ? (
        <p role="status" className="text-sm text-muted-foreground">{t`Loading offers and products…`}</p>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t`Saved offers`}</CardTitle></CardHeader>
            <CardContent>
              {offers.data.length === 0 ? <p className="text-sm text-muted-foreground">{t`No offers yet.`}</p> : (
                <ul role="list" className="divide-y">
                  {offers.data.map((offer) => (
                    <li key={offer.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 wrap-anywhere">
                        <p className="text-sm font-medium">{localizedName(offer.name, offer.nameEs, i18n.locale)}</p>
                        <p className="text-sm text-muted-foreground">{offer.kind === 'menu'
                          ? `${t`Menu`} · ${money.format(offer.amount)}`
                          : `${t`Promotion`} · ${percent.format(offer.amount / 100)}`}</p>
                        {offer.minimumDistinctProducts !== undefined && (
                          <p className="text-sm text-muted-foreground">
                            {t`Any ${offer.minimumDistinctProducts} different eligible products`}
                          </p>
                        )}
                      </div>
                      <Button type="button" size="sm" variant="outline" aria-label={t`Edit ${localizedName(offer.name, offer.nameEs, i18n.locale)}`}
                        disabled={save.isPending} onClick={() => selectOffer(offer)}>{t`Edit`}</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <OfferForm key={formVersion} offer={editing} products={products} saving={save.isPending}
            error={save.error} onCancel={() => selectOffer()} onSave={(input) => save.mutate(input)} />
        </div>
      )}
    </div>
  )
}

export function OffersPage() {
  return <RequireAuth><StoreLayout><OffersContent /></StoreLayout></RequireAuth>
}
