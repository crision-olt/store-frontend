import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSessionEvents } from '@/features/auth/hooks'
import { buildLinkWithRedirect } from '@/lib/redirect'
import { useResetSession } from '@/providers/session-query-context'

export function useSessionGuard() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const resetSession = useResetSession()

  useSessionEvents(useCallback(() => {
    resetSession()
    navigate('/login', { replace: true, state: { blocked: true } })
  }, [navigate, resetSession]))

  useEffect(() => {
    let redirected = false
    const handleError = (error: unknown) => {
      if (redirected || typeof error !== 'object' || error === null || !('status' in error) || error.status !== 401) return
      redirected = true
      resetSession()
      navigate(buildLinkWithRedirect('/login', location.pathname + location.search), { replace: true })
    }

    const unsubscribeQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && (event.action.type === 'error' || event.action.type === 'failed')) {
        handleError(event.action.error)
      }
    })
    const unsubscribeMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && (event.action.type === 'error' || event.action.type === 'failed')) {
        handleError(event.action.error)
      }
    })
    return () => {
      unsubscribeQueries()
      unsubscribeMutations()
    }
  }, [location.pathname, location.search, navigate, queryClient, resetSession])
}
