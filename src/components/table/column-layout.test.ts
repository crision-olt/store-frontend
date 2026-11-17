// @vitest-environment jsdom
import { useTable } from '@tanstack/react-table'
import { tableFeatureSet } from '@/components/table/features'
import { renderHook } from '@testing-library/react'
import { computeColumnLayout } from '@/components/table/column-layout'
import { TableFactory } from '@/test/factory/table'
import '@/test/setup-dom'

const useTestTable = (meta?: { width?: string }, columnPinning?: { start: string[]; end: string[] }) =>
  useTable({
    features: tableFeatureSet,
    data: TableFactory.createData(1),
    columns: TableFactory.createColumns(false, meta),
    state: columnPinning ? { columnPinning } : undefined,
  })

const layoutFor = (
  sizeMode: 'auto' | 'fixed' | 'full',
  width: number,
  meta?: { width?: string },
  columnPinning?: { start: string[]; end: string[] },
) => {
  const { result } = renderHook(() => useTestTable(meta, columnPinning))
  return computeColumnLayout(result.current, sizeMode, width)
}

describe('computeColumnLayout', () => {
  test('stretches the columns to fill the width in full mode', () => {
    const layout = layoutFor('full', 1200)

    expect(layout.totalSize).toBe('100%')
    expect([...layout.sizes.values()]).toEqual(Array(6).fill(200))
  })

  test('keeps the column sizes when they already exceed the width', () => {
    const layout = layoutFor('full', 600)

    expect([...layout.sizes.values()]).toEqual(Array(6).fill(150))
  })

  test('does not stretch the columns in fixed mode', () => {
    const layout = layoutFor('fixed', 1200)

    expect([...layout.sizes.values()]).toEqual(Array(6).fill(150))
    expect(layout.totalSize).toBe('900px')
  })

  test('uses the default sizes and an auto width in auto mode', () => {
    const layout = layoutFor('auto', 1200)

    expect(layout.totalSize).toBe('auto')
    expect([...layout.sizes.values()]).toEqual(Array(6).fill(150))
  })

  test('applies pixel and percentage widths from the column meta', () => {
    expect([...layoutFor('full', 1200, { width: '100px' }).sizes.values()]).toEqual(Array(6).fill(100 * 2))
    // Each column takes 50% of the width left once the fixed columns are subtracted (all of it here)
    expect([...layoutFor('full', 1200, { width: '50%' }).sizes.values()]).toEqual(Array(6).fill(600))
  })

  test('computes the pinned offsets from the resolved sizes', () => {
    const layout = layoutFor('full', 1200, undefined, { start: ['id', 'firstName'], end: ['createdAt'] })

    expect(layout.starts.get('id')).toBe(0)
    expect(layout.starts.get('firstName')).toBe(200)
    expect(layout.afters.get('createdAt')).toBe(0)
    expect(layout.allStarts.get('lastName')).toBe(400)
  })
})
