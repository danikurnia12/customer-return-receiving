import { cache } from 'react'
import { isSupabaseConfigured } from './supabase/config'
import { createClient } from './supabase/server'
import type { AppUser } from './types'

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nama, role, is_active, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return {
      id: user.id,
      name: user.email?.split('@')[0] ?? 'User',
      email: user.email ?? '',
      role: 'read_only',
      status: 'inactive',
      created_at: user.created_at,
    }
  }

  return {
    id: profile.id,
    name: profile.nama ?? user.email?.split('@')[0] ?? 'User',
    email: user.email ?? '',
    role: profile.role,
    status: profile.is_active ? 'active' : 'inactive',
    created_at: profile.created_at,
  }
})