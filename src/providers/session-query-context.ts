import { createContext, useContext } from 'react'

export const ResetSessionContext = createContext<(() => void) | null>(null)

export function useResetSession() {
  const resetSession = useContext(ResetSessionContext)
  if (!resetSession) throw new Error('useResetSession must be used inside SessionQueryProvider')
  return resetSession
}
