'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateUserAction } from '@/app/actions/users'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import { ROLE_LABELS, ROLES } from '@/lib/permissions'
import type { AppUser, Role, UserStatus } from '@/lib/types'

const STATUS_ITEMS = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
]

export function UsersTable({
  users,
  canManage,
  currentUserId,
}: {
  users: AppUser[]
  canManage: boolean
  currentUserId: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const roleItems = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))

  const update = (id: string, patch: { role?: Role; status?: UserStatus }) => {
    startTransition(async () => {
      const res = await updateUserAction(id, patch)
      if (!res.ok) toast.error(res.error)
      else {
        toast.success('User diperbarui')
        router.refresh()
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const editable = canManage && u.id !== currentUserId
            return (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.name}
                  {u.id === currentUserId && <span className="ml-1.5 text-xs text-muted-foreground">(Anda)</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {editable ? (
                    <Select
                      items={roleItems}
                      value={u.role}
                      disabled={pending}
                      onValueChange={(v) => v && update(u.id, { role: v as Role })}
                    >
                      <SelectTrigger size="sm" className="w-32" aria-label={`Role ${u.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleItems.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <Select
                      items={STATUS_ITEMS}
                      value={u.status}
                      disabled={pending}
                      onValueChange={(v) => v && update(u.id, { status: v as UserStatus })}
                    >
                      <SelectTrigger size="sm" className="w-32" aria-label={`Status ${u.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_ITEMS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="outline"
                      className={
                        u.status === 'active'
                          ? 'border-success/30 bg-success/10 text-success'
                          : 'text-muted-foreground'
                      }
                    >
                      {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">{formatDateTime(u.created_at)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
