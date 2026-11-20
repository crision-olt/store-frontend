import type { AuthRepository, Credentials } from '@/features/auth/domain/auth'

export function createAuthUseCases(repository: AuthRepository) {
  return {
    login: (credentials: Credentials) => repository.login(credentials),
    registerUser: (credentials: Credentials) => repository.registerUser(credentials),
    getCurrentUser: () => repository.getCurrentUser(),
    watchSession: (onBlocked: () => void) => repository.watchSession(onBlocked),
    logout: () => repository.logout(),
  }
}
