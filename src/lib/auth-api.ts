import { z } from 'zod'
import type { LoginValues } from '@/lib/auth-schemas'
import { resolveServiceUrl } from '@/lib/http'

const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  created_at: z.string(),
})

export class AuthApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Authentication request failed with HTTP ${status}`)
    this.name = 'AuthApiError'
    this.status = status
  }
}

export function createAuthApi(serviceUrl: string) {
  async function submit(path: string, values: LoginValues) {
    const response = await fetch(resolveServiceUrl(serviceUrl, path), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: values.email, password: values.password }),
    })
    if (!response.ok) throw new AuthApiError(response.status)
    return userSchema.parse(await response.json())
  }

  return {
    login: (values: LoginValues) => submit('/auth/login', values),
    registerUser: (values: LoginValues) => submit('/auth/register', values),
    async getCurrentUser() {
      const response = await fetch(resolveServiceUrl(serviceUrl, '/auth/me'), {
        credentials: 'include',
      })
      if (!response.ok) throw new AuthApiError(response.status)
      return userSchema.parse(await response.json())
    },
    // The server pushes a "blocked" event when an administrator blocks this account.
    watchSession(onBlocked: () => void) {
      const source = new EventSource(resolveServiceUrl(serviceUrl, '/auth/events'), { withCredentials: true })
      source.addEventListener('blocked', () => {
        source.close()
        onBlocked()
      })
      return () => source.close()
    },
    async logout() {
      const response = await fetch(resolveServiceUrl(serviceUrl, '/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) throw new AuthApiError(response.status)
    },
  }
}

export const { login, registerUser, getCurrentUser, watchSession, logout } = createAuthApi(import.meta.env.AUTH_SERVICE_URL)
