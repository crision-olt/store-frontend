export type AuthUser = {
  id: number
  email: string
  created_at: string
}

export type Credentials = {
  email: string
  password: string
}

export interface AuthRepository {
  login(credentials: Credentials): Promise<AuthUser>
  registerUser(credentials: Credentials): Promise<AuthUser>
  getCurrentUser(): Promise<AuthUser>
  watchSession(onBlocked: () => void): () => void
  logout(): Promise<void>
}
