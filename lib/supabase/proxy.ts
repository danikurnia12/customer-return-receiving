
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from './config'

function isPublicPath(pathname: string) {
  return pathname === '/auth' || pathname.startsWith('/auth/')
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse(
        'Supabase belum dikonfigurasi. Hubungi administrator.',
        { status: 503 },
      )
    }

    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('[Supabase Proxy] Gagal memverifikasi sesi.')
  }

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set(
      'next',
      request.nextUrl.pathname + request.nextUrl.search,
    )

    return NextResponse.redirect(url)
  }

  return response
}
