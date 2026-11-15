// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/test/setup-dom'
import type { LegacyHeader as Header } from '@tanstack/react-table/legacy'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AppWrapper } from '@/test/utils'
import { TextInputFilter } from '@/components/product-table/components/filters/text-input-filter'
import type { FilterComponentProps } from '@/components/product-table/filters'

let user: ReturnType<typeof userEvent.setup>

// Helper to create mock props
const createMockProps = (overrides?: Partial<FilterComponentProps<object, unknown>>) => {
  const mockColumn = {
    columnDef: {
      header: 'Test Header',
    },
    getFilterValue: vi.fn().mockReturnValue(''),
    setFilterValue: vi.fn(),
  }

  const mockHeader = {
    column: mockColumn,
  } as unknown as Header<object, unknown>

  const mockInputRef = { current: null } as React.RefObject<HTMLInputElement | null>
  const mockOnChange = vi.fn()

  return {
    inputRef: mockInputRef,
    header: mockHeader,
    onChange: mockOnChange,
    ...overrides,
  }
}

describe('TextInputFilter', () => {
  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('renders input field with correct attributes', () => {
    const props = createMockProps()

    render(
      <AppWrapper>
        <TextInputFilter {...props} />
      </AppWrapper>,
    )

    const input = screen.getByTestId('product-table-filter-input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveAttribute('tabIndex', '0')
    expect(input).toHaveAttribute('data-slot', 'input')
  })

  it('displays placeholder with uppercase header text', () => {
    const props = createMockProps({
      header: {
        column: {
          columnDef: {
            header: 'store name',
          },
          getFilterValue: vi.fn().mockReturnValue(''),
          setFilterValue: vi.fn(),
        },
      } as unknown as Header<object, unknown>,
    })

    render(
      <AppWrapper>
        <TextInputFilter {...props} />
      </AppWrapper>,
    )

    const input = screen.getByTestId('product-table-filter-input')
    expect(input).toHaveAttribute('placeholder', 'STORE NAME')
  })

  it('displays current filter value in input', async () => {
    const mockGetFilterValue = vi.fn().mockReturnValue('test filter')
    const mockSetFilterValue = vi.fn()
    const props = createMockProps({
      header: {
        column: {
          columnDef: { header: 'Test Header' },
          getFilterValue: mockGetFilterValue,
          setFilterValue: mockSetFilterValue,
        },
      } as unknown as Header<object, unknown>,
    })

    render(
      <AppWrapper>
        <TextInputFilter {...props} />
      </AppWrapper>,
    )

    const input = screen.getByTestId('product-table-filter-input') as HTMLInputElement
    await user.type(input, 'test filter')
    expect(mockSetFilterValue).toHaveBeenCalledWith('test filter')
  })

  it('handles empty filter value', async () => {
    const mockGetFilterValue = vi.fn().mockReturnValue(undefined)
    const props = createMockProps({
      header: {
        column: {
          columnDef: { header: 'Test Header' },
          getFilterValue: mockGetFilterValue,
          setFilterValue: vi.fn(),
        },
      } as unknown as Header<object, unknown>,
    })

    render(
      <AppWrapper>
        <TextInputFilter {...props} />
      </AppWrapper>,
    )

    const input = screen.getByTestId('product-table-filter-input') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('calls onChange prop when input value changes', () => {
    const mockOnChange = vi.fn()
    const mockSetFilterValue = vi.fn()
    const props = createMockProps({
      onChange: mockOnChange,
      header: {
        column: {
          columnDef: { header: 'Test Header' },
          getFilterValue: vi.fn().mockReturnValue(''),
          setFilterValue: mockSetFilterValue,
        },
      } as unknown as Header<object, unknown>,
    })

    render(
      <AppWrapper>
        <TextInputFilter {...props} />
      </AppWrapper>,
    )

    const input = screen.getByTestId('product-table-filter-input')

    fireEvent.change(input, { target: { value: 'new filter' } })

    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  it('calls header.column.setFilterValue when input value changes', () => {
    const mockSetFilterValue = vi.fn()
    const props = createMockProps({
      header: {
        column: {
          columnDef: { header: 'Test Header' },
          getFilterValue: vi.fn().mockReturnValue(''),
          setFilterValue: mockSetFilterValue,
        },
      } as unknown as Header<object, unknown>,
    })

    render(
      <AppWrapper>
        <TextInputFilter {...props} />
      </AppWrapper>,
    )

    const input = screen.getByTestId('product-table-filter-input')

    fireEvent.change(input, { target: { value: 'new filter' } })

    expect(mockSetFilterValue).toHaveBeenCalledTimes(1)
    expect(mockSetFilterValue).toHaveBeenCalledWith('new filter')
  })

  it('works without onChange prop', () => {
    const mockSetFilterValue = vi.fn()
    const props = createMockProps({
      onChange: undefined,
      header: {
        column: {
          columnDef: { header: 'Test Header' },
          getFilterValue: vi.fn().mockReturnValue(''),
          setFilterValue: mockSetFilterValue,
        },
      } as unknown as Header<object, unknown>,
    })

    render(
      <AppWrapper>
        <TextInputFilter {...props} />
      </AppWrapper>,
    )

    const input = screen.getByTestId('product-table-filter-input')

    fireEvent.change(input, { target: { value: 'test' } })

    expect(mockSetFilterValue).toHaveBeenCalledWith('test')
  })

  it('sets input ref correctly', () => {
    const mockInputRef = { current: null } as React.RefObject<HTMLInputElement | null>
    const props = createMockProps({
      inputRef: mockInputRef,
    })

    render(
      <AppWrapper>
        <TextInputFilter {...props} />
      </AppWrapper>,
    )

    expect(mockInputRef.current).toBeInstanceOf(HTMLInputElement)
    expect(mockInputRef.current).toHaveAttribute('data-testid', 'product-table-filter-input')
  })

  it('handles multiple rapid input changes', () => {
    const mockOnChange = vi.fn()
    const mockSetFilterValue = vi.fn()
    const props = createMockProps({
      onChange: mockOnChange,
      header: {
        column: {
          columnDef: { header: 'Test Header' },
          getFilterValue: vi.fn().mockReturnValue(''),
          setFilterValue: mockSetFilterValue,
        },
      } as unknown as Header<object, unknown>,
    })

    render(
      <AppWrapper>
        <TextInputFilter {...props} />
      </AppWrapper>,
    )

    const input = screen.getByTestId('product-table-filter-input')

    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'ab' } })
    fireEvent.change(input, { target: { value: 'abc' } })

    expect(mockOnChange).toHaveBeenCalledTimes(3)
    expect(mockSetFilterValue).toHaveBeenCalledTimes(3)
    expect(mockSetFilterValue).toHaveBeenLastCalledWith('abc')
  })
})
