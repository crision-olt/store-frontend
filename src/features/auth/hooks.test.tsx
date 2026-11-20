// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import '@/test/setup-dom'
import { useCurrentUser, useLogin } from '@/features/auth/hooks'
import { getCurrentUser, login } from '@/lib/auth-api'
import { mutationKeys, queryKeys } from '@/lib/query-keys'

vi.mock('@/lib/auth-api', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
}))

it('reuses the current-user cache without rechecking a fresh session', () => {
  const client = new QueryClient()
  const user = { id: 1, email: 'user@example.com', created_at: '2026-01-01' }
  client.setQueryData(queryKeys.currentUser, user)
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  const { result } = renderHook(() => useCurrentUser(), { wrapper })
  expect(result.current.data).toEqual(user)
  expect(getCurrentUser).not.toHaveBeenCalled()
  client.clear()
})

it('keeps login as a POST mutation without overwriting the current-user query', async () => {
  const client = new QueryClient()
  const credentials = { email: 'user@example.com', password: 'password' }
  const user = { id: 1, email: credentials.email, created_at: '2026-01-01' }
  vi.mocked(login).mockResolvedValueOnce(user)
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  const { result } = renderHook(() => useLogin(), { wrapper })
  await act(async () => {
    expect(await result.current.mutateAsync(credentials)).toEqual(user)
  })
  expect(login).toHaveBeenCalledWith(credentials)
  expect(client.getMutationCache().getAll()[0].options.mutationKey).toEqual(mutationKeys.login)
  expect(client.getQueryData(queryKeys.currentUser)).toBeUndefined()
  client.clear()
})
