import {
  createPermission,
  createRole,
  deletePermission,
  deleteRole,
  listPermissions,
  listRoles,
  updatePermission,
  updateRole,
} from '@/lib/access-api'
import type { AccessRepository } from '@/features/access/domain/access-repository'

export class AccessApiAdapter implements AccessRepository {
  listPermissions() {
    return listPermissions()
  }

  listRoles() {
    return listRoles()
  }

  createPermission(name: string) {
    return createPermission(name)
  }

  createRole(name: string, permissionIds: number[]) {
    return createRole(name, permissionIds)
  }

  updatePermission(id: number, name: string) {
    return updatePermission(id, name)
  }

  deletePermission(id: number) {
    return deletePermission(id)
  }

  updateRole(id: number, name: string, permissionIds: number[]) {
    return updateRole(id, name, permissionIds)
  }

  deleteRole(id: number) {
    return deleteRole(id)
  }
}
