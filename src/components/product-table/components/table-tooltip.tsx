import type { ReactElement, ReactNode } from 'react'
import { useRef } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useHasEllipsis } from '@/components/product-table/hooks/use-has-ellipsis'

type Props = {
  content: ReactNode
  disabled?: boolean
  className?: string
  testId?: string
  children: ReactNode
}

// Wraps `children` in a div that shows `content` as a tooltip, unless disabled
export const TableTooltip = ({ content, disabled, className, testId, children }: Props) => {
  const wrapper = <div className={className} data-testid={testId} />
  if (disabled)
    return (
      <div className={className} data-testid={testId}>
        {children}
      </div>
    )

  return (
    <Tooltip>
      <TooltipTrigger render={wrapper}>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  )
}

type EllipsisProps = {
  content: ReactNode
  disabled?: boolean
  wrapperClassName?: string
  ellipsisClassName?: string
  ellipsisSlot?: string
  testId?: string
  children: ReactNode
}

// Shows the tooltip only when the wrapped content is actually truncated
export const EllipsisTooltip = ({
  content,
  disabled,
  wrapperClassName,
  ellipsisClassName,
  ellipsisSlot,
  testId,
  children,
}: EllipsisProps): ReactElement => {
  const ellipsisRef = useRef<HTMLDivElement | null>(null)
  const hasEllipsis = useHasEllipsis(ellipsisRef)

  return (
    <TableTooltip
      content={content}
      className={wrapperClassName}
      testId={testId}
      disabled={disabled || !hasEllipsis || !children}
    >
      <div className={ellipsisClassName} data-slot={ellipsisSlot} ref={ellipsisRef}>
        {children}
      </div>
    </TableTooltip>
  )
}
