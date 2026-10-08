import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  ErrorState,
  SetupNotice,
} from '@/components/app/states'

import { ReturnDetailView } from '@/components/returns/return-detail'

import { buttonVariants } from '@/components/ui/button'

import { getCurrentUser } from '@/lib/auth'
import { canEditReturn } from '@/lib/permissions'

import { getReturnDetail } from '@/lib/services/returns'

import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata: Metadata = {
  title: 'Detail Return',
}

interface ReturnDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ReturnDetailPage({
  params,
}: ReturnDetailPageProps) {
  const { id } = await params

  if (!isSupabaseConfigured) {
    return <SetupNotice />
  }

  try {
    console.log(
      '[ReturnDetailPage] URL ID:',
      id,
    )

    const detail =
      await getReturnDetail(id)

    console.log(
      '[ReturnDetailPage] detail:',
      detail,
    )

    if (!detail) {
      notFound()
    }

    const user =
      await getCurrentUser()

    return (
      <div className="flex flex-col gap-6">
        <ReturnDetailView
          detail={detail}
          canEdit={canEditReturn(
            user?.role,
          )}
        />

        <div className="flex">
          <Link
            href="/returns"
            className={buttonVariants({
              variant: 'outline',
            })}
          >
            Kembali ke Daftar Return
          </Link>
        </div>
      </div>
    )
  } catch (error) {
    console.error(
      '[ReturnDetailPage] ERROR:',
      error,
    )

    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : 'Gagal memuat data'
        }
        action={
          <Link
            href="/returns"
            className={buttonVariants({
              variant: 'outline',
            })}
          >
            Kembali
          </Link>
        }
      />
    )
  }
}