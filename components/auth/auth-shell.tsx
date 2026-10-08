import { Warehouse } from 'lucide-react'
import type { ReactNode } from 'react'

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Warehouse className="size-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Customer Return Receiving</span>
            <span className="text-xs text-muted-foreground">Warehouse Management</span>
          </div>
        </div>
        <div className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground text-pretty">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
