import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { buttonVariants } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <AuthShell title="Autentikasi Gagal" description="Link tidak valid atau sudah kedaluwarsa. Silakan coba masuk kembali.">
      <Link href="/auth/login" className={buttonVariants()}>
        Ke halaman Masuk
      </Link>
    </AuthShell>
  )
}
