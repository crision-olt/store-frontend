import { getCurrentUser, login, logout, registerUser, watchSession } from '@/lib/auth-api'
import type { AuthRepository, Credentials } from '@/features/auth/domain/auth'

export class AuthApiAdapter implements AuthRepository {
  login(credentials: Credentials) {
    return login(credentials)
  }

  registerUser(credentials: Credentials) {
    return registerUser(credentials)
  }

  getCurrentUser() {
    return getCurrentUser()
  }

  watchSession(onBlocked: () => void) {
    return watchSession(onBlocked)
  }

  logout() {
    return logout()
  }
}
