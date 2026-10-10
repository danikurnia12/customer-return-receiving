import type { Metadata } from 'next'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Headphones,
  Mail,
  MapPin,
  PackageCheck,
  PackageOpen,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
  Camera,
  Hash,
  Ruler,
  Boxes,
  CircleHelp,
} from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Pusat Bantuan',
  description:
    'Panduan penggunaan aplikasi Customer Return Receiving SPINDO 5.',
}

const GUIDES = [
  {
    title: 'Cara membuat penerimaan Return',
    subtitle: 'Mencatat penerimaan material baru',
    icon: PackageOpen,
    steps: [
      'Buka menu Return Items, lalu klik tombol "Penerimaan Baru".',
      'Isi bagian A. Informasi Return: Tanggal Penerimaan, No SPPB / Surat Jalan, dan Customer wajib diisi.',
      'Tambahkan minimal satu item material pada bagian B.',
      'Klik "Simpan Penerimaan Return", periksa ringkasan, lalu klik "Ya, Simpan".',
      'Sistem membuat No Return otomatis dengan format RET-YYYYMMDD-XXX.',
    ],
  },
  {
    title: 'Cara menambahkan beberapa item',
    subtitle: 'Mengelola beberapa material dalam satu Return',
    icon: Boxes,
    steps: [
      'Pada bagian B. Material Items, klik "+ Tambah Item".',
      'Isi dimensi, qty, kondisi, lokasi, dan unggah foto bila diperlukan, lalu klik "Simpan Item".',
      'Ulangi langkah tersebut untuk setiap material. Semua item akan berada pada Return Header yang sama.',
      'Gunakan ikon pensil untuk mengedit dan ikon tempat sampah untuk menghapus item sesuai fitur yang tersedia.',
    ],
  },
  {
    title: 'Cara mencari data Return',
    subtitle: 'Menemukan transaksi secara lebih cepat',
    icon: Search,
    steps: [
      'Buka menu Return Items.',
      'Masukkan No Return, No Surat Jalan, No Claim, atau nama Customer pada kolom pencarian.',
      'Gunakan filter Periode Tanggal, Customer, dan Status, lalu klik "Terapkan".',
      'Klik No Return untuk membuka halaman detail.',
    ],
  },
  {
    title: 'Cara melihat Return History',
    subtitle: 'Melacak aktivitas dan perubahan data',
    icon: Clock3,
    steps: [
      'Buka menu Return History untuk melihat riwayat aktivitas.',
      'Riwayat dapat mencatat waktu, user, aktivitas, data sebelum dan sesudah, serta catatan sesuai implementasi sistem.',
      'Periksa bagian riwayat pada halaman detail Return jika tersedia.',
      'Gunakan riwayat sebagai referensi penelusuran transaksi.',
    ],
  },
]

const FIELDS = [
  {
    name: 'No Return',
    description:
      'Nomor unik otomatis dari sistem, dengan format RET-YYYYMMDD-XXX.',
    icon: Hash,
    required: false,
    tag: 'Otomatis',
  },
  {
    name: 'Tanggal Penerimaan',
    description:
      'Tanggal saat material retur diterima di gudang.',
    icon: Clock3,
    required: true,
  },
  {
    name: 'No SPPB / Surat Jalan',
    description:
      'Nomor dokumen pengiriman yang menyertai material dari customer.',
    icon: FileText,
    required: true,
  },
  {
    name: 'No Claim',
    description:
      'Nomor klaim customer yang terkait dengan material abnormal.',
    icon: ClipboardCheck,
    required: false,
  },
  {
    name: 'Customer',
    description:
      'Nama customer yang mengembalikan material.',
    icon: UserRound,
    required: true,
  },
  {
    name: 'PIC Penerima',
    description:
      'Identitas petugas gudang yang menerima material.',
    icon: ShieldCheck,
    required: false,
  },
  {
    name: 'Diameter',
    description:
      'Ukuran diameter material, misalnya 2", 1-1/2", atau 60.5 mm.',
    icon: Ruler,
    required: false,
  },
  {
    name: 'Tebal / Panjang',
    description:
      'Dimensi material dalam milimeter, mengikuti ketentuan validasi sistem.',
    icon: Ruler,
    required: false,
  },
  {
    name: 'Batch / No Box',
    description:
      'Identitas batch produksi atau nomor box/kemasan material.',
    icon: Boxes,
    required: false,
  },
  {
    name: 'Qty Surat Jalan',
    description:
      'Jumlah material berdasarkan dokumen surat jalan.',
    icon: Truck,
    required: false,
  },
  {
    name: 'Qty Aktual Diterima',
    description:
      'Jumlah material yang diterima secara fisik. Perbedaan dari Qty Surat Jalan perlu diperiksa.',
    icon: PackageCheck,
    required: false,
  },
  {
    name: 'Kondisi Material',
    description:
      'Kondisi atau abnormalitas material, seperti dent, scratch, rust, atau bending.',
    icon: ClipboardCheck,
    required: false,
  },
  {
    name: 'Lokasi / SLOC',
    description:
      'Lokasi penyimpanan material di gudang sesuai kode yang digunakan sistem.',
    icon: MapPin,
    required: false,
  },
  {
    name: 'Foto Material / Surat Jalan',
    description:
      'Dokumentasi visual pendukung dalam format JPG, PNG, atau WEBP, dengan batas ukuran sesuai konfigurasi aplikasi.',
    icon: Camera,
    required: false,
  },
]

const QUICK_LINKS = [
  {
    title: 'Penerimaan Return',
    description: 'Input data penerimaan material.',
    icon: PackageOpen,
    href: '/returns',
    number: '01',
  },
  {
    title: 'Antrean Inspeksi',
    description: 'Periksa material yang menunggu inspeksi.',
    icon: ClipboardCheck,
    href: '/inspection',
    number: '02',
  },
  {
    title: 'Return History',
    description: 'Telusuri aktivitas transaksi.',
    icon: Clock3,
    href: '/history',
    number: '03',
  },
]

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-7 pb-10">
      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative isolate overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.09] via-transparent to-transparent" />

        <div className="absolute -right-20 -top-28 -z-10 size-80 rounded-full bg-primary/[0.08] blur-3xl" />

        <div className="absolute right-8 top-8 hidden size-28 items-center justify-center rounded-[2rem] border border-primary/10 bg-background/50 text-primary/15 backdrop-blur-sm md:flex">
          <LifeBuoyIcon />
        </div>

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="size-3.5" />
              Support Center
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[42px] lg:leading-[1.15]">
              Pusat Bantuan
              <span className="mt-1 block text-primary">
                Return Receiving
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Semua panduan yang kamu butuhkan untuk mengelola
              penerimaan material retur, dokumentasi, inspeksi,
              dan riwayat transaksi dalam satu tempat.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border bg-background/80 px-3 py-2 text-xs font-medium">
                <BookOpen className="size-4 text-primary" />
                {GUIDES.length} panduan penggunaan
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border bg-background/80 px-3 py-2 text-xs font-medium">
                <FileText className="size-4 text-primary" />
                {FIELDS.length} referensi field
              </div>
            </div>
          </div>

          <div className="hidden w-48 flex-col gap-3 rounded-2xl border bg-background/75 p-4 shadow-sm backdrop-blur-sm lg:flex">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold">
                  User Guide
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Internal Application
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            <p className="text-xs leading-5 text-muted-foreground">
              Panduan kerja dan referensi untuk membantu proses
              administrasi retur material.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK NAVIGATION
      ===================================================== */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Quick Access
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">
              Akses Menu Utama
            </h2>
          </div>

          <p className="text-xs text-muted-foreground">
            Pilih menu untuk melanjutkan pekerjaan
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon

            return (
              <a
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
                    MENU {item.number}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </a>
            )
          })}
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* GUIDES */}
          <Card className="overflow-hidden rounded-2xl border shadow-sm">
            <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">
                    Panduan Penggunaan
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs leading-5">
                    Ikuti langkah berikut untuk menjalankan proses
                    Return Receiving.
                  </CardDescription>
                </div>

                <span className="rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold tabular-nums">
                  {GUIDES.length} topik
                </span>
              </div>
            </CardHeader>

            <CardContent className="px-5 py-2 sm:px-6">
              <Accordion
                defaultValue={[GUIDES[0].title]}
                className="w-full"
              >
                {GUIDES.map((guide, index) => {
                  const Icon = guide.icon

                  return (
                    <AccordionItem
                      key={guide.title}
                      value={guide.title}
                      className="border-b last:border-b-0"
                    >
                      <AccordionTrigger className="gap-3 py-5 text-left hover:no-underline">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground">
                            <Icon className="size-[18px]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                              Panduan {String(index + 1).padStart(2, '0')}
                            </p>

                            <p className="mt-1 text-sm font-semibold leading-5">
                              {guide.title}
                            </p>

                            <p className="mt-1 text-xs font-normal leading-5 text-muted-foreground">
                              {guide.subtitle}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="ml-1 border-l-2 border-primary/15 pb-4 pl-5 sm:ml-2 sm:pl-6">
                          <ol className="space-y-4">
                            {guide.steps.map((step, stepIndex) => (
                              <li
                                key={step}
                                className="relative flex gap-3"
                              >
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-[10px] font-bold text-primary">
                                  {stepIndex + 1}
                                </span>

                                <p className="pt-0.5 text-sm leading-6 text-muted-foreground">
                                  {step}
                                </p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>

          {/* FIELD REFERENCE */}
          <Card className="overflow-hidden rounded-2xl border shadow-sm">
            <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardCheck className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">
                    Referensi Data Return
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs leading-5">
                    Fungsi setiap kolom saat mengisi data penerimaan.
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-rose-500" />
                  Wajib diisi
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Otomatis oleh sistem
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y">
                {FIELDS.map((field, index) => {
                  const Icon = field.icon

                  return (
                    <div
                      key={field.name}
                      className="group grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-5 py-4 transition-colors hover:bg-muted/20 sm:px-6"
                    >
                      <div className="flex size-9 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors group-hover:border-primary/20 group-hover:text-primary">
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">
                            {field.name}
                          </span>

                          {field.required && (
                            <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                              WAJIB
                            </span>
                          )}

                          {field.tag && (
                            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                              {field.tag.toUpperCase()}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                          {field.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-5 xl:sticky xl:top-6">
          {/* CONTACT */}
          <Card className="overflow-hidden rounded-2xl border shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/20" />

            <CardHeader className="px-5 pb-3 pt-5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Headphones className="size-6" />
              </div>

              <CardTitle className="pt-2 text-base">
                Butuh Bantuan?
              </CardTitle>

              <CardDescription className="text-xs leading-5">
                Hubungi Kepala Regu Repair & Return atau pengelola sistem jika
                mengalami kendala akses maupun data.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 px-5 pb-5">
              <a
                href="mailto:admin.warehouse@perusahaan.co.id"
                className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="size-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">
                    Email Admin
                  </p>
                  <p className="mt-0.5 break-all text-xs font-semibold">
                    danikurnia244222011@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="tel:+628388436725"
                className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Phone className="size-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">
                    Telepon
                  </p>
                  <p className="mt-0.5 text-xs font-semibold">
                    (+62) 8388-4367-25
                  </p>
                </div>
              </a>

              <div className="flex gap-3 rounded-xl bg-muted/40 p-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                <div>
                  <p className="text-xs font-semibold">
                    Jam Operasional
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Senin–Rabu
                    <br />
                    09.00–15.00 WIB
                  </p>
                </div>
              </div>

              <p className="text-[10px] leading-5 text-muted-foreground">
                Saat melapor, sertakan nomor Return, waktu kejadian,
                uraian kendala, dan screenshot bila diperlukan.
              </p>
            </CardContent>
          </Card>

          {/* BEST PRACTICES */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="px-5 pb-3 pt-5">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                </div>

                <CardTitle className="text-sm">
                  Tips Penggunaan
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="px-5 pb-5">
              <ul className="space-y-3">
                {[
                  'Periksa kembali nomor dokumen sebelum menyimpan.',
                  'Pastikan jumlah aktual sesuai hasil pemeriksaan fisik.',
                  'Gunakan foto yang jelas sebagai bukti pendukung.',
                  'Periksa kembali data sebelum mengonfirmasi penyimpanan.',
                ].map((tip) => (
                  <li
                    key={tip}
                    className="flex gap-2.5 text-xs leading-5 text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* SECURITY */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />

              <div>
                <p className="text-xs font-semibold">
                  Keamanan Data
                </p>

                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  Gunakan akun sesuai hak akses. Jangan membagikan
                  kata sandi atau informasi rahasia sistem.
                </p>
              </div>
            </div>
          </div>

          {/* FOOTNOTE */}
          <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground">
            <span>SPINDO 5 · Internal System</span>
            <span className="inline-flex items-center gap-1">
              <Activity className="size-3" />
              Return Receiving
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}

function LifeBuoyIcon() {
  return (
    <div className="relative flex size-20 items-center justify-center">
      <div className="absolute inset-1 rounded-full border-[10px] border-current" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-9 rounded-full border-[7px] border-current bg-background" />
      </div>
      <div className="absolute left-1/2 top-0 h-5 w-3 -translate-x-1/2 rounded-b-sm bg-background" />
      <div className="absolute bottom-0 left-1/2 h-5 w-3 -translate-x-1/2 rounded-t-sm bg-background" />
      <div className="absolute left-0 top-1/2 h-3 w-5 -translate-y-1/2 rounded-r-sm bg-background" />
      <div className="absolute right-0 top-1/2 h-3 w-5 -translate-y-1/2 rounded-l-sm bg-background" />
    </div>
  )
}