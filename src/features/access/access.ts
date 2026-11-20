import { createAccessUseCases } from '@/features/access/application/access'
import { AccessApiAdapter } from '@/features/access/infrastructure/access-api-adapter'

export const accessUseCases = createAccessUseCases(new AccessApiAdapter())
export type { Permission, Role } from '@/features/access/domain/access'
