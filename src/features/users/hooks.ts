import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EndpointMutationOptions, EndpointQueryOptions } from '@/hooks/endpoint-options'
import { mutationKeys, queryKeys } from '@/lib/query-keys'
import { userUseCases } from './users'

type User = Awaited<ReturnType<typeof userUseCases.listUsers>>[number]
type CreateUserInput = Parameters<typeof userUseCases.createUser>[0]
type UpdateUserInput = Parameters<typeof userUseCases.updateUser>[1]

export function useUsers(options?: EndpointQueryOptions<User[]>) {
  return useQuery({
    ...options,
    queryKey: queryKeys.users,
    queryFn: userUseCases.listUsers,
    retry: false,
  })
}

export function useCreateUser(options?: EndpointMutationOptions<User, CreateUserInput>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationKey: mutationKeys.createUser,
    mutationFn: userUseCases.createUser,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context)
      await queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export function useUpdateUser(options?: EndpointMutationOptions<User, { id: number; input: UpdateUserInput }>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationKey: mutationKeys.updateUser,
    mutationFn: ({ id, input }) => userUseCases.updateUser(id, input),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context)
      await queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export function useBlockUser(options?: EndpointMutationOptions<User, number>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationKey: mutationKeys.blockUser,
    mutationFn: userUseCases.blockUser,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context)
      await queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export function useUnblockUser(options?: EndpointMutationOptions<User, number>) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationKey: mutationKeys.unblockUser,
    mutationFn: userUseCases.unblockUser,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context)
      await queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}
