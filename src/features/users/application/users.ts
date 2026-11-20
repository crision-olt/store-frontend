import type { UserInput, UserRepository } from '@/features/users/domain/user'

export function createUserUseCases(repository: UserRepository) {
  return {
    listUsers: () => repository.listUsers(),
    listRoles: () => repository.listRoles(),
    createUser: (input: UserInput & { password: string }) => repository.createUser(input),
    updateUser: (id: number, input: UserInput) => repository.updateUser(id, input),
    blockUser: (id: number) => repository.blockUser(id),
    unblockUser: (id: number) => repository.unblockUser(id),
  }
}
