import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccessApiError, createAccessApi } from './access-api'

afterEach(() => vi.unstubAllGlobals())

describe('access API', () => {
  it('lists permissions and roles with credentials', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 2, name: 'products:read' }])))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 3, name: 'reader', permissions: [{ id: 2, name: 'products:read' }] }])))
    vi.stubGlobal('fetch', fetch)
    const api = createAccessApi('https://api.example.com')

    await expect(api.listPermissions()).resolves.toEqual([{ id: 2, name: 'products:read' }])
    await expect(api.listRoles()).resolves.toEqual([{ id: 3, name: 'reader', permissions: [{ id: 2, name: 'products:read' }] }])
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://api.example.com/permissions', { credentials: 'include' })
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://api.example.com/roles', { credentials: 'include' })
  })

  it('creates permissions and roles with selected permission IDs', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2, name: 'products:read' }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 3, name: 'reader', permissions: [{ id: 2, name: 'products:read' }] }), { status: 201 }))
    vi.stubGlobal('fetch', fetch)
    const api = createAccessApi('https://api.example.com')

    await expect(api.createPermission('products:read')).resolves.toEqual({ id: 2, name: 'products:read' })
    await expect(api.createRole('reader', [2])).resolves.toEqual({ id: 3, name: 'reader', permissions: [{ id: 2, name: 'products:read' }] })
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://api.example.com/permissions', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'products:read' }),
    })
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://api.example.com/roles', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'reader', permissionIds: [2] }),
    })
  })

  it('updates and deletes permissions and roles, and changes user roles', async () => {
    const role = { id: 3, name: 'viewer', permissions: [] }
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2, name: 'products:edit' })))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(role)))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 5, email: 'a@b.co', role: { id: 3, name: 'viewer' } }])))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 5, email: 'a@b.co', role: { id: 3, name: 'viewer' } })))
    vi.stubGlobal('fetch', fetch)
    const api = createAccessApi('https://api.example.com')
    const json = { 'Content-Type': 'application/json' }

    await expect(api.updatePermission(2, 'products:edit')).resolves.toEqual({ id: 2, name: 'products:edit' })
    await expect(api.deletePermission(2)).resolves.toBeUndefined()
    await expect(api.updateRole(3, 'viewer', [])).resolves.toEqual(role)
    await expect(api.deleteRole(3)).resolves.toBeUndefined()
    await expect(api.listUsers()).resolves.toHaveLength(1)
    await expect(api.updateUserRole(5, 3)).resolves.toMatchObject({ id: 5 })
    expect(fetch.mock.calls).toEqual([
      ['https://api.example.com/permissions/2', { method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ name: 'products:edit' }) }],
      ['https://api.example.com/permissions/2', { method: 'DELETE', credentials: 'include' }],
      ['https://api.example.com/roles/3', { method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ name: 'viewer', permissionIds: [] }) }],
      ['https://api.example.com/roles/3', { method: 'DELETE', credentials: 'include' }],
      ['https://api.example.com/users', { credentials: 'include' }],
      ['https://api.example.com/users/5/role', { method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ roleId: 3 }) }],
    ])
  })

  it.each([401, 403, 409])('preserves HTTP %i errors', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })))
    await expect(createAccessApi('https://api.example.com').listRoles()).rejects.toMatchObject({
      name: 'AccessApiError', status,
    } satisfies Partial<AccessApiError>)
  })

  it('rejects malformed role responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 1, name: 'admin' }]))))
    await expect(createAccessApi('https://api.example.com').listRoles()).rejects.toThrow()
  })
})
