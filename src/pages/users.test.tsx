// @vitest-environment jsdom
import '@/test/setup-dom'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { defineBoundingClientRect, defineClientDimensions } from '@/test/dom'
import { UsersPage } from './users'

vi.mock('@/hooks/use-session-guard', () => ({ useSessionGuard: () => undefined }))

defineBoundingClientRect()
defineClientDimensions()

function renderUsersPage() {
  i18n.loadAndActivate({ locale: 'en', messages: {} })
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  client.setQueryData(['current-user'], { id: 1, email: 'admin@example.com', created_at: '2026-01-01' })
  client.setQueryData(['roles'], [{ id: 3, name: 'reader', permissions: [] }, { id: 4, name: 'manager', permissions: [] }])
  client.setQueryData(['users'], [
    { id: 7, email: 'member@example.com', created_at: '2026-01-01T00:00:00.000Z', blocked: false, role: { id: 3, name: 'reader' } },
    { id: 8, email: 'fired@example.com', created_at: '2026-01-01T00:00:00.000Z', blocked: true, role: { id: 4, name: 'manager' } },
  ])
  render(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/users']}>
          <UsersPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nProvider>,
  )
}

describe('users page', () => {
  it('keeps creation and user management available in the shared table', async () => {
    const user = userEvent.setup()
    renderUsersPage()

    expect(screen.getByRole('button', { name: 'Create user' })).toBeVisible()
    const table = within(screen.getByRole('table'))
    expect(table.getByText('reader')).toBeVisible()
    expect(table.getByText('Blocked')).toBeVisible()
    expect(table.getByRole('button', { name: 'Block user member@example.com' })).toBeVisible()
    expect(table.getByRole('button', { name: 'Unblock user fired@example.com' })).toBeVisible()
    await user.click(table.getByRole('button', { name: 'Edit user member@example.com' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Edit user' }))
    expect(dialog.getByLabelText('Email')).toHaveValue('member@example.com')
    await user.click(dialog.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('configures visible columns while keeping email and actions available', async () => {
    const user = userEvent.setup()
    renderUsersPage()
    const table = within(screen.getByRole('table'))
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    expect(screen.getByRole('checkbox', { name: 'Email' })).toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByRole('checkbox', { name: 'Role' }))
    await user.keyboard('{Escape}')
    expect(table.queryByRole('columnheader', { name: /Role/ })).not.toBeInTheDocument()
    expect(table.getByRole('button', { name: 'Edit user member@example.com' })).toBeVisible()
  })

  it('combines email, role, and status filters and clears them from the toolbar', async () => {
    const user = userEvent.setup()
    renderUsersPage()
    const table = within(screen.getByRole('table'))
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    await user.type(screen.getByRole('textbox', { name: 'Filter by email' }), 'MEMBER')
    expect(table.getByText('member@example.com')).toBeVisible()
    expect(table.queryByText('fired@example.com')).not.toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'blocked')
    expect(screen.getByText('No users found.')).toBeVisible()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by role' }), '3')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Remove filter: Email' }))
    expect(screen.getByText('No users found.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Remove filter: Role' }))
    expect(table.getByText('fired@example.com')).toBeVisible()
    expect(table.queryByText('member@example.com')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(table.getByText('member@example.com')).toBeVisible()
    expect(table.getByText('fired@example.com')).toBeVisible()
  })
})
