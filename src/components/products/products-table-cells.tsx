import { useLingui } from '@lingui/react/macro'

export function PriceCell({ value }: { value: number }) {
  const { i18n } = useLingui()
  return new Intl.NumberFormat(i18n.locale, { style: 'currency', currency: 'EUR' }).format(value)
}

export function DateCell({ value }: { value: string }) {
  const { i18n } = useLingui()
  return new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'medium' }).format(new Date(value))
}
