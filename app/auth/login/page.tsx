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
    <main className="min-h-screen w-full bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] items-center justify-center p-0 sm:p-4 lg:p-6">
        <div className="flex min-h-screen w-full overflow-hidden border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:min-h-[calc(100vh-2rem)] sm:rounded-2xl lg:min-h-[calc(100vh-3rem)]">

          {/* =====================================================
              PANEL KIRI — BRANDING SPINDO
          ====================================================== */}
          <section className="relative hidden w-[52%] overflow-hidden bg-[#061A33] lg:flex">

            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full border-[60px] border-white/[0.035]" />

              <div className="absolute -bottom-48 -left-48 h-[650px] w-[650px] rounded-full border-[80px] border-white/[0.035]" />

              <div className="absolute right-0 top-0 h-full w-2/3 bg-gradient-to-l from-[#002B66]/80 via-[#002B66]/20 to-transparent" />

              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#E31E24] via-[#E31E24]/60 to-transparent" />
            </div>

            <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14 2xl:p-16">

              {/* Logo */}
              <div>
                <div className="inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-md">

                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-2 shadow-xl">
                    <img
                      src="/spindo 5.png"
                      alt="SPINDO 5"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <p className="text-base font-bold tracking-wide text-white">
                      PT Steel Pipe Industry Of Indonesia Tbk
                    </p>

                    <p className="mt-0.5 text-sm text-slate-300">
                      SPINDO 5 • Warehouse
                    </p>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="max-w-2xl">

                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-300">
                  <Factory className="h-4 w-4" />
                  Warehouse Return Management
                </div>

                <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white xl:text-6xl 2xl:text-7xl">
                  Monitoring
                  <span className="block text-slate-300">
                    Return Customer
                  </span>
                </h1>

                <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 xl:text-lg">
                  Sistem terintegrasi untuk mencatat,
                  memonitor, dan menelusuri proses
                  penerimaan material return secara
                  terstruktur, akurat, dan terdokumentasi.
                </p>

                {/* Feature cards */}
                <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">

                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
                    <ShieldCheck className="h-6 w-6 text-red-400" />

                    <p className="mt-4 text-sm font-bold text-white">
                      Secure
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Akses berbasis role
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
                    <Factory className="h-6 w-6 text-red-400" />

                    <p className="mt-4 text-sm font-bold text-white">
                      Warehouse
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Monitoring operasional
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
                    <LockKeyhole className="h-6 w-6 text-red-400" />

                    <p className="mt-4 text-sm font-bold text-white">
                      Audited
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Riwayat aktivitas
                    </p>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-500">
                <span>
                  Internal Operational System
                </span>

                <span>
                  Architected By : Dani Kurnia
                </span>
              </div>
            </div>
          </section>

          {/* =====================================================
              PANEL KANAN — LOGIN
          ====================================================== */}
          <section className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-10 dark:bg-slate-950 sm:px-10 lg:px-12 xl:px-20">

            <div className="w-full max-w-lg">

              {/* Mobile branding */}
              <div className="mb-10 flex items-center gap-4 lg:hidden">

                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-2 shadow-md">
                  <img
                    src="/spindo 5.png"
                    alt="SPINDO Unit 5"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    PT Steel Pipe Industry Of Indonesia Tbk
                  </p>

                  <p className="text-sm text-slate-500">
                    SPINDO 5 • Warehouse
                  </p>
                </div>
              </div>

              {/* Login header */}
              <div className="mb-9">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#061A33] text-white shadow-lg">
                  <LockKeyhole className="h-6 w-6" />
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#E31E24]">
                  Internal System
                </p>

                <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Selamat Datang
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Masuk untuk mengakses sistem
                  Monitoring Return Customer.
                </p>
              </div>

              {/* Login form */}
              <form
                onSubmit={submit}
                className="space-y-6"
              >

                {/* Email */}
                <div className="space-y-2.5">

                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Email
                  </Label>

                  <div className="relative">

                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="nama@perusahaan.com"
                      className="h-14 rounded-xl border-slate-200 bg-white pl-12 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-[#002B66] focus:ring-4 focus:ring-[#002B66]/10 dark:border-slate-800 dark:bg-slate-900"
                    />

                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2.5">

                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </Label>

                  <div className="relative">

                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

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
                      className="h-14 rounded-xl border-slate-200 bg-white pl-12 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-[#002B66] focus:ring-4 focus:ring-[#002B66]/10 dark:border-slate-800 dark:bg-slate-900"
                    />

                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <p className="font-semibold">
                      Login tidak berhasil
                    </p>

                    <p className="mt-1 text-xs leading-5">
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="group h-14 w-full rounded-xl bg-[#061A33] text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-[#002B66] hover:shadow-xl hover:shadow-[#002B66]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Memproses login...
                    </>
                  ) : (
                    <>
                      Masuk ke Sistem
                      <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                {/* Register */}
                <div className="pt-1 text-center">

                  <p className="text-sm text-slate-500 dark:text-slate-400">
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

              {/* Security */}
              <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Akses Sistem Terlindungi
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                      Gunakan akun yang telah terdaftar
                      dan jangan membagikan password
                      kepada pengguna lain.
                    </p>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <p className="mt-7 text-center text-[11px] text-slate-400">
                Monitoring Return Customer
                {' • '}
                 SPINDO 5
              </p>

            </div>
          </section>
        </div>
      </div>
    </main>
  )
}