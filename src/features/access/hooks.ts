import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EndpointMutationOptions, EndpointQueryOptions } from '@/hooks/endpoint-options'
import { mutationKeys, queryKeys } from '@/lib/query-keys'
import { accessUseCases } from './access'

type Role = Awaited<ReturnType<typeof accessUseCases.listRoles>>[number]
type Permission = Awaited<ReturnType<typeof accessUseCases.listPermissions>>[number]
type RoleInput = { name: string; permissionIds: number[] }
type UpdateRoleInput = RoleInput & { id: number }
type UpdatePermissionInput = { id: number; name: string }

export function useRoles(options?: EndpointQueryOptions<Role[]>) {
  return useQuery({
    ...options,
    queryKey: queryKeys.roles,
    queryFn: accessUseCases.listRoles,
    retry: false,
  })
}

export function usePermissions(options?: EndpointQueryOptions<Permission[]>) {
  return useQuery({
    ...options,
    queryKey: queryKeys.permissions,
    queryFn: accessUseCases.listPermissions,
    retry: false,
  })
}

export function useCreatePermission(options?: EndpointMutationOptions<Permission, string>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationKey: mutationKeys.createPermission,
    mutationFn: accessUseCases.createPermission,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context)
      await queryClient.invalidateQueries({ queryKey: queryKeys.permissions })
    },
  })
}

export function useUpdatePermission(options?: EndpointMutationOptions<Permission, UpdatePermissionInput>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationKey: mutationKeys.updatePermission,
    mutationFn: ({ id, name }) => accessUseCases.updatePermission(id, name),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.permissions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
      ])
    },
  })
}

export function useDeletePermission(options?: EndpointMutationOptions<void, number>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationKey: mutationKeys.deletePermission,
    mutationFn: accessUseCases.deletePermission,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.permissions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
      ])
    },
  })
}

export function useCreateRole(options?: EndpointMutationOptions<Role, RoleInput>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationKey: mutationKeys.createRole,
    mutationFn: ({ name, permissionIds }) => accessUseCases.createRole(name, permissionIds),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context)
      await queryClient.invalidateQueries({ queryKey: queryKeys.roles })
    },
  })
}

export function useUpdateRole(options?: EndpointMutationOptions<Role, UpdateRoleInput>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationKey: mutationKeys.updateRole,
    mutationFn: ({ id, name, permissionIds }) => accessUseCases.updateRole(id, name, permissionIds),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users }),
      ])
    },
  })
}

export function useDeleteRole(options?: EndpointMutationOptions<void, number>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationKey: mutationKeys.deleteRole,
    mutationFn: accessUseCases.deleteRole,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users }),
      ])
    },
  })
}
