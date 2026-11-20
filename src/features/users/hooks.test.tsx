// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { useCreateUser } from './hooks'
import { queryKeys } from '@/lib/query-keys'

const userUseCaseMocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  listRoles: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
}))

vi.mock('./users', () => ({ userUseCases: userUseCaseMocks }))

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('user endpoint hooks', () => {
  it('calls UI success callbacks before awaiting users cache invalidation', async () => {
    const client = new QueryClient()
    const events: string[] = []
    const input = { email: 'member@example.com', roleId: 3, password: 'password123' }
    const user = {
      id: 7,
      email: input.email,
      created_at: '2026-01-01T00:00:00.000Z',
      blocked: false,
      role: { id: 3, name: 'reader' },
    }
    client.setQueryData(queryKeys.users, [])
    userUseCaseMocks.createUser.mockResolvedValue(user)
    const { result } = renderHook(
      () => useCreateUser({
        onSuccess: async () => {
          expect(client.getQueryCache().find({ queryKey: queryKeys.users })?.state.isInvalidated).toBe(false)
          events.push('callback')
        },
      }),
      { wrapper: createWrapper(client) },
    )

    await act(async () => { await result.current.mutateAsync(input) })

    expect(userUseCaseMocks.createUser).toHaveBeenCalledTimes(1)
    expect(userUseCaseMocks.createUser.mock.calls[0]?.[0]).toEqual(input)
    expect(events).toEqual(['callback'])
    expect(client.getQueryCache().find({ queryKey: queryKeys.users })?.state.isInvalidated).toBe(true)
    client.clear()
  })
})
