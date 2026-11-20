import {
  blockUser,
  createUser,
  listRoles,
  listUsers,
  unblockUser,
  updateUser,
} from '@/lib/access-api'
import type { UserInput, UserRepository } from '@/features/users/domain/user'

export class UsersApiAdapter implements UserRepository {
  listUsers() {
    return listUsers()
  }

  listRoles() {
    return listRoles()
  }

  createUser(input: UserInput & { password: string }) {
    return createUser(input)
  }

  updateUser(id: number, input: UserInput) {
    return updateUser(id, input)
  }

  blockUser(id: number) {
    return blockUser(id)
  }

  unblockUser(id: number) {
    return unblockUser(id)
  }
}
