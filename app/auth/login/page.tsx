
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  ArrowRight,
  Factory,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    if (!isSupabaseConfigured) {
      setError('Supabase belum terhubung.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const {
        data,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        console.error(
          '[LOGIN] Supabase Auth Error:',
          authError,
        )

        setError(
          `Login gagal: ${authError.message}${
            authError.code
              ? ` (code: ${authError.code})`
              : ''
          }`,
        )

        return
      }

      console.log('[LOGIN] Berhasil:', {
        userId: data.user?.id,
        email: data.user?.email,
        session: Boolean(data.session),
      })

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error(
        '[LOGIN] Unexpected error:',
        error,
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat login.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh w-full overflow-x-hidden bg-slate-100 dark:bg-slate-950 lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] items-center justify-center p-0 sm:p-3 lg:h-full lg:min-h-0 lg:p-4">
        <div className="grid min-h-dvh w-full grid-cols-1 overflow-hidden border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 sm:min-h-[calc(100dvh-1.5rem)] sm:rounded-2xl lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">

          {/* =====================================================
              DESKTOP BRANDING PANEL
          ===================================================== */}

          <section className="relative hidden min-h-0 overflow-hidden bg-[#071A32] lg:flex">

            {/* BACKGROUND */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <div className="absolute -right-36 -top-40 size-[520px] rounded-full border-[65px] border-white/[0.035]" />

              <div className="absolute -bottom-56 -left-48 size-[620px] rounded-full border-[75px] border-white/[0.035]" />

              <div className="absolute right-0 top-0 h-full w-2/3 bg-gradient-to-l from-[#002B66]/70 via-[#002B66]/20 to-transparent" />

              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#E31E24] via-[#E31E24]/60 to-transparent" />
            </div>

            <div className="relative z-10 flex h-full w-full flex-col justify-between gap-[clamp(0.75rem,2vh,1.5rem)] p-[clamp(1.25rem,3vh,2.75rem)]">

              {/* BRAND */}

              <div className="flex shrink-0 items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg xl:size-12">
                  <img
                    src="/spindo 5.png"
                    alt="SPINDO 5"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-wide text-white xl:text-base">
                    PT Steel Pipe Industry Of Indonesia Tbk
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold tracking-[0.16em] text-slate-300">
                    SPINDO 5 · WAREHOUSE
                  </p>
                </div>
              </div>

              {/* MAIN BRANDING */}

              <div className="my-auto max-w-xl">
                <div className="mb-[clamp(0.5rem,1.5vh,1.25rem)] inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-300">
                  <Factory className="size-3.5" />
                  Internal Operational System
                </div>

                <h1 className="text-[clamp(2rem,4.2vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-white">
                  Customer
                  <span className="block text-slate-300">
                    Return
                  </span>

                  <span className="mt-1 block text-[clamp(1.2rem,2.4vw,2rem)] font-semibold text-red-400">
                    Receiving & Monitoring
                  </span>
                </h1>

                <p className="mt-[clamp(0.75rem,2vh,1.5rem)] max-w-lg text-sm leading-6 text-slate-300 xl:text-base xl:leading-7">
                  Sistem terintegrasi untuk mencatat, memonitor,
                  dan menelusuri proses penerimaan material Return
                  secara terstruktur, akurat, dan terdokumentasi.
                </p>

                {/* FEATURE CARDS */}

                <div className="mt-[clamp(1rem,2.5vh,2rem)] grid grid-cols-3 gap-2.5 xl:gap-3 [@media(max-height:680px)]:hidden">

                  <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-sm xl:p-4">
                    <ShieldCheck className="size-5 text-red-400" />

                    <p className="mt-3 text-xs font-bold text-white xl:text-sm">
                      Secure
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-slate-400">
                      Role-based access
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-sm xl:p-4">
                    <Factory className="size-5 text-red-400" />

                    <p className="mt-3 text-xs font-bold text-white xl:text-sm">
                      Monitoring
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-slate-400">
                      Warehouse activity
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-sm xl:p-4">
                    <LockKeyhole className="size-5 text-red-400" />

                    <p className="mt-3 text-xs font-bold text-white xl:text-sm">
                      Audited
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-slate-400">
                      Activity history
                    </p>
                  </div>

                </div>
              </div>

              {/* DESKTOP FOOTER */}

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 pt-3 text-[10px] text-slate-500 [@media(max-height:600px)]:hidden">
                <span>
                  Internal Operational System
                </span>

                <span className="text-right">
                  Architected By: Dani Kurnia
                </span>
              </div>
            </div>
          </section>

          {/* =====================================================
              LOGIN PANEL
          ===================================================== */}

          <section className="flex min-h-dvh min-w-0 items-center justify-center bg-slate-50 px-[clamp(1rem,3vw,3rem)] py-[clamp(0.75rem,2vh,1.5rem)] dark:bg-slate-950 lg:h-full lg:min-h-0 lg:overflow-y-auto">

            <div className="w-full max-w-[410px] py-2 lg:py-[clamp(0.5rem,1.5vh,1.25rem)]">

              {/* MOBILE BRANDING */}

              <div className="mb-4 flex items-center gap-3 lg:hidden [@media(max-height:560px)]:mb-2">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
                  <img
                    src="/spindo 5.png"
                    alt="SPINDO 5"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold leading-5 text-slate-900 dark:text-white sm:text-sm">
                    PT Steel Pipe Industry Of Indonesia Tbk
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold tracking-[0.14em] text-slate-500">
                    SPINDO 5 · WAREHOUSE
                  </p>
                </div>
              </div>

              {/* LOGIN HEADING */}

              <div className="mb-5 sm:mb-6 [@media(max-height:650px)]:mb-3">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#071A32] text-white shadow-md sm:size-11">
                  <LockKeyhole className="size-5" />
                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E31E24]">
                  Internal System
                </p>

                <h2 className="mt-1.5 text-[clamp(1.5rem,4vh,2.25rem)] font-bold tracking-tight text-slate-900 dark:text-white">
                  Selamat Datang
                </h2>

                <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                  Masuk menggunakan akun terdaftar untuk mengakses
                  sistem Monitoring Return Customer.
                </p>
              </div>

              {/* LOGIN FORM */}

              <form
                onSubmit={submit}
                className="space-y-3 sm:space-y-4"
              >

                {/* EMAIL */}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 sm:text-sm"
                  >
                    Email
                  </Label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />

                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="nama@perusahaan.com"
                      disabled={loading}
                      className="h-11 rounded-xl border-slate-200 bg-white pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-[#002B66] focus-visible:ring-4 focus-visible:ring-[#002B66]/10 dark:border-slate-800 dark:bg-slate-900 sm:h-12"
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 sm:text-sm"
                  >
                    Password
                  </Label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />

                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Masukkan password"
                      disabled={loading}
                      className="h-11 rounded-xl border-slate-200 bg-white pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-[#002B66] focus-visible:ring-4 focus-visible:ring-[#002B66]/10 dark:border-slate-800 dark:bg-slate-900 sm:h-12"
                    />
                  </div>
                </div>

                {/* ERROR */}

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <p className="text-xs font-semibold">
                      Login tidak berhasil
                    </p>

                    <p className="mt-1 break-words text-[11px] leading-5">
                      {error}
                    </p>
                  </div>
                )}

                {/* SUBMIT */}

                <Button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="group mt-1 h-11 w-full rounded-xl bg-[#071A32] text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all duration-200 hover:bg-[#002B66] hover:shadow-lg hover:shadow-[#002B66]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Memproses login...
                    </>
                  ) : (
                    <>
                      Masuk ke Sistem

                      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                {/* REGISTER */}

                <div className="pt-1 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                    Belum punya akun?{' '}

                    <Link
                      href="/auth/sign-up"
                      className="font-bold text-[#002B66] transition-colors hover:text-[#E31E24] hover:underline dark:text-blue-400"
                    >
                      Daftar akun
                    </Link>
                  </p>
                </div>
              </form>

              {/* SECURITY */}

              <div className="mt-4 flex items-start gap-3 border-t border-slate-200 pt-3 dark:border-slate-800 [@media(max-height:560px)]:hidden">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    Akses Sistem Terlindungi
                  </p>

                  <p className="mt-0.5 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                    Gunakan akun yang telah terdaftar dan
                    jangan membagikan password kepada pengguna lain.
                  </p>
                </div>
              </div>

              {/* FOOTER */}

              <p className="mt-4 text-center text-[10px] text-slate-400 [@media(max-height:560px)]:mt-2">
                SPINDO 5 · Customer Return Receiving
              </p>

            </div>
          </section>
        </div>
      </div>
    </main>
  )
}