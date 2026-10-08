import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

let browserClient: SupabaseClient | undefined

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi')
  }
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookieOptions: { secure: process.env.NODE_ENV === 'production' },
    })
  }
  return browserClient
}
