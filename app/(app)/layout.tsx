import { cookies } from 'next/headers'
import { AppSidebar } from '@/components/app/app-sidebar'
import { AppTopbar } from '@/components/app/app-topbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getCurrentUser } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()])
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false'

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppTopbar user={user} />
        <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
          {user && user.status !== 'active' && (
            <div
              role="alert"
              className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground"
            >
              Akun Anda belum aktif. Hubungi Dani Kurnia untuk mengaktifkan akses.
            </div>
          )}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}