'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toPng } from 'html-to-image'

import { signOutAction } from '@/app/actions/users'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import { Button } from '@/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

import { ROLE_LABELS } from '@/lib/permissions'
import type { AppUser } from '@/lib/types'

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard Return',
  returns: 'Return Items',
  new: 'Penerimaan Baru',
  history: 'Return History',
  settings: 'Pengaturan',
  users: 'Users',
  help: 'Bantuan',
}

function useCrumbs() {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)

  return segments.map((seg, idx) => ({
    href: `/${segments.slice(0, idx + 1).join('/')}`,
    label: SEGMENT_LABELS[seg] ?? 'Detail Return',
    linkable: seg !== 'settings',
  }))
}

export function AppTopbar({ user }: { user: AppUser | null }) {
  const crumbs = useCrumbs()

  const { resolvedTheme, setTheme } = useTheme()

  const [screenshotLoading, setScreenshotLoading] = useState(false)

  const initials = (user?.name ?? 'G')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isDashboard = usePathname() === '/dashboard'

  async function handleScreenshot() {
    const element = document.getElementById('dashboard-screenshot')

    if (!element) {
      alert(
        'Area dashboard tidak ditemukan. Pastikan dashboard memiliki id "dashboard-screenshot".',
      )
      return
    }

    try {
      setScreenshotLoading(true)

      /*
       * Beri sedikit jeda supaya state loading
       * sempat dirender sebelum screenshot dibuat.
       */
      await new Promise((resolve) => setTimeout(resolve, 150))

      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: false,
      })

      const link = document.createElement('a')

      const today = new Date()
        .toLocaleDateString('sv-SE')

      link.download = `dashboard-return-${today}.png`

      link.href = dataUrl

      link.click()
    } catch (error) {
      console.error('[Dashboard Screenshot]', error)

      alert(
        'Screenshot dashboard gagal dibuat. Silakan coba kembali.',
      )
    } finally {
      setScreenshotLoading(false)
    }
  }

  return (
    <header
      className="
        sticky top-0 z-40
        flex h-16 shrink-0 items-center gap-2
        border-b
        bg-background/90
        px-3
        backdrop-blur-xl
        supports-[backdrop-filter]:bg-background/70
        sm:px-4
      "
    >
      {/* =====================================================
          LEFT SIDE
          ===================================================== */}

      <SidebarTrigger
        className="
          size-9
          shrink-0
          rounded-lg
          transition-all
          hover:bg-muted
        "
      />

      <Separator
        orientation="vertical"
        className="mx-1 h-5"
      />

      {/* =====================================================
          BREADCRUMB
          ===================================================== */}

      <div className="min-w-0 flex-1">
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap">
            {crumbs.map((crumb, idx) => {
              const last = idx === crumbs.length - 1

              return (
                <Fragment key={crumb.href}>
                  {idx > 0 && (
                    <BreadcrumbSeparator className="hidden sm:block" />
                  )}

                  <BreadcrumbItem
                    className={
                      last
                        ? 'min-w-0'
                        : 'hidden sm:inline-flex'
                    }
                  >
                    {last || !crumb.linkable ? (
                      <BreadcrumbPage className="truncate font-semibold">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        render={
                          <Link href={crumb.href} />
                        }
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Small system status */}
        <div className="mt-0.5 hidden items-center gap-1.5 lg:flex">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>

          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            System Online
          </span>
        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE
          ===================================================== */}

      <div className="flex items-center gap-1.5">

        {/* ===================================================
            SCREENSHOT
            =================================================== */}

        {isDashboard && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Screenshot dashboard"
            title="Screenshot dashboard"
            onClick={handleScreenshot}
            disabled={screenshotLoading}
            className="
              group
              relative
              size-9
              overflow-hidden
              rounded-lg
              border
              border-transparent
              transition-all
              duration-200
              hover:border-primary/20
              hover:bg-primary/10
              hover:text-primary
              hover:shadow-sm
              disabled:opacity-60
            "
          >
            {screenshotLoading ? (
              <>
                <span
                  className="
                    absolute inset-0
                    animate-pulse
                    bg-primary/10
                  "
                />

                <Camera
                  className="
                    relative
                    size-4
                    animate-pulse
                    text-primary
                  "
                />
              </>
            ) : (
              <>
                <Camera
                  className="
                    size-4
                    transition-transform
                    duration-200
                    group-hover:scale-110
                  "
                />

                {/* Small accent */}
                <span
                  className="
                    absolute
                    right-1
                    top-1
                    size-1.5
                    rounded-full
                    bg-primary
                    opacity-0
                    transition-opacity
                    group-hover:opacity-100
                  "
                />
              </>
            )}
          </Button>
        )}

        {/* ===================================================
            THEME
            =================================================== */}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Ganti tema"
          title="Ganti tema"
          onClick={() =>
            setTheme(
              resolvedTheme === 'dark'
                ? 'light'
                : 'dark',
            )
          }
          className="
            size-9
            rounded-lg
            border
            border-transparent
            transition-all
            hover:border-border
            hover:bg-muted
          "
        >
          <Sun className="hidden size-4 dark:block" />

          <Moon className="size-4 dark:hidden" />
        </Button>

        {/* ===================================================
            SEPARATOR
            =================================================== */}

        <Separator
          orientation="vertical"
          className="mx-1 hidden h-7 sm:block"
        />

        {/* ===================================================
            ACCOUNT
            =================================================== */}

        <DropdownMenu>
          <DropdownMenuTrigger
            className="
              group
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-transparent
              px-1.5
              py-1
              outline-none
              transition-all
              hover:border-border
              hover:bg-muted/70
              focus-visible:ring-2
              focus-visible:ring-ring
            "
            aria-label="Menu akun"
          >
            {/* Avatar */}
            <span
              className="
                relative
                flex
                size-8
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-full
                bg-gradient-to-br
                from-primary
                to-primary/70
                text-[11px]
                font-bold
                text-primary-foreground
                shadow-sm
                ring-2
                ring-background
              "
            >
              {initials}

              {/* Online indicator */}
              <span
                className="
                  absolute
                  bottom-0
                  right-0
                  size-2.5
                  rounded-full
                  border-2
                  border-background
                  bg-emerald-500
                "
              />
            </span>

            {/* User information */}
            <span className="hidden min-w-0 flex-col items-start text-left leading-tight md:flex">
              <span className="max-w-[130px] truncate text-sm font-semibold text-foreground">
                {user?.name ?? 'Mode Setup'}
              </span>

              <span className="max-w-[130px] truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {user
                  ? ROLE_LABELS[user.role]
                  : 'Belum terhubung'}
              </span>
            </span>

            {/* Chevron */}
            <span
              className="
                hidden
                text-muted-foreground
                transition-transform
                duration-200
                group-data-[state=open]:rotate-180
                md:block
              "
            >
              ▾
            </span>
          </DropdownMenuTrigger>

          {/* =================================================
              ACCOUNT DROPDOWN
              ================================================= */}

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="
              w-64
              rounded-xl
              border
              p-1.5
              shadow-xl
            "
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-3">
                <div className="flex items-center gap-3">
                  {/* Avatar large */}
                  <div
                    className="
                      flex
                      size-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-primary
                      text-xs
                      font-bold
                      text-primary-foreground
                      shadow-sm
                    "
                  >
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {user?.name ?? 'Mode Setup'}
                    </p>

                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {user?.email ??
                        'Supabase belum terhubung'}
                    </p>

                    {user && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="size-3 text-emerald-500" />

                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                          {ROLE_LABELS[user.role]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            {user && (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => signOutAction()}
                  className="
                    cursor-pointer
                    rounded-lg
                    px-3
                    py-2.5
                    text-sm
                    font-medium
                  "
                >
                  <LogOut className="size-4" />

                  <span>Keluar dari sistem</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}