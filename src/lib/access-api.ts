import { z } from 'zod'
import { resolveServiceUrl } from '@/lib/http'

const permissionSchema = z.object({ id: z.number().int().positive(), name: z.string() })
const roleSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  permissions: z.array(permissionSchema),
})

const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string(),
  created_at: z.string(),
  blocked: z.boolean(),
  role: z.object({ id: z.number().int().positive(), name: z.string() }),
})

export type Permission = z.infer<typeof permissionSchema>
export type Role = z.infer<typeof roleSchema>
export type AccessUser = z.infer<typeof userSchema>
export type UserInput = { email: string; roleId: number; password?: string }

export class AccessApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Access request failed with HTTP ${status}`)
    this.name = 'AccessApiError'
    this.status = status
  }
}

export function createAccessApi(serviceUrl: string) {
  async function request(path: string, body?: object, method?: 'PUT' | 'DELETE') {
    const response = await fetch(resolveServiceUrl(serviceUrl, path), body === undefined && method === undefined
      ? { credentials: 'include' }
      : {
          method: method ?? 'POST',
          credentials: 'include',
          ...(body === undefined ? {} : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
        })
    if (!response.ok) throw new AccessApiError(response.status)
    return response.status === 204 ? undefined : response.json()
  }

  return {
    async listPermissions() {
      return z.array(permissionSchema).parse(await request('/permissions'))
    },
    async listRoles() {
      return z.array(roleSchema).parse(await request('/roles'))
    },
    async createPermission(name: string) {
      return permissionSchema.parse(await request('/permissions', { name }))
    },
    async createRole(name: string, permissionIds: number[]) {
      return roleSchema.parse(await request('/roles', { name, permissionIds }))
    },
    async updatePermission(id: number, name: string) {
      return permissionSchema.parse(await request(`/permissions/${id}`, { name }, 'PUT'))
    },
    async deletePermission(id: number) {
      await request(`/permissions/${id}`, undefined, 'DELETE')
    },
    async updateRole(id: number, name: string, permissionIds: number[]) {
      return roleSchema.parse(await request(`/roles/${id}`, { name, permissionIds }, 'PUT'))
    },
    async deleteRole(id: number) {
      await request(`/roles/${id}`, undefined, 'DELETE')
    },
    async listUsers() {
      return z.array(userSchema).parse(await request('/users'))
    },
    async createUser(input: UserInput & { password: string }) {
      return userSchema.parse(await request('/users', input))
    },
    async blockUser(id: number) {
      return userSchema.parse(await request(`/users/${id}/block`, undefined, 'PUT'))
    },
    async unblockUser(id: number) {
      return userSchema.parse(await request(`/users/${id}/block`, undefined, 'DELETE'))
    },
    async updateUser(id: number, input: UserInput) {
      return userSchema.parse(await request(`/users/${id}`, input, 'PUT'))
    },
  }
}

export const {
  listPermissions, listRoles, createPermission, createRole, updatePermission, deletePermission,
  updateRole, deleteRole, listUsers, createUser, updateUser, blockUser, unblockUser,
} = createAccessApi(import.meta.env.AUTH_SERVICE_URL)
