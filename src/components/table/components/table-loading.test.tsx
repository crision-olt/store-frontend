// @vitest-environment jsdom
import { describe, expect, test } from 'vitest'

import '@/test/setup-dom'
import { render, screen } from '@testing-library/react'

import { AppWrapper } from '@/test/utils'
import { TableLoading } from '@/components/table/components/table-loading'

describe('TableLoading', () => {
  test('should render correctly', () => {
    render(
      <AppWrapper>
        <TableLoading testId="my-test-id" />
      </AppWrapper>,
    )
    expect(screen.getByTestId('my-test-id')).toBeInTheDocument()
  })

  test('should render correctly with default testId', () => {
    render(
      <AppWrapper>
        <TableLoading />
      </AppWrapper>,
    )
    expect(screen.getByTestId('table-loading')).toBeInTheDocument()
  })
})
