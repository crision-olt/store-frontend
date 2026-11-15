// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from 'vitest'

import '@/test/setup-dom'
import type { ReactNode } from 'react'

import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { getCoreRowModel, getSortedRowModel, useLegacyTable } from '@tanstack/react-table/legacy'
import { renderHook } from '@testing-library/react'

import { TableFactory, type Person } from '@/test/factory/table'
import { AppWrapper } from '@/test/utils'
import { Table } from '@/components/table'
import { TableProvider, useTableContext } from '@/components/table/providers/table-provider'

const Wrapper = ({
  data,
  columns,
  children,
}: {
  data: Person[]
  columns: ColumnDef<Person, unknown>[]
  children: ReactNode
}) => {
  const table = useLegacyTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel<Person>(),
    getSortedRowModel: getSortedRowModel<Person>(),
    columnResizeMode: 'onChange',
    enableColumnResizing: false,
    defaultColumn: {
      minSize: 0,
    },
  })

  return (
    <AppWrapper>
      <Table<Person> table={table} feedbackState={children} />
    </AppWrapper>
  )
}

describe('TableProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should provide context values correctly', () => {
    const { result } = renderHook(() => useTableContext(), {
      wrapper: ({ children }) => (
        <AppWrapper>
          <TableProvider>{children}</TableProvider>
        </AppWrapper>
      ),
    })

    expect(result.current).toStrictEqual({
      ref: { current: null },
      scrollRef: { current: null },
      sizeRef: { current: null },
      tbodyRef: { current: null },
      sizeRect: { width: 0, height: 0 },
      scrollPosition: {
        scrollLeft: 0,
        scrollTop: 0,
        offsetWidth: 0,
        offsetHeight: 0,
        scrollWidth: 0,
        scrollHeight: 0,
      },
    })
  })

  test('should throw error when useTableContext is called outside TableProvider', () => {
    // 1. Suppress console.error (React logs)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => null)

    // 2. Suppress JSDOM "Uncaught" error reporting
    const preventDefault = (e: ErrorEvent) => e.preventDefault()
    globalThis.addEventListener('error', preventDefault)

    expect(() => {
      renderHook(() => useTableContext())
    }).toThrow('useTableContext must be called inside TableProvider')

    // 3. Cleanup
    globalThis.removeEventListener('error', preventDefault)
    consoleSpy.mockRestore()
  })

  test('should have stable references', () => {
    const data = TableFactory.createData(1)
    const columns = TableFactory.createColumns()

    const { result, rerender } = renderHook(() => useTableContext(), {
      wrapper: ({ children }) => (
        <Wrapper data={data} columns={columns}>
          {children}
        </Wrapper>
      ),
    })

    const firstRender = result.current
    expect(firstRender.ref.current).toBeInstanceOf(HTMLDivElement)
    expect(firstRender.scrollRef.current).toBeInstanceOf(HTMLDivElement)
    expect(firstRender.sizeRef.current).toBeInstanceOf(HTMLDivElement)
    expect(firstRender.tbodyRef.current).toBeInstanceOf(HTMLTableSectionElement)

    rerender()

    const secondRender = result.current

    expect(firstRender).toBe(secondRender)
    expect(firstRender.ref).toBe(secondRender.ref)
    expect(firstRender.scrollRef).toBe(secondRender.scrollRef)
    expect(firstRender.sizeRef).toBe(secondRender.sizeRef)
    expect(firstRender.tbodyRef).toBe(secondRender.tbodyRef)
    expect(firstRender.ref.current).toBe(secondRender.ref.current)
    expect(firstRender.scrollRef.current).toBe(secondRender.scrollRef.current)
    expect(firstRender.sizeRef.current).toBe(secondRender.sizeRef.current)
    expect(firstRender.tbodyRef.current).toBe(secondRender.tbodyRef.current)
  })
})
