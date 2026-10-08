const TIME_ZONE = 'Asia/Jakarta'

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

export function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return '-'
  return numberFormatter.format(n)
}

/** Menerima "YYYY-MM-DD" atau ISO timestamp, hasil DD/MM/YYYY. */
export function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`
  const parts = getParts(value)
  if (!parts) return '-'
  return `${parts.day}/${parts.month}/${parts.year}`
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const parts = getParts(value)
  if (!parts) return '-'
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}

function getParts(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const map: Record<string, string> = {}
  for (const p of new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)) {
    map[p.type] = p.value
  }
  return {
    day: map.day,
    month: map.month,
    year: map.year,
    hour: map.hour === '24' ? '00' : map.hour,
    minute: map.minute,
  }
}

/** Tanggal hari ini (zona Asia/Jakarta) dalam format YYYY-MM-DD. */
export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function monthStartISO() {
  return `${todayISO().slice(0, 7)}-01`
}

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function formatMonthLabel(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-')
  return `${MONTHS_ID[Number(m) - 1]} ${y}`
}
