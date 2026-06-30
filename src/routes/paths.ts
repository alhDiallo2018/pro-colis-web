import type { Role } from '@/lib/api/types'

/** Landing route per role after login. */
export const ROLE_HOME: Record<Role, string> = {
  client: '/client',
  driver: '/driver',
  admin: '/garage',
  super_admin: '/admin',
}

export function homeForRole(role: Role | undefined | null): string {
  if (!role) return '/login'
  return ROLE_HOME[role] ?? '/login'
}
