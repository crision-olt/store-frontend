// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import '@/test/setup-dom'
import { render, screen } from '@testing-library/react'

import { SearchXIcon } from 'lucide-react'

import { ProductTableFeedbackState } from '@/components/product-table/components/product-table-feedback-state'

describe('ProductTableFeedbackState', () => {
  it('should render correctly', async () => {
    render(<ProductTableFeedbackState header={<SearchXIcon />} title="No results" subtitle="No results found." />)

    const feedback = screen.getByTestId('product-table-feedback-state')
    expect(feedback).toBeInTheDocument()
  })
})
