import type { FC, PropsWithChildren, RefObject } from 'react'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type ScrollEdges = {
  /** The scroll container is scrolled all the way to the left. */
  atStart: boolean
  /** The scroll container is scrolled all the way to the right. */
  atEnd: boolean
}

export interface TableContextType {
  ref: RefObject<HTMLDivElement | null>
  tbodyRef: RefObject<HTMLTableSectionElement | null>
  sizeRef: RefObject<HTMLDivElement | null>
  scrollRef: RefObject<HTMLDivElement | null>
  sizeRect: {
    height: number
    width: number
  }
  scrollEdges: ScrollEdges
}

const TableContext = createContext<TableContextType | undefined>(undefined)

const readScrollEdges = (element: HTMLElement): ScrollEdges => ({
  atStart: element.scrollLeft <= 0,
  // 1px of tolerance for fractional scroll positions on high density screens
  atEnd: element.clientWidth + element.scrollLeft >= element.scrollWidth - 1,
})

export const TableProvider: FC<PropsWithChildren> = ({ children }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sizeRef = useRef<HTMLDivElement | null>(null)
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null)
  const [sizeRect, setSizeRect] = useState({ height: 0, width: 0 })
  const [scrollEdges, setScrollEdges] = useState<ScrollEdges>({ atStart: true, atEnd: true })

  useEffect(() => {
    if (!sizeRef.current) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSizeRect(entry.contentRect)
      }
    })

    observer.observe(sizeRef.current)
    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    // Only the edges are stored: scrolling between them must not re-render the table
    const update = () =>
      setScrollEdges((current) => {
        const next = readScrollEdges(scrollEl)
        return next.atStart === current.atStart && next.atEnd === current.atEnd ? current : next
      })

    update()
    scrollEl.addEventListener('scroll', update, { passive: true })
    // The edges also move when the container or the table change size
    const observer = new ResizeObserver(update)
    observer.observe(scrollEl)
    if (sizeRef.current) observer.observe(sizeRef.current)
    return () => {
      scrollEl.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [])

  const value = useMemo(() => ({ ref, scrollRef, sizeRef, tbodyRef, sizeRect, scrollEdges }), [sizeRect, scrollEdges])
  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export const useTableContext = (): TableContextType => {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error('useTableContext must be called inside TableProvider')
  }
  return context
}
