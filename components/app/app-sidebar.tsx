
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

import {
  Activity,
  ChevronRight,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LifeBuoy,
  PackageOpen,
  Settings2,
  Users,
  Warehouse,
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
   NAVIGATION TYPE
   ============================================================ */

type NavItem = {
  href: string
  label: string
  description: string
  icon: LucideIcon
}

/* ============================================================
   MAIN NAVIGATION
   ============================================================ */

const MAIN_NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard Return',
    description: 'Monitoring penerimaan Return',
    icon: LayoutDashboard,
  },
  {
    href: '/returns',
    label: 'Return Items',
    description: 'Kelola material Return',
    icon: PackageOpen,
  },
  {
    href: '/inspection',
    label: 'Progres Administrasi',
    description: 'Pantau tahapan administrasi Return',
    icon: ClipboardCheck,
  },
  {
    href: '/history',
    label: 'Return History',
    description: 'Riwayat aktivitas Return',
    icon: History,
  },
]

/* ============================================================
   SETTINGS NAVIGATION
   ============================================================ */

const SETTINGS_NAV: NavItem[] = [
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
   NAVIGATION ITEM
   ============================================================ */

function NavigationItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={{
          children: item.label,
        }}
        className={`
          group relative
          h-auto
          min-h-[56px]
          w-full
          items-center
          gap-2.5
          rounded-xl
          px-2
          py-2
          transition-colors
          duration-200

          group-data-[collapsible=icon]:size-10
          group-data-[collapsible=icon]:h-10
          group-data-[collapsible=icon]:min-h-10
          group-data-[collapsible=icon]:w-10
          group-data-[collapsible=icon]:gap-0
          group-data-[collapsible=icon]:justify-center
          group-data-[collapsible=icon]:p-0

          ${
            active
              ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }
        `}
        render={
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
          />
        }
      >
        {/* ACTIVE INDICATOR */}

        {active && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground"
          />
        )}

        {/* ICON */}

        <span
          className={`
            flex
            size-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            transition-colors
            duration-200

            group-data-[collapsible=icon]:size-8

            ${
              active
                ? 'bg-primary-foreground/15'
                : 'bg-sidebar-accent/70 group-hover:bg-background'
            }
          `}
        >
          <Icon className="size-[19px] shrink-0" />
        </span>

        {/* LABEL AND DESCRIPTION */}

        <span
          className="
            flex
            min-w-0
            flex-1
            flex-col
            items-start
            whitespace-normal
            leading-tight
            group-data-[collapsible=icon]:hidden
          "
        >
          <span
            className="
              w-full
              whitespace-normal
              break-words
              text-[13px]
              font-semibold
              leading-[1.35]
            "
          >
            {item.label}
          </span>

          <span
            className={`
              mt-1
              w-full
              whitespace-normal
              break-words
              text-[10px]
              leading-[1.4]

              ${
                active
                  ? 'text-primary-foreground/75'
                  : 'text-sidebar-foreground/55'
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
}

/* ============================================================
   NAVIGATION GROUP
   ============================================================ */

function NavigationGroup({
  title,
  items,
  activePath,
  onNavigate,
  icon: GroupIcon,
}: {
  title: string
  items: NavItem[]
  activePath: string
  onNavigate: () => void
  icon?: LucideIcon
}) {
  const isActive = (href: string) =>
    activePath === href ||
    activePath.startsWith(`${href}/`)

  return (
    <SidebarGroup
      className="
        px-2
        py-3
        group-data-[collapsible=icon]:px-1
        group-data-[collapsible=icon]:py-2
      "
    >
      <SidebarGroupLabel
        className="
          flex
          h-8
          items-center
          gap-2
          px-3
          text-[10px]
          font-bold
          uppercase
          tracking-[0.16em]
          text-sidebar-foreground/45
          group-data-[collapsible=icon]:hidden
        "
      >
        {GroupIcon && (
          <GroupIcon className="size-3.5" />
        )}

        {title}
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-1.5">
          {items.map((item) => (
            <NavigationItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

/* ============================================================
   SIDEBAR
   ============================================================ */

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  const handleNavigate = () => {
    setOpenMobile(false)
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border"
    >
      {/* ======================================================
          BRAND HEADER
      ====================================================== */}

      <SidebarHeader
        className="
          border-b
          border-sidebar-border
          p-2
          group-data-[collapsible=icon]:px-1
          group-data-[collapsible=icon]:py-2
        "
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={{
                children: 'SPINDO 5 · Customer Return Receiving',
              }}
              className="
                h-[68px]
                w-full
                gap-3
                rounded-xl
                px-2
                hover:bg-sidebar-accent

                group-data-[collapsible=icon]:size-10
                group-data-[collapsible=icon]:h-10
                group-data-[collapsible=icon]:w-10
                group-data-[collapsible=icon]:justify-center
                group-data-[collapsible=icon]:gap-0
                group-data-[collapsible=icon]:p-0
              "
              render={
                <Link
                  href="/dashboard"
                  onClick={handleNavigate}
                  aria-label="SPINDO 5 Dashboard Return"
                />
              }
            >
              {/* LOGO */}

              <div
                className="
                  flex
                  size-11
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  bg-white
                  p-0.5
                  shadow-sm
                  ring-1
                  ring-black/5
                  transition-all
                  duration-200
                  group-data-[collapsible=icon]:size-8
                  group-data-[collapsible=icon]:rounded-lg
                  group-data-[collapsible=icon]:p-0
                "
              >
                <Image
                  src="/spindo 5.png"
                  alt="SPINDO 5"
                  width={44}
                  height={44}
                  priority
                  className="size-full object-contain"
                />
              </div>

              {/* BRAND INFORMATION */}

              <div
                className="
                  flex
                  min-w-0
                  flex-1
                  flex-col
                  items-start
                  leading-tight
                  group-data-[collapsible=icon]:hidden
                "
              >
                <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                  SPINDO 5
                </span>

                <span className="mt-1 whitespace-normal text-[11px] leading-4 text-sidebar-foreground/55">
                  Customer Return Receiving
                </span>

                <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
                  Warehouse System
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ======================================================
          SIDEBAR CONTENT
      ====================================================== */}

      <SidebarContent className="px-0">
        {/* MAIN NAVIGATION */}

        <NavigationGroup
          title="Menu Utama"
          items={MAIN_NAV}
          activePath={pathname}
          onNavigate={handleNavigate}
        />

        {/* WORKSPACE INFORMATION */}

        <SidebarGroup
          className="
            px-2
            py-1
            group-data-[collapsible=icon]:hidden
          "
        >
          <div className="overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent/40">
            <div className="flex items-start gap-3 p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Warehouse className="size-[18px]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-sidebar-foreground">
                  Warehouse SPINDO 5
                </p>

                <p className="mt-1 whitespace-normal text-[10px] leading-[1.5] text-sidebar-foreground/55">
                  Pencatatan penerimaan dan monitoring material Return.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-sidebar-border px-3 py-2">
              <Activity className="size-3.5 shrink-0 text-sidebar-foreground/45" />

              <span className="text-[9px] font-medium text-sidebar-foreground/50">
                Internal Operational System
              </span>
            </div>
          </div>
        </SidebarGroup>

        {/* SETTINGS NAVIGATION */}

        <NavigationGroup
          title="Pengaturan"
          items={SETTINGS_NAV}
          activePath={pathname}
          onNavigate={handleNavigate}
          icon={Settings2}
        />
      </SidebarContent>

      {/* ======================================================
          FOOTER / DEVELOPER IDENTITY
      ====================================================== */}

      <SidebarFooter
        className="
          border-t
          border-sidebar-border
          p-3
          group-data-[collapsible=icon]:hidden
        "
      >
        <div className="rounded-xl bg-sidebar-accent/40 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackageOpen className="size-4" />
            </div>

            <div className="min-w-0">
              <p className="whitespace-normal text-[11px] font-bold leading-4 text-sidebar-foreground">
                Customer Return Receiving
              </p>

              <p className="mt-0.5 text-[9px] text-sidebar-foreground/45">
                SPINDO 5 · Internal System
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-sidebar-border pt-2.5">
            <span className="text-[9px] text-sidebar-foreground/45">
              Dikembangkan oleh
            </span>

            <span className="text-[10px] font-bold text-sidebar-foreground/75">
              Dani Kurnia
            </span>
          </div>
        </div>
      </SidebarFooter>

      {/* COLLAPSE RAIL */}

      <SidebarRail />
    </Sidebar>
  )
}