import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { AccessPage } from './access'

vi.mock('@/hooks/use-session-guard', () => ({ useSessionGuard: vi.fn() }))

function renderAccess(queryClient: QueryClient) {
  i18n.activate('en')
  queryClient.setQueryData(['current-user'], { id: 1, email: 'admin@example.com', created_at: '2026-01-01' })
  return renderToStaticMarkup(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/access']}>
          <AccessPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nProvider>,
  )
}

describe('access page', () => {
  it('shows creation forms and existing roles and permissions', () => {
    const client = new QueryClient()
    client.setQueryData(['permissions'], [{ id: 2, name: 'products:read' }])
    client.setQueryData(['roles'], [{ id: 3, name: 'reader', permissions: [{ id: 2, name: 'products:read' }] }])
    const markup = renderAccess(client)

    expect(markup).toContain('Create permission')
    expect(markup).toContain('Create role')
    expect(markup).toContain('products:read')
    expect(markup).toContain('reader')
    expect(markup).toContain('Select permissions')
    expect(markup).not.toContain('type="checkbox"')
    expect(markup).toContain('Edit role reader')
    expect(markup).toContain('Delete permission products:read')
    expect(markup).not.toContain('Role for')
  })
})
