import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { buttonVariants } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <AuthShell
      title="Periksa Email Anda"
      description="Kami telah mengirim link konfirmasi. Konfirmasi email sebelum masuk ke aplikasi."
    >
      <Link href="/auth/login" className={buttonVariants({ variant: 'outline' })}>
        Kembali ke halaman Masuk
      </Link>
    </AuthShell>
  )
}
