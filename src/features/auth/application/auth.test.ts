import { createAuthUseCases } from './auth'
import { AuthApiAdapter } from '@/features/auth/infrastructure/auth-api-adapter'
import { AuthApiError, login } from '@/lib/auth-api'

vi.mock('@/lib/auth-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/auth-api')>(),
  login: vi.fn(),
}))

describe('authentication use cases', () => {
  it('delegates login, registration, session, and logout operations to the repository', async () => {
    const credentials = { email: 'member@example.com', password: 'secret-pass' }
    const user = { id: 1, email: credentials.email, created_at: '2026-01-01T00:00:00.000Z' }
    const stopWatching = vi.fn()
    const repository = {
      login: vi.fn().mockResolvedValue(user),
      registerUser: vi.fn().mockResolvedValue(user),
      getCurrentUser: vi.fn().mockResolvedValue(user),
      watchSession: vi.fn().mockReturnValue(stopWatching),
      logout: vi.fn().mockResolvedValue(undefined),
    }
    const useCases = createAuthUseCases(repository)
    const onBlocked = vi.fn()

    await expect(useCases.login(credentials)).resolves.toEqual(user)
    await expect(useCases.registerUser(credentials)).resolves.toEqual(user)
    await expect(useCases.getCurrentUser()).resolves.toEqual(user)
    expect(useCases.watchSession(onBlocked)).toBe(stopWatching)
    await useCases.logout()

    expect(repository.login).toHaveBeenCalledWith(credentials)
    expect(repository.registerUser).toHaveBeenCalledWith(credentials)
    expect(repository.watchSession).toHaveBeenCalledWith(onBlocked)
    expect(repository.logout).toHaveBeenCalledOnce()
  })

  it('preserves authentication transport errors and their status at the feature boundary', async () => {
    const error = new AuthApiError(403)
    vi.mocked(login).mockRejectedValueOnce(error)

    await expect(new AuthApiAdapter().login({ email: 'member@example.com', password: 'secret-pass' }))
      .rejects.toBe(error)
  })
})
