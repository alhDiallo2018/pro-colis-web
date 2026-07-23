export const SUPPORT_USER_IDS = [
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e7',
]

export function isSupportAccount(userId?: string | null): boolean {
  if (!userId) return false
  return SUPPORT_USER_IDS.includes(userId)
}
