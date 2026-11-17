import { useLingui } from '@lingui/react/macro'
import { useMutationState, type MutationState } from '@tanstack/react-query'
import type { ProductInput } from '@/lib/products-api'

export function PendingProducts() {
  const { t } = useLingui()
  const pending = useMutationState<MutationState<unknown, Error, ProductInput>>({
    filters: { mutationKey: ['create-product'], status: 'pending' },
  })

  return pending.map(({ variables, submittedAt }) => variables && (
    <div key={submittedAt} role="status" className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-muted/40 p-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{variables.name}</p>
        <p className="truncate text-muted-foreground">{variables.sku}</p>
      </div>
      <span className="shrink-0 text-muted-foreground">{t`Creating product…`}</span>
    </div>
  ))
}
