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

  it('updates and deletes permissions and roles', async () => {
    const role = { id: 3, name: 'viewer', permissions: [] }
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2, name: 'products:edit' })))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(role)))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    const api = createAccessApi('https://api.example.com')
    const json = { 'Content-Type': 'application/json' }

    await expect(api.updatePermission(2, 'products:edit')).resolves.toEqual({ id: 2, name: 'products:edit' })
    await expect(api.deletePermission(2)).resolves.toBeUndefined()
    await expect(api.updateRole(3, 'viewer', [])).resolves.toEqual(role)
    await expect(api.deleteRole(3)).resolves.toBeUndefined()
    expect(fetch.mock.calls).toEqual([
      ['https://api.example.com/permissions/2', { method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ name: 'products:edit' }) }],
      ['https://api.example.com/permissions/2', { method: 'DELETE', credentials: 'include' }],
      ['https://api.example.com/roles/3', { method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ name: 'viewer', permissionIds: [] }) }],
      ['https://api.example.com/roles/3', { method: 'DELETE', credentials: 'include' }],
    ])
  })

  it('lists, creates and updates users', async () => {
    const user = { id: 5, email: 'a@b.co', created_at: '2026-01-01T00:00:00.000Z', blocked: false, role: { id: 3, name: 'viewer' } }
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([user])))
      .mockResolvedValueOnce(new Response(JSON.stringify(user), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(user)))
    vi.stubGlobal('fetch', fetch)
    const api = createAccessApi('https://api.example.com')
    const json = { 'Content-Type': 'application/json' }

    await expect(api.listUsers()).resolves.toEqual([user])
    await expect(api.createUser({ email: 'a@b.co', password: 'secret-pass', roleId: 3 })).resolves.toEqual(user)
    await expect(api.updateUser(5, { email: 'a@b.co', roleId: 3 })).resolves.toEqual(user)
    expect(fetch.mock.calls).toEqual([
      ['https://api.example.com/users', { credentials: 'include' }],
      ['https://api.example.com/users', { method: 'POST', credentials: 'include', headers: json, body: JSON.stringify({ email: 'a@b.co', password: 'secret-pass', roleId: 3 }) }],
      ['https://api.example.com/users/5', { method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ email: 'a@b.co', roleId: 3 }) }],
    ])
  })

  it('blocks and unblocks users', async () => {
    const user = { id: 5, email: 'a@b.co', created_at: '2026-01-01T00:00:00.000Z', blocked: true, role: { id: 3, name: 'viewer' } }
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(user)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...user, blocked: false })))
    vi.stubGlobal('fetch', fetch)
    const api = createAccessApi('https://api.example.com')

    await expect(api.blockUser(5)).resolves.toMatchObject({ blocked: true })
    await expect(api.unblockUser(5)).resolves.toMatchObject({ blocked: false })
    expect(fetch.mock.calls).toEqual([
      ['https://api.example.com/users/5/block', { method: 'PUT', credentials: 'include' }],
      ['https://api.example.com/users/5/block', { method: 'DELETE', credentials: 'include' }],
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
