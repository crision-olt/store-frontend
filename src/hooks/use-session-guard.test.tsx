// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import '@/test/setup-dom'
import { useSessionGuard } from '@/hooks/use-session-guard'
import { logout, watchSession } from '@/lib/auth-api'
import { ProductsApiError } from '@/lib/products-api'
import { SessionQueryProvider } from '@/providers/session-query-provider'

vi.mock('@/lib/auth-api', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
  watchSession: vi.fn(() => () => {}),
}))

let completeSave: (() => void) | undefined
let loginClient: QueryClient | undefined
let protectedClient: QueryClient

function ProtectedPage() {
  useSessionGuard()
  const client = useQueryClient()
  useEffect(() => { protectedClient = client }, [client])
  const mutation = useMutation({ mutationFn: async () => { throw new ProductsApiError(401) } })
  const pendingSave = useMutation({
    mutationFn: () => new Promise<void>((resolve) => { completeSave = resolve }),
    onSuccess: () => client.setQueryData(['private-data'], 'stale'),
  })

  return <>
    <button onClick={() => {
      void client.fetchQuery({
        queryKey: ['failed-query'],
        queryFn: async () => { throw new ProductsApiError(401) },
        retry: false,
      }).catch(() => {})
    }}>Fail query</button>
    <button onClick={() => mutation.mutate()}>Fail mutation</button>
    <button onClick={() => pendingSave.mutate()}>Start save</button>
    <button onClick={() => {
      void client.fetchQuery({
        queryKey: ['server-error'],
        queryFn: async () => { throw new ProductsApiError(500) },
        retry: false,
      }).catch(() => {})
    }}>Server error</button>
  </>
}

function LoginPage() {
  const location = useLocation()
  const client = useQueryClient()
  useEffect(() => { loginClient = client }, [client])
  const mutation = useMutation({ mutationFn: async () => { throw new ProductsApiError(401) } })
  return <>
    <p>Login: {location.search}</p>
    {location.state?.blocked && <p>Account blocked</p>}
    <button onClick={() => mutation.mutate()}>Invalid credentials</button>
    {mutation.isError && <p>Invalid credentials shown</p>}
  </>
}

beforeEach(() => {
  vi.clearAllMocks()
  completeSave = undefined
  loginClient = undefined
})

function setup() {
  render(
    <MemoryRouter initialEntries={['/products?search=milk']}>
      <SessionQueryProvider>
        <Routes>
          <Route path="/products" element={<ProtectedPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </SessionQueryProvider>
    </MemoryRouter>,
  )
  protectedClient.setQueryData(['private-data'], 'sensitive')
  return protectedClient
}

it.each(['Fail query', 'Fail mutation'])(
  'clears cached data and redirects after a protected %s returns 401',
  async (button) => {
    const client = setup()
    fireEvent.click(screen.getByRole('button', { name: button }))
    expect(await screen.findByText('Login: ?redirect=%2Fproducts%3Fsearch%3Dmilk')).toBeInTheDocument()
    expect(client.getQueryData(['private-data'])).toBeUndefined()

    fireEvent.click(screen.getByRole('button', { name: 'Invalid credentials' }))
    expect(await screen.findByText('Invalid credentials shown')).toBeInTheDocument()
  },
)

it('does not redirect for other request failures', async () => {
  const client = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Server error' }))
  await waitFor(() => expect(client.getQueryState(['server-error'])?.status).toBe('error'))
  expect(screen.getByRole('button', { name: 'Server error' })).toBeInTheDocument()
  expect(client.getQueryData(['private-data'])).toBe('sensitive')
})

it('preserves the blocked-account sign-out flow', async () => {
  const client = setup()
  const clear = vi.spyOn(client, 'clear')
  act(() => vi.mocked(watchSession).mock.calls[0][0]())
  expect(await screen.findByText('Account blocked')).toBeInTheDocument()
  expect(logout).toHaveBeenCalledOnce()
  expect(client.getQueryData(['private-data'])).toBeUndefined()
  expect(vi.mocked(logout).mock.invocationCallOrder[0]).toBeLessThan(clear.mock.invocationCallOrder[0])
})

it('still clears the session and reports a failed blocked-account logout', async () => {
  const failure = new Error('Logout unavailable')
  vi.mocked(logout).mockRejectedValueOnce(failure)
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const client = setup()
    act(() => vi.mocked(watchSession).mock.calls[0][0]())
    expect(await screen.findByText('Account blocked')).toBeInTheDocument()
    expect(client.getQueryData(['private-data'])).toBeUndefined()
    await waitFor(() => expect(error).toHaveBeenCalledWith('Blocked session logout failed', failure))
  } finally {
    error.mockRestore()
  }
})

it('keeps a late mutation from repopulating the next session cache', async () => {
  const client = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Start save' }))
  await waitFor(() => expect(completeSave).toBeDefined())
  fireEvent.click(screen.getByRole('button', { name: 'Fail query' }))
  await screen.findByText('Login: ?redirect=%2Fproducts%3Fsearch%3Dmilk')

  await act(async () => completeSave?.())
  await waitFor(() => expect(client.getQueryData(['private-data'])).toBe('stale'))
  expect(loginClient?.getQueryData(['private-data'])).toBeUndefined()
})
