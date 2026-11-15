import { useLayoutEffect, useState, type RefObject } from 'react'

// True while the element's content is clipped (text truncated by an ellipsis or a line clamp)
export const useHasEllipsis = (ref: RefObject<HTMLElement | null>) => {
  const [hasEllipsis, setHasEllipsis] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const check = () =>
      setHasEllipsis(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(element)
    return () => observer.disconnect()
  })

  return hasEllipsis
}
