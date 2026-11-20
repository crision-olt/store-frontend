import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'

export type EndpointQueryOptions<TData> = Omit<
  UseQueryOptions<TData>,
  'queryKey' | 'queryFn'
>

export type EndpointMutationOptions<TData, TVariables = void, TContext = unknown> = Omit<
  UseMutationOptions<TData, Error, TVariables, TContext>,
  'mutationKey' | 'mutationFn'
>
