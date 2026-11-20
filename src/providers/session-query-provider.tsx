import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCallback, useState, type ReactNode } from 'react'
import { ResetSessionContext } from '@/providers/session-query-context'

export function SessionQueryProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => ({ client: new QueryClient(), generation: 0 }))
  const resetSession = useCallback(() => {
    session.client.clear()
    setSession(({ generation }) => ({ client: new QueryClient(), generation: generation + 1 }))
  }, [session.client])

  return (
    <ResetSessionContext.Provider value={resetSession}>
      <QueryClientProvider key={session.generation} client={session.client}>
        {children}
      </QueryClientProvider>
    </ResetSessionContext.Provider>
  )
}
