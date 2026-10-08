'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ClipboardCheck,
  History,
  LayoutDashboard,
  LifeBuoy,
  PackageOpen,
  Settings2,
  Users,
  ChevronRight,
  Activity,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

/* ============================================================
   MAIN NAVIGATION
   ============================================================ */

const MAIN_NAV = [
  {
    href: '/dashboard',
    label: 'Dashboard Return',
    description: 'Monitoring penerimaan return',
    icon: LayoutDashboard,
  },
  {
    href: '/returns',
    label: 'Return Items',
    description: 'Kelola material return',
    icon: PackageOpen,
  },
  {
    href: '/inspection',
    label: 'Antrean Inspeksi',
    description: 'Material menunggu inspeksi',
    icon: ClipboardCheck,
  },
  {
    href: '/history',
    label: 'Return History',
    description: 'Riwayat aktivitas return',
    icon: History,
  },
]

/* ============================================================
   SETTINGS NAVIGATION
   ============================================================ */

const SETTINGS_NAV = [
  {
    href: '/settings/users',
    label: 'Users',
    description: 'Kelola pengguna sistem',
    icon: Users,
  },
  {
    href: '/settings/help',
    label: 'Bantuan',
    description: 'Panduan penggunaan aplikasi',
    icon: LifeBuoy,
  },
]

/* ============================================================
   SIDEBAR
   ============================================================ */

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const renderItems = (
    items:
      | typeof MAIN_NAV
      | typeof SETTINGS_NAV,
  ) =>
    items.map((item) => {
      const active = isActive(item.href)

      return (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            isActive={active}
            tooltip={{
              children: item.label,
            }}
            className={`
              group relative
              h-11
              overflow-hidden
              rounded-xl
              transition-all
              duration-200

              group-data-[collapsible=icon]:size-11
              group-data-[collapsible=icon]:justify-center
              group-data-[collapsible=icon]:px-0

              ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }
            `}
            render={
              <Link
                href={item.href}
                onClick={() => setOpenMobile(false)}
              />
            }
          >
            {/* Active indicator */}
            {active && (
              <span
                className="
                  absolute
                  left-0
                  top-1/2
                  h-7
                  w-1
                  -translate-y-1/2
                  rounded-r-full
                  bg-primary-foreground

                  group-data-[collapsible=icon]:left-0
                "
              />
            )}

            {/* ICON */}
            <span
              className={`
                flex
                size-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                transition-all
                duration-200

                ${
                  active
                    ? 'bg-primary-foreground/15'
                    : 'bg-sidebar-accent/70 group-hover:bg-background'
                }
              `}
            >
              <item.icon className="size-[17px]" />
            </span>

            {/* LABEL */}
            <span
              className="
                flex
                min-w-0
                flex-1
                flex-col
                items-start
                leading-none

                group-data-[collapsible=icon]:hidden
              "
            >
              <span className="truncate text-sm font-medium">
                {item.label}
              </span>

              <span
                className={`
                  mt-1
                  truncate
                  text-[10px]
                  leading-none

                  ${
                    active
                      ? 'text-primary-foreground/70'
                      : 'text-sidebar-foreground/50'
                  }
                `}
              >
                {item.description}
              </span>
            </span>

            {/* ARROW */}
            <ChevronRight
              className={`
                size-4
                shrink-0
                transition-all
                duration-200

                group-data-[collapsible=icon]:hidden

                ${
                  active
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'
                }
              `}
            />
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    })

  return (
    <Sidebar
      collapsible="icon"
      className="border-r"
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <SidebarHeader className="border-b border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="
                h-[68px]
                rounded-xl
                px-2

                hover:bg-sidebar-accent

                group-data-[collapsible=icon]:size-11
                group-data-[collapsible=icon]:h-11
                group-data-[collapsible=icon]:w-11
                group-data-[collapsible=icon]:justify-center
                group-data-[collapsible=icon]:px-0
              "
              tooltip={{
                children: 'SPINDO 5 • Customer Return Receiving',
              }}
              render={
                <Link
                  href="/dashboard"
                  onClick={() => setOpenMobile(false)}
                />
              }
            >
              {/* ==================================================
                  LOGO
              ================================================== */}

              <div
                className="
                  relative
                  flex
                  size-11
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  bg-white
                  shadow-sm
                  ring-1
                  ring-black/5
                "
              >
                <Image
                  src="/spindo 5.png"
                  alt="SPINDO 5"
                  width={44}
                  height={44}
                  priority
                  className="size-full object-contain p-1"
                />
              </div>

              {/* ==================================================
                  BRAND
              ================================================== */}

              <div
                className="
                  flex
                  min-w-0
                  flex-1
                  flex-col
                  leading-tight

                  group-data-[collapsible=icon]:hidden
                "
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
                    SPINDO 5
                  </span>

                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>

                <span className="mt-1 truncate text-[11px] text-sidebar-foreground/55">
                  Customer Return Receiving
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <SidebarContent className="px-2">
        {/* MAIN MENU */}

        <SidebarGroup className="py-4">
          <SidebarGroupLabel
            className="
              px-3
              pb-2
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.14em]
              text-sidebar-foreground/45

              group-data-[collapsible=icon]:hidden
            "
          >
            Menu Utama
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {renderItems(MAIN_NAV)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* SYSTEM STATUS */}

        <SidebarGroup className="py-2 group-data-[collapsible=icon]:hidden">
          <div className="mx-2 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent/40">
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground">
                  System Online
                </p>

                <p className="mt-0.5 truncate text-[10px] text-sidebar-foreground/50">
                  Return Receiving aktif
                </p>
              </div>

              <span className="ml-auto size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            </div>
          </div>
        </SidebarGroup>

        {/* SETTINGS */}

        <SidebarGroup className="py-4">
          <SidebarGroupLabel
            className="
              flex
              items-center
              gap-2
              px-3
              pb-2
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.14em]
              text-sidebar-foreground/45

              group-data-[collapsible=icon]:hidden
            "
          >
            <Settings2 className="size-3" />
            Pengaturan
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {renderItems(SETTINGS_NAV)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <SidebarFooter
        className="
          border-t
          border-sidebar-border
          p-3

          group-data-[collapsible=icon]:p-2
        "
      >
        <div
          className="
            rounded-xl
            bg-sidebar-accent/40
            px-3
            py-3

            group-data-[collapsible=icon]:hidden
          "
        >
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackageOpen className="size-3.5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-sidebar-foreground">
                Return Receiving
              </p>

              <p className="truncate text-[9px] text-sidebar-foreground/45">
                SPINDO 5 • Internal System
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-sidebar-border pt-2">
            <span className="text-[9px] text-sidebar-foreground/40">
              Architected by
            </span>

            <span className="text-[9px] font-medium text-sidebar-foreground/60">
              Dani Kurnia
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}