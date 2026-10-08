'use client'

import { ErrorState } from '@/components/app/states'
import { Button } from '@/components/ui/button'

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      message={error.message || 'Terjadi kesalahan tak terduga.'}
      action={<Button onClick={reset}>Coba Lagi</Button>}
    />
  )
}
