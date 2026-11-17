import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { ThemeContext } from '@/providers/theme-context'
import { UsersPage } from './users'

describe('users page', () => {
  it('shows the creation form and the existing users with their roles', () => {
    i18n.activate('en')
    const client = new QueryClient()
    client.setQueryData(['current-user'], { id: 1, email: 'admin@example.com', created_at: '2026-01-01' })
    client.setQueryData(['roles'], [{ id: 3, name: 'reader', permissions: [] }])
    client.setQueryData(['users'], [{ id: 7, email: 'member@example.com', created_at: '2026-01-01T00:00:00.000Z', blocked: false, role: { id: 3, name: 'reader' } },
      { id: 8, email: 'fired@example.com', created_at: '2026-01-01T00:00:00.000Z', blocked: true, role: { id: 3, name: 'reader' } }])
    const markup = renderToStaticMarkup(
      <I18nProvider i18n={i18n}>
        <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>
          <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={['/users']}>
              <UsersPage />
            </MemoryRouter>
          </QueryClientProvider>
        </ThemeContext.Provider>
      </I18nProvider>,
    )

    expect(markup).toContain('Create user')
    expect(markup).toContain('type="password"')
    expect(markup).toContain('member@example.com')
    expect(markup).toContain('Edit user member@example.com')
    expect(markup).toContain('reader')
    expect(markup).toContain('Block user member@example.com')
    expect(markup).toContain('Unblock user fired@example.com')
    expect(markup).toContain('Blocked')
  })
})
