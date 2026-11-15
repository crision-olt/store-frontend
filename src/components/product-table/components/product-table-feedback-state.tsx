import type { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ProductTableFeedbackStateProps = {
  header?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  className?: string
  testId?: string
}

/** Overlay shown over the table to give feedback to the user, such as an empty or error state. */
export const ProductTableFeedbackState: FC<ProductTableFeedbackStateProps> = ({
  header,
  title,
  subtitle,
  className,
  testId = 'product-table-feedback-state',
}) => (
  <div
    data-slot="product-table-feedback-state"
    data-testid={testId}
    className={cn('absolute inset-0 z-10 flex items-center justify-center bg-card', className)}
  >
    <div className="flex max-w-sm flex-col items-center gap-2 p-4 text-center">
      {header && <div className="text-muted-foreground [&_svg:not([class*='size-'])]:size-8">{header}</div>}
      {title && <p className="font-medium">{title}</p>}
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  </div>
)
