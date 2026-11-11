import { redirect } from 'next/navigation'

/**
 * Route detail inspeksi per item sudah digantikan oleh monitoring
 * administrasi pada tingkat satu kedatangan Return.
 * Alihkan URL lama agar pengguna tidak mengedit No NCR/Disposisi
 * pada return_items yang kini hanya menjadi data historis.
 */
export default function LegacyInspectionDetailPage() {
  redirect('/inspection')
}
