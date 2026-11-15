import { useLingui } from '@lingui/react/macro'
import { Loader2Icon } from 'lucide-react'
import type { FC } from 'react'

export type TableLoadingProps = {
  testId?: string
}

export const TableLoading: FC<TableLoadingProps> = ({ testId = 'product-table-loading' }) => {
  const { t } = useLingui()
  return (
    <div
      data-slot="product-table-loading"
      data-testid={testId}
      className="absolute inset-0 z-10 flex items-center justify-center bg-card/70"
    >
      <Loader2Icon role="status" aria-label={t`Loading`} className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}
