// @vitest-environment jsdom
import { describe, expect, test } from 'vitest'

import '@/test/setup-dom'
import { render, screen } from '@testing-library/react'

import { AppWrapper } from '@/test/utils'
import { ProductTableLoading } from '@/components/product-table/components/product-table-loading'

describe('ProductTableLoading', () => {
  test('should render correctly', () => {
    render(
      <AppWrapper>
        <ProductTableLoading testId="my-test-id" />
      </AppWrapper>,
    )
    expect(screen.getByTestId('my-test-id')).toBeInTheDocument()
  })

  test('should render correctly with default testId', () => {
    render(
      <AppWrapper>
        <ProductTableLoading />
      </AppWrapper>,
    )
    expect(screen.getByTestId('product-table-loading')).toBeInTheDocument()
  })
})
