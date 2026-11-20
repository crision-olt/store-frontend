import type { Role } from '@/features/access/domain/access'

export type User = {
  id: number
  email: string
  created_at: string
  blocked: boolean
  role: { id: number; name: string }
}

export type UserInput = { email: string; roleId: number; password?: string }

export interface UserRepository {
  listUsers(): Promise<User[]>
  listRoles(): Promise<Role[]>
  createUser(input: UserInput & { password: string }): Promise<User>
  updateUser(id: number, input: UserInput): Promise<User>
  blockUser(id: number): Promise<User>
  unblockUser(id: number): Promise<User>
}
