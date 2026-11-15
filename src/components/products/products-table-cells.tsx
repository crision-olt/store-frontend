import { useLingui } from '@lingui/react/macro'
import { Badge } from '@/components/ui/badge'

export function PriceCell({ value }: { value: number }) {
  const { i18n } = useLingui()
  return new Intl.NumberFormat(i18n.locale, { style: 'currency', currency: 'USD' }).format(value)
}

export function DateCell({ value }: { value: string }) {
  const { i18n } = useLingui()
  return new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'medium' }).format(new Date(value))
}

export function StockCell({ value }: { value: number }) {
  const { t } = useLingui()
  return value === 0 ? <Badge variant="destructive">{t`Out of stock`}</Badge> : value
}
