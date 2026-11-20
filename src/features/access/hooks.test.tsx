// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { useCreateRole, useDeletePermission, useRoles, useUpdateRole } from './hooks'
import { queryKeys } from '@/lib/query-keys'

const accessUseCaseMocks = vi.hoisted(() => ({
  listPermissions: vi.fn(),
  listRoles: vi.fn(),
  createPermission: vi.fn(),
  createRole: vi.fn(),
  updatePermission: vi.fn(),
  deletePermission: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
}))

vi.mock('./access', () => ({ accessUseCases: accessUseCaseMocks }))

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('access endpoint hooks', () => {
  it('shares one roles request across consumers using the canonical roles key', async () => {
    const client = new QueryClient()
    const roles = [{ id: 3, name: 'reader', permissions: [] }]
    accessUseCaseMocks.listRoles.mockResolvedValue(roles)
    const wrapper = createWrapper(client)
    const first = renderHook(() => useRoles(), { wrapper })
    const second = renderHook(() => useRoles(), { wrapper })

    await waitFor(() => {
      expect(first.result.current.isSuccess).toBe(true)
      expect(second.result.current.data).toEqual(roles)
    })

    expect(accessUseCaseMocks.listRoles).toHaveBeenCalledTimes(1)
    expect(client.getQueryData(queryKeys.roles)).toEqual(roles)
    client.clear()
  })

  it('invalidates roles and users after updating a role', async () => {
    const client = new QueryClient()
    const role = { id: 3, name: 'manager', permissions: [] }
    client.setQueryData(queryKeys.roles, [])
    client.setQueryData(queryKeys.users, [])
    accessUseCaseMocks.updateRole.mockResolvedValue(role)
    const { result } = renderHook(() => useUpdateRole(), { wrapper: createWrapper(client) })

    await act(async () => {
      await result.current.mutateAsync({ id: 3, name: role.name, permissionIds: [] })
    })

    expect(accessUseCaseMocks.updateRole).toHaveBeenCalledWith(3, role.name, [])
    expect(client.getQueryCache().find({ queryKey: queryKeys.roles })?.state.isInvalidated).toBe(true)
    expect(client.getQueryCache().find({ queryKey: queryKeys.users })?.state.isInvalidated).toBe(true)
    client.clear()
  })

  it('invalidates the roles cache after creating a role', async () => {
    const client = new QueryClient()
    client.setQueryData(queryKeys.roles, [])
    accessUseCaseMocks.createRole.mockResolvedValue({ id: 4, name: 'reader', permissions: [] })
    const { result } = renderHook(() => useCreateRole(), { wrapper: createWrapper(client) })

    await act(async () => {
      await result.current.mutateAsync({ name: 'reader', permissionIds: [] })
    })

    expect(accessUseCaseMocks.createRole).toHaveBeenCalledWith('reader', [])
    expect(client.getQueryCache().find({ queryKey: queryKeys.roles })?.state.isInvalidated).toBe(true)
    client.clear()
  })

  it('invalidates permissions and roles after deleting a permission', async () => {
    const client = new QueryClient()
    client.setQueryData(queryKeys.permissions, [])
    client.setQueryData(queryKeys.roles, [])
    accessUseCaseMocks.deletePermission.mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeletePermission(), { wrapper: createWrapper(client) })

    await act(async () => { await result.current.mutateAsync(2) })

    expect(accessUseCaseMocks.deletePermission.mock.calls[0]?.[0]).toBe(2)
    expect(client.getQueryCache().find({ queryKey: queryKeys.permissions })?.state.isInvalidated).toBe(true)
    expect(client.getQueryCache().find({ queryKey: queryKeys.roles })?.state.isInvalidated).toBe(true)
    client.clear()
  })
})
