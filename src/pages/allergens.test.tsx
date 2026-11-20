// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n } from '@lingui/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import '@/test/setup-dom'
import { AppWrapper } from '@/test/utils'
import { AllergensPage } from '@/pages/allergens'
import { queryKeys } from '@/lib/query-keys'

vi.mock('@/components/auth/require-auth', () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/hooks/use-session-guard', () => ({ useSessionGuard: vi.fn() }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  i18n.loadAndActivate({ locale: 'en', messages: {} })
})

test('retries a failed request and displays allergen names in the selected language', async () => {
  vi.stubEnv('AUTH_SERVICE_URL', 'https://api.example.test')
  const fetchCatalog = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 500 }))
    .mockResolvedValueOnce(Response.json([
      { id: 1, code: 'gluten', name: 'Cereals containing gluten', nameEs: 'Cereales que contienen gluten' },
    ]))
  vi.stubGlobal('fetch', fetchCatalog)
  const client = new QueryClient()
  render(
    <AppWrapper>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/allergens']}>
          <AllergensPage />
        </MemoryRouter>
      </QueryClientProvider>
    </AppWrapper>,
  )

  await screen.findByText('Could not load allergens.')
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect((await screen.findByRole('listitem')).textContent).toContain('Cereals containing gluten')
  expect(fetchCatalog.mock.calls.filter(([url]) => url.endsWith('/allergens'))).toEqual([
    ['https://api.example.test/allergens', expect.objectContaining({ credentials: 'include' })],
    ['https://api.example.test/allergens', expect.objectContaining({ credentials: 'include' })],
  ])
  expect(client.getQueryCache().getAll().map(({ queryKey }) => queryKey)).toContainEqual(queryKeys.allergens)
  act(() => i18n.loadAndActivate({ locale: 'es', messages: {} }))
  expect(screen.getByRole('listitem').textContent).toContain('Cereales que contienen gluten')
})
