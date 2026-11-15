// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import '@/test/setup-dom'
import { render, screen } from '@testing-library/react'

import { SearchXIcon } from 'lucide-react'

import { TableFeedbackState } from '@/components/table/components/table-feedback-state'

describe('TableFeedbackState', () => {
  it('should render correctly', async () => {
    render(<TableFeedbackState header={<SearchXIcon />} title="No results" subtitle="No results found." />)

    const feedback = screen.getByTestId('table-feedback-state')
    expect(feedback).toBeInTheDocument()
  })
})
