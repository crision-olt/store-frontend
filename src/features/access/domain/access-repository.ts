import type { Permission, Role } from '@/features/access/domain/access'

export interface AccessRepository {
  listPermissions(): Promise<Permission[]>
  listRoles(): Promise<Role[]>
  createPermission(name: string): Promise<Permission>
  createRole(name: string, permissionIds: number[]): Promise<Role>
  updatePermission(id: number, name: string): Promise<Permission>
  deletePermission(id: number): Promise<void>
  updateRole(id: number, name: string, permissionIds: number[]): Promise<Role>
  deleteRole(id: number): Promise<void>
}
