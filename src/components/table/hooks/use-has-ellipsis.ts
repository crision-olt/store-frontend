import { useLayoutEffect, useState, type RefObject } from 'react'

const isClipped = (element: HTMLElement) =>
  element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight

// True while the element's content is clipped (text truncated by an ellipsis or a line clamp)
export const useHasEllipsis = (ref: RefObject<HTMLElement | null>) => {
  const [hasEllipsis, setHasEllipsis] = useState(false)

  // One observer per element: size changes (column resize, window resize) can truncate the content
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(() => setHasEllipsis(isClipped(element)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  // The content can also change without resizing the element; React skips the update when the value is the same
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (ref.current) setHasEllipsis(isClipped(ref.current))
  })

  return hasEllipsis
}
