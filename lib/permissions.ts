import type { Role } from './types'

export const ROLE_LABELS: Record<Role, string> = {
  master_data: 'Master Data',
  admin: 'Admin',
  read_only: 'Read Only',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  master_data: 'Akses penuh, termasuk mengelola data dan user.',
  admin: 'Dapat membuat, melihat, dan mengedit data Return.',
  read_only: 'Hanya dapat melihat Dashboard dan data Return.',
}

export const ROLES: Role[] = ['master_data', 'admin', 'read_only']

export function canCreateReturn(role?: Role | null) {
  return role === 'master_data' || role === 'admin'
}

export function canEditReturn(role?: Role | null) {
  return role === 'master_data' || role === 'admin'
}

export function canManageUsers(role?: Role | null) {
  return role === 'master_data'
}