import { createAuthUseCases } from '@/features/auth/application/auth'
import { AuthApiAdapter } from '@/features/auth/infrastructure/auth-api-adapter'

export const authUseCases = createAuthUseCases(new AuthApiAdapter())
export const { login, registerUser, getCurrentUser, watchSession, logout } = authUseCases
export type { AuthUser, Credentials } from '@/features/auth/domain/auth'
