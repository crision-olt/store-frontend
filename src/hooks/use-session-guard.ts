import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, watchSession } from '@/lib/auth-api'

// Sends the user to the login page as soon as an administrator blocks the account.
export function useSessionGuard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => watchSession(() => {
    logout().catch(() => {})
    queryClient.clear()
    navigate('/login', { replace: true, state: { blocked: true } })
  }), [navigate, queryClient])
}
