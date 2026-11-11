
import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import {
  ErrorState,
  PageHeader,
  SetupNotice,
} from '@/components/app/states'
import { ReturnItemsView } from '@/components/returns/return-items-view'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'
import { canCreateReturn } from '@/lib/permissions'
import { listReturnItemsView } from '@/lib/services/returns'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata: Metadata = {
  title: 'Return Items | SPINDO 5',
}

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams

  const user = await getCurrentUser()
  const canCreate = canCreateReturn(user?.role)

  const createButton = canCreate && (
    <Link
      href="/returns/new"
      className={buttonVariants({
        size: 'default',
      })}
    >
      <Plus className="size-4" />
      Penerimaan Baru
    </Link>
  )

  const header = (
    <PageHeader
      title="Material Return Items"
      description="Monitoring penerimaan Return beserta detail item material."
      actions={createButton}
    />
  )

  if (!isSupabaseConfigured) {
    return (
      <>
        {header}
        <SetupNotice />
      </>
    )
  }

  try {
    const filters = {
      q: sp.q,
      from: sp.from,
      to: sp.to,
      customer: sp.customer,
      status: sp.status,
    }

    const rows = await listReturnItemsView(filters)

    return (
      <div className="space-y-4">
        {header}

        <ReturnItemsView
          rows={rows}
          filters={filters}
        />
      </div>
    )
  } catch (e) {
    return (
      <>
        {header}
        <ErrorState message={(e as Error).message} />
      </>
    )
  }
}
