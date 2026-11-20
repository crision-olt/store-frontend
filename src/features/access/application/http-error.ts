export function hasHttpStatus(error: unknown, status: number): boolean {
  return error instanceof Error && 'status' in error && error.status === status
}
