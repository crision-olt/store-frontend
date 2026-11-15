// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import '@/test/setup-dom'
import { useHasEllipsis } from '@/components/table/hooks/use-has-ellipsis'

const Probe = ({ text }: { text: string }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const hasEllipsis = useHasEllipsis(ref)
  return (
    <div ref={ref} data-ellipsis={hasEllipsis}>
      {text}
    </div>
  )
}

describe('useHasEllipsis', () => {
  const OriginalResizeObserver = globalThis.ResizeObserver
  afterEach(() => {
    globalThis.ResizeObserver = OriginalResizeObserver
  })

  test('creates a single observer across re-renders', () => {
    const created = vi.fn()
    globalThis.ResizeObserver = class extends OriginalResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super(callback)
        created()
      }
    }

    const { rerender } = render(<Probe text="a" />)
    rerender(<Probe text="b" />)
    rerender(<Probe text="c" />)

    expect(created).toHaveBeenCalledTimes(1)
  })

  test('detects clipped content when the text changes', () => {
    const { container, rerender } = render(<Probe text="short" />)
    const element = container.firstElementChild as HTMLElement
    expect(element).toHaveAttribute('data-ellipsis', 'false')

    Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 500 })
    Object.defineProperty(element, 'clientWidth', { configurable: true, value: 100 })
    rerender(<Probe text="a much longer text that does not fit" />)

    expect(element).toHaveAttribute('data-ellipsis', 'true')
  })
})
