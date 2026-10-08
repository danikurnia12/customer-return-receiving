import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from './config'

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export function createAdminClient() {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL belum dikonfigurasi')
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi',
    )
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}