import { AuthApiError, createAuthApi } from './auth-api'

const credentials = { email: 'user@example.com', password: 'password123' }
const user = { id: 1, email: credentials.email, created_at: '2026-01-01T00:00:00.000Z' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('auth API', () => {
  it.each([
    ['login', '/auth/login'],
    ['registerUser', '/auth/register'],
  ] as const)('sends %s credentials to the service with cookies', async (method, path) => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(user), { status: method === 'registerUser' ? 201 : 200 }),
    )
    vi.stubGlobal('fetch', fetch)

    await expect(createAuthApi('https://auth.example.com')[method](credentials)).resolves.toEqual(user)
    expect(fetch).toHaveBeenCalledWith(`https://auth.example.com${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
  })

  it('exposes unsuccessful HTTP statuses to the form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))

    await expect(createAuthApi('https://auth.example.com').login(credentials)).rejects.toMatchObject({
      name: 'AuthApiError',
      status: 401,
    } satisfies Partial<AuthApiError>)
  })

  it('propagates network failures instead of treating them as success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')))

    await expect(createAuthApi('https://auth.example.com').login(credentials))
      .rejects.toThrow('Network unavailable')
  })

  it('rejects a successful response that does not match the user contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ email: credentials.email }), { status: 200 }),
    ))

    await expect(createAuthApi('https://auth.example.com').login(credentials)).rejects.toThrow()
  })

  it.each(['', 'not-a-url', 'javascript:alert(1)'])(
    'rejects invalid AUTH_SERVICE_URL values: %s',
    async (url) => {
      const fetch = vi.fn()
      vi.stubGlobal('fetch', fetch)

      await expect(createAuthApi(url).login(credentials))
        .rejects.toThrow('AUTH_SERVICE_URL must be an absolute HTTP(S) URL')
      expect(fetch).not.toHaveBeenCalled()
    },
  )

  it('calls back once when the server announces the account was blocked', () => {
    const listeners: Record<string, () => void> = {}
    const close = vi.fn()
    const EventSource = vi.fn(function () {
      return { addEventListener: (name: string, handler: () => void) => { listeners[name] = handler }, close }
    })
    vi.stubGlobal('EventSource', EventSource)
    const onBlocked = vi.fn()

    const stop = createAuthApi('https://auth.example.com').watchSession(onBlocked)
    expect(EventSource).toHaveBeenCalledWith('https://auth.example.com/auth/events', { withCredentials: true })
    listeners.blocked()

    expect(onBlocked).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalled()
    stop()
  })
})
