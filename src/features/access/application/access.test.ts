import { createAccessUseCases } from './access'
import { AccessApiAdapter } from '@/features/access/infrastructure/access-api-adapter'
import { AccessApiError, listRoles } from '@/lib/access-api'

vi.mock('@/lib/access-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/access-api')>(),
  listRoles: vi.fn(),
}))

describe('access use cases', () => {
  it('delegates permission and role changes to the repository', async () => {
    const permission = { id: 2, name: 'tables:read' }
    const role = { id: 3, name: 'reader', permissions: [permission] }
    const repository = {
      listPermissions: vi.fn().mockResolvedValue([permission]),
      listRoles: vi.fn().mockResolvedValue([role]),
      createPermission: vi.fn().mockResolvedValue(permission),
      createRole: vi.fn().mockResolvedValue(role),
      updatePermission: vi.fn().mockResolvedValue(permission),
      deletePermission: vi.fn().mockResolvedValue(undefined),
      updateRole: vi.fn().mockResolvedValue(role),
      deleteRole: vi.fn().mockResolvedValue(undefined),
    }
    const useCases = createAccessUseCases(repository)

    await expect(useCases.listPermissions()).resolves.toEqual([permission])
    await expect(useCases.listRoles()).resolves.toEqual([role])
    await expect(useCases.createPermission('tables:read')).resolves.toEqual(permission)
    await expect(useCases.createRole('reader', [2])).resolves.toEqual(role)
    await expect(useCases.updatePermission(2, 'tables:read')).resolves.toEqual(permission)
    await useCases.deletePermission(2)
    await expect(useCases.updateRole(3, 'reader', [2])).resolves.toEqual(role)
    await useCases.deleteRole(3)

    expect(repository.createRole).toHaveBeenCalledWith('reader', [2])
    expect(repository.updateRole).toHaveBeenCalledWith(3, 'reader', [2])
    expect(repository.deletePermission).toHaveBeenCalledWith(2)
    expect(repository.deleteRole).toHaveBeenCalledWith(3)
  })

  it('preserves access transport errors and their status at the feature boundary', async () => {
    const error = new AccessApiError(401)
    vi.mocked(listRoles).mockRejectedValueOnce(error)

    await expect(new AccessApiAdapter().listRoles())
      .rejects.toBe(error)
  })
})
