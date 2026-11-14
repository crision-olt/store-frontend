import { z } from 'zod'
import { resolveServiceUrl } from '@/lib/http'

const permissionSchema = z.object({ id: z.number().int().positive(), name: z.string() })
const roleSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  permissions: z.array(permissionSchema),
})

export class AccessApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Access request failed with HTTP ${status}`)
    this.name = 'AccessApiError'
    this.status = status
  }
}

export function createAccessApi(serviceUrl: string) {
  async function request(path: string, body?: object) {
    const response = await fetch(resolveServiceUrl(serviceUrl, path), body === undefined
      ? { credentials: 'include' }
      : {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
    if (!response.ok) throw new AccessApiError(response.status)
    return response.json()
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
  }
}

export const { listPermissions, listRoles, createPermission, createRole } =
  createAccessApi(import.meta.env.AUTH_SERVICE_URL)
