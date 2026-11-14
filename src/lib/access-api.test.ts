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
