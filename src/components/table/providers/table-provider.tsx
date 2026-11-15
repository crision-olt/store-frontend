import type { FC, PropsWithChildren } from 'react'
import { createContext, useMemo, useContext, useRef, useEffect, useState } from 'react'

export interface TableContextType {
  ref: React.MutableRefObject<HTMLDivElement | null>
  tbodyRef: React.MutableRefObject<HTMLTableSectionElement | null>
  sizeRef: React.MutableRefObject<HTMLDivElement | null>
  scrollRef: React.MutableRefObject<HTMLDivElement | null>
  sizeRect: {
    height: number
    width: number
  }
  scrollPosition: {
    scrollLeft: number
    scrollTop: number
    offsetWidth: number
    offsetHeight: number
    scrollWidth: number
    scrollHeight: number
  }
}

const TableContext = createContext<TableContextType | undefined>(undefined)

export const TableProvider: FC<PropsWithChildren> = ({ children }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sizeRef = useRef<HTMLDivElement | null>(null)
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null)
  const [sizeRect, setSizeRect] = useState({
    height: 0,
    width: 0,
  })
  const [scrollPosition, setScrollPosition] = useState({
    scrollLeft: 0,
    scrollTop: 0,
    offsetWidth: 0,
    offsetHeight: 0,
    scrollWidth: 0,
    scrollHeight: 0,
  })

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

    const handleScroll = () => {
      setScrollPosition({
        scrollLeft: scrollEl.scrollLeft,
        scrollTop: scrollEl.scrollTop,
        offsetWidth: scrollEl.offsetWidth,
        offsetHeight: scrollEl.offsetHeight,
        scrollWidth: scrollEl.scrollWidth,
        scrollHeight: scrollEl.scrollHeight,
      })
    }

    scrollEl.addEventListener('scroll', handleScroll)
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const value = useMemo(
    () => ({ ref, scrollRef, sizeRef, tbodyRef, sizeRect, scrollPosition }),
    [ref, scrollRef, sizeRef, tbodyRef, sizeRect, scrollPosition],
  )
  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export const useTableContext = (): TableContextType => {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error('useTableContext must be called inside TableProvider')
  }
  return context
}
