import type { AccessRepository } from '@/features/access/domain/access-repository'

export function createAccessUseCases(repository: AccessRepository) {
  return {
    listPermissions: () => repository.listPermissions(),
    listRoles: () => repository.listRoles(),
    createPermission: (name: string) => repository.createPermission(name),
    createRole: (name: string, permissionIds: number[]) => repository.createRole(name, permissionIds),
    updatePermission: (id: number, name: string) => repository.updatePermission(id, name),
    deletePermission: (id: number) => repository.deletePermission(id),
    updateRole: (id: number, name: string, permissionIds: number[]) => repository.updateRole(id, name, permissionIds),
    deleteRole: (id: number) => repository.deleteRole(id),
  }
}
