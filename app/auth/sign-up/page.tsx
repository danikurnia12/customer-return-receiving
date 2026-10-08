'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSupabaseConfigured) return setError('Supabase belum terhubung.')
    if (password.length < 8) return setError('Password minimal 8 karakter.')
    if (password !== confirm) return setError('Konfirmasi password tidak sama.')
    setLoading(true)
    setError(null)
    const { error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: { name: name.trim() },
      },
    })
    setLoading(false)
    if (error) {
      if (error.code === 'weak_password') setError('Password terlalu lemah.')
      else if (error.status === 429) setError('Terlalu banyak percobaan. Coba lagi nanti.')
      else setError('Pendaftaran gagal. Periksa data dan coba lagi.')
      return
    }
    router.push('/auth/sign-up-success')
  }

  return (
    <AuthShell
      title="Daftar Akun"
      description="Akun baru mendapat role Viewer. Owner dapat mengubah role Anda."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nama</Label>
          <Input id="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Konfirmasi Password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Daftar
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
