import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { authUseCases } from '@/features/auth/auth'
import type { AuthUser, Credentials } from '@/features/auth/domain/auth'
import type { EndpointMutationOptions, EndpointQueryOptions } from '@/hooks/endpoint-options'
import { mutationKeys, queryKeys } from '@/lib/query-keys'

export function useCurrentUser(options?: EndpointQueryOptions<AuthUser>) {
  return useQuery({
    staleTime: 60_000,
    ...options,
    queryKey: queryKeys.currentUser,
    queryFn: authUseCases.getCurrentUser,
    retry: false,
  })
}

export function useLogin(options?: EndpointMutationOptions<AuthUser, Credentials>) {
  return useMutation({
    ...options,
    mutationKey: mutationKeys.login,
    mutationFn: authUseCases.login,
  })
}

export function useRegister(options?: EndpointMutationOptions<AuthUser, Credentials>) {
  return useMutation({
    ...options,
    mutationKey: mutationKeys.register,
    mutationFn: authUseCases.registerUser,
  })
}

export function useLogout(options?: EndpointMutationOptions<void>) {
  return useMutation({
    ...options,
    mutationKey: mutationKeys.logout,
    mutationFn: authUseCases.logout,
  })
}

export function useSessionEvents(onBlocked: () => void) {
  useEffect(() => authUseCases.watchSession(() => {
    authUseCases.logout().catch((error: unknown) => console.error('Blocked session logout failed', error))
    onBlocked()
  }), [onBlocked])
}
