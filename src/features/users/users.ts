import { createUserUseCases } from '@/features/users/application/users'
import { UsersApiAdapter } from '@/features/users/infrastructure/users-api-adapter'

export const userUseCases = createUserUseCases(new UsersApiAdapter())
export type { User, UserInput } from '@/features/users/domain/user'
export type { Role } from '@/features/access/domain/access'
