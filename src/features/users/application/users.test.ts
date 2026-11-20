import { createUserUseCases } from './users'
import { UsersApiAdapter } from '@/features/users/infrastructure/users-api-adapter'
import { AccessApiError, listUsers } from '@/lib/access-api'

vi.mock('@/lib/access-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/access-api')>(),
  listUsers: vi.fn(),
}))

describe('user use cases', () => {
  it('delegates user management operations to the repository', async () => {
    const role = { id: 3, name: 'reader', permissions: [] }
    const user = {
      id: 5, email: 'member@example.com', created_at: '2026-01-01T00:00:00.000Z',
      blocked: false, role: { id: role.id, name: role.name },
    }
    const repository = {
      listUsers: vi.fn().mockResolvedValue([user]),
      listRoles: vi.fn().mockResolvedValue([role]),
      createUser: vi.fn().mockResolvedValue(user),
      updateUser: vi.fn().mockResolvedValue(user),
      blockUser: vi.fn().mockResolvedValue({ ...user, blocked: true }),
      unblockUser: vi.fn().mockResolvedValue(user),
    }
    const useCases = createUserUseCases(repository)
    const input = { email: user.email, roleId: role.id }

    await expect(useCases.listUsers()).resolves.toEqual([user])
    await expect(useCases.listRoles()).resolves.toEqual([role])
    await expect(useCases.createUser({ ...input, password: 'secret-pass' })).resolves.toEqual(user)
    await expect(useCases.updateUser(user.id, input)).resolves.toEqual(user)
    await expect(useCases.blockUser(user.id)).resolves.toMatchObject({ blocked: true })
    await expect(useCases.unblockUser(user.id)).resolves.toEqual(user)

    expect(repository.createUser).toHaveBeenCalledWith({ ...input, password: 'secret-pass' })
    expect(repository.updateUser).toHaveBeenCalledWith(user.id, input)
    expect(repository.blockUser).toHaveBeenCalledWith(user.id)
    expect(repository.unblockUser).toHaveBeenCalledWith(user.id)
  })

  it('preserves user transport errors and their status at the feature boundary', async () => {
    const error = new AccessApiError(401)
    vi.mocked(listUsers).mockRejectedValueOnce(error)

    await expect(new UsersApiAdapter().listUsers())
      .rejects.toBe(error)
  })
})
