import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ThemeContext } from '@/providers/theme-context'
import { AccessPage } from './access'

function renderAccess(queryClient: QueryClient) {
  i18n.activate('en')
  queryClient.setQueryData(['current-user'], { id: 1, email: 'admin@example.com', created_at: '2026-01-01' })
  return renderToStaticMarkup(
    <I18nProvider i18n={i18n}>
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/access']}>
            <AccessPage />
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeContext.Provider>
    </I18nProvider>,
  )
}

describe('access page', () => {
  it('shows creation forms and existing roles and permissions', () => {
    const client = new QueryClient()
    client.setQueryData(['permissions'], [{ id: 2, name: 'products:read' }])
    client.setQueryData(['roles'], [{ id: 3, name: 'reader', permissions: [{ id: 2, name: 'products:read' }] }])
    client.setQueryData(['access-users'], [{ id: 7, email: 'member@example.com', role: { id: 3, name: 'reader' } }])
    const markup = renderAccess(client)

    expect(markup).toContain('Create permission')
    expect(markup).toContain('Create role')
    expect(markup).toContain('products:read')
    expect(markup).toContain('reader')
    expect(markup).toContain('type="checkbox"')
    expect(markup).toContain('Edit role reader')
    expect(markup).toContain('Delete permission products:read')
    expect(markup).toContain('member@example.com')
    expect(markup).toContain('Role for member@example.com')
  })
})
