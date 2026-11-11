
import type { Metadata } from 'next'
import Link from 'next/link'

import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Database,
  FileText,
  Headphones,
  History,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  PackageOpen,
  Phone,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
  Boxes,
  Hash,
  CircleHelp,
  Ban,
  Pencil,
  Warehouse,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

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

/* ============================================================
   TYPES
   ============================================================ */

type Guide = {
  title: string
  subtitle: string
  icon: LucideIcon
  steps: string[]
}

type FieldReference = {
  name: string
  category: 'header' | 'item'
  description: string
  icon: LucideIcon
  required?: boolean
  automatic?: boolean
}

type QuickLink = {
  title: string
  description: string
  icon: LucideIcon
  href: string
  number: string
}

/* ============================================================
   QUICK NAVIGATION
   ============================================================ */

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Dashboard Return',
    description: 'Ringkasan monitoring penerimaan material.',
    icon: LayoutDashboard,
    href: '/dashboard',
    number: '01',
  },
  {
    title: 'Return Items',
    description: 'Pencatatan dan pengelolaan material Return.',
    icon: PackageOpen,
    href: '/returns',
    number: '02',
  },
  {
    title: 'Progres Administrasi',
    description: 'Pemantauan Claim, NCR, dan Disposisi.',
    icon: ClipboardCheck,
    href: '/inspection',
    number: '03',
  },
  {
    title: 'Return History',
    description: 'Penelusuran aktivitas dan perubahan transaksi.',
    icon: History,
    href: '/history',
    number: '04',
  },
]

/* ============================================================
   WORKFLOW
   ============================================================ */

const WORKFLOW = [
  {
    number: '01',
    title: 'Penerimaan Fisik',
    description:
      'Material Return diterima bersama dokumen pendukung dan diperiksa secara fisik.',
    icon: Truck,
  },
  {
    number: '02',
    title: 'Pencatatan Return',
    description:
      'Data penerimaan dan detail material dicatat ke dalam aplikasi.',
    icon: PackageCheck,
  },
  {
    number: '03',
    title: 'Progres Administrasi',
    description:
      'Nomor Claim, NCR, dan Disposisi dicatat serta dipantau perkembangannya.',
    icon: ClipboardList,
  },
  {
    number: '04',
    title: 'Riwayat dan Monitoring',
    description:
      'Aktivitas transaksi ditelusuri kembali melalui Dashboard dan Return History.',
    icon: History,
  },
]

/* ============================================================
   USER GUIDES
   ============================================================ */

const GUIDES: Guide[] = [
  {
    title: 'Memahami Dashboard Return',
    subtitle: 'Melihat ringkasan dan kondisi penerimaan',
    icon: LayoutDashboard,
    steps: [
      'Buka menu Dashboard Return.',
      'Periksa ringkasan jumlah transaksi, kuantitas aktual, dan informasi penerimaan yang tersedia.',
      'Gunakan grafik dan informasi customer untuk melihat perkembangan penerimaan.',
      'Gunakan filter yang tersedia untuk melihat data berdasarkan periode atau kriteria tertentu.',
      'Gunakan informasi Dashboard sebagai bahan monitoring. Untuk memeriksa transaksi secara detail, buka menu Return Items.',
    ],
  },
  {
    title: 'Membuat Penerimaan Return Baru',
    subtitle: 'Mencatat kedatangan material dari customer',
    icon: PackageOpen,
    steps: [
      'Buka menu Return Items, kemudian pilih Penerimaan Baru.',
      'Isi informasi Header Return, terutama Tanggal Penerimaan, No SPPB / Surat Jalan, dan Customer.',
      'Lengkapi informasi pendukung seperti No Claim, PIC Penerima, dan catatan apabila diperlukan.',
      'Tambahkan minimal satu item material pada bagian detail.',
      'Periksa kembali informasi Header dan seluruh item yang sudah dimasukkan.',
      'Klik Simpan Penerimaan Return dan ikuti konfirmasi penyimpanan yang ditampilkan aplikasi.',
      'Setelah transaksi berhasil disimpan, sistem akan memberikan No Return secara otomatis.',
    ],
  },
  {
    title: 'Menambahkan dan Mengelola Item Material',
    subtitle: 'Mencatat detail setiap material dalam satu Return',
    icon: Boxes,
    steps: [
      'Buka transaksi Return yang ingin dikelola.',
      'Pada bagian Material Items, pilih Tambah Item.',
      'Isi informasi material seperti Diameter, Tebal, Panjang, Batch, dan No Box sesuai kondisi aktual.',
      'Masukkan Qty Surat Jalan dan Qty Aktual berdasarkan dokumen serta hasil pemeriksaan fisik.',
      'Pilih kondisi material dan lokasi penyimpanan sesuai pilihan yang tersedia.',
      'Tambahkan foto pendukung apabila diperlukan.',
      'Simpan item dan pastikan detail material sudah tampil pada transaksi.',
      'Gunakan fungsi Edit untuk memperbaiki informasi dan Hapus untuk menghapus item sesuai hak akses yang diberikan.',
    ],
  },
  {
    title: 'Memantau Progres Administrasi Return',
    subtitle: 'Memonitor perkembangan dokumen administrasi',
    icon: ClipboardCheck,
    steps: [
      'Buka menu Progres Administrasi.',
      'Cari transaksi menggunakan No Return, Customer, ukuran material, nomor Claim, atau nomor NCR.',
      'Periksa informasi penerimaan dan detail material yang ditampilkan.',
      'Periksa nomor Claim, nomor NCR, dan Disposisi untuk mengetahui kelengkapan administrasi.',
      'Gunakan fungsi Edit Administrasi apabila tersedia dan akun memiliki hak akses.',
      'Isi atau perbarui informasi administrasi sesuai dokumen dan hasil tindak lanjut yang telah dikonfirmasi.',
      'Klik Simpan Administrasi dan periksa pesan hasil penyimpanan.',
      'Gunakan halaman ini untuk membantu memantau progres, bukan sebagai pengganti dokumen resmi atau proses administrasi SAP.',
    ],
  },
  {
    title: 'Melihat Return History',
    subtitle: 'Menelusuri riwayat perubahan transaksi',
    icon: History,
    steps: [
      'Buka menu Return History.',
      'Gunakan pencarian atau filter yang tersedia untuk menemukan transaksi.',
      'Periksa aktivitas berdasarkan waktu, pengguna, dan jenis perubahan yang tercatat.',
      'Gunakan informasi sebelum dan sesudah perubahan apabila tersedia.',
      'Jadikan riwayat sebagai referensi penelusuran apabila terdapat perbedaan atau perubahan data.',
    ],
  },
  {
    title: 'Membatalkan dan Menghapus Return',
    subtitle: 'Memahami perbedaan pembatalan dan penghapusan',
    icon: Ban,
    steps: [
      'Periksa No Return dan seluruh informasi transaksi sebelum melakukan pembatalan.',
      'Gunakan fungsi Batalkan hanya apabila transaksi memang perlu dibatalkan.',
      'Transaksi yang dibatalkan akan memiliki status Dibatalkan dan tidak lagi dihitung sebagai Return aktif pada ringkasan monitoring.',
      'Penghapusan transaksi yang sudah dibatalkan merupakan tindakan berbeda dari pembatalan.',
      'Fungsi hapus transaksi yang dibatalkan hanya tersedia bagi pengguna dengan hak akses Master Data.',
      'Pastikan keputusan pembatalan atau penghapusan sudah sesuai prosedur internal.',
    ],
  },
]

/* ============================================================
   FIELD REFERENCES
   ============================================================ */

const FIELDS: FieldReference[] = [
  {
    name: 'No Return',
    category: 'header',
    description:
      'Nomor identitas transaksi Return yang dibuat otomatis oleh sistem setelah penyimpanan berhasil.',
    icon: Hash,
    automatic: true,
  },
  {
    name: 'Tanggal Penerimaan',
    category: 'header',
    description:
      'Tanggal ketika material Return diterima di gudang.',
    icon: Clock3,
    required: true,
  },
  {
    name: 'No SPPB / Surat Jalan',
    category: 'header',
    description:
      'Nomor dokumen pengiriman yang menyertai material dari customer.',
    icon: FileText,
    required: true,
  },
  {
    name: 'Customer',
    category: 'header',
    description:
      'Nama customer yang mengembalikan material.',
    icon: UserRound,
    required: true,
  },
  {
    name: 'No Claim',
    category: 'header',
    description:
      'Nomor klaim atau referensi administrasi customer yang terkait dengan pengembalian material.',
    icon: ClipboardCheck,
  },
  {
    name: 'PIC Penerima',
    category: 'header',
    description:
      'Nama petugas yang bertanggung jawab menerima material Return.',
    icon: ShieldCheck,
  },
  {
    name: 'Catatan',
    category: 'header',
    description:
      'Keterangan tambahan mengenai penerimaan atau kondisi transaksi.',
    icon: FileText,
  },
  {
    name: 'Diameter',
    category: 'item',
    description:
      'Ukuran diameter material sesuai spesifikasi dan hasil pemeriksaan.',
    icon: Ruler,
  },
  {
    name: 'Tebal',
    category: 'item',
    description:
      'Ketebalan material dalam milimeter sesuai hasil pengukuran.',
    icon: Ruler,
  },
  {
    name: 'Panjang',
    category: 'item',
    description:
      'Panjang material dalam milimeter sesuai kondisi aktual.',
    icon: Ruler,
  },
  {
    name: 'Batch',
    category: 'item',
    description:
      'Nomor atau identitas batch produksi material.',
    icon: Boxes,
  },
  {
    name: 'No Box',
    category: 'item',
    description:
      'Nomor box atau kemasan material jika tersedia.',
    icon: Boxes,
  },
  {
    name: 'Qty Surat Jalan',
    category: 'item',
    description:
      'Jumlah material berdasarkan dokumen Surat Jalan.',
    icon: Truck,
  },
  {
    name: 'Qty Aktual',
    category: 'item',
    description:
      'Jumlah material yang benar-benar diterima berdasarkan pemeriksaan fisik.',
    icon: PackageCheck,
  },
  {
    name: 'Kondisi Material',
    category: 'item',
    description:
      'Keterangan kondisi atau abnormalitas, seperti Dent, Scratch, karat, Bending, Crack, Oval, Kotor/Noda, Ukuran Tidak Sesuai, dan Lainnya.',
    icon: ClipboardCheck,
  },
  {
    name: 'Location / SLOC',
    category: 'item',
    description:
      'Lokasi penyimpanan material. Pilih kode yang tersedia sesuai kategori material, yaitu 5b02 untuk kategori panjang dan 5n12 untuk kategori pendek.',
    icon: MapPin,
  },
  {
    name: 'Foto Material / Dokumen',
    category: 'item',
    description:
      'Dokumentasi visual untuk membantu penelusuran material dan bukti pendukung penerimaan.',
    icon: Camera,
  },
]

/* ============================================================
   FAQ
   ============================================================ */

const FAQS = [
  {
    question: 'Mengapa No Return tidak muncul?',
    answer:
      'Pastikan seluruh informasi wajib sudah diisi dan proses penyimpanan telah berhasil. Nomor Return dibuat oleh sistem setelah transaksi berhasil disimpan.',
  },
  {
    question: 'Apa perbedaan Qty Surat Jalan dan Qty Aktual?',
    answer:
      'Qty Surat Jalan adalah jumlah berdasarkan dokumen pengiriman, sedangkan Qty Aktual adalah jumlah yang benar-benar diterima berdasarkan pemeriksaan fisik. Apabila terdapat selisih, periksa kembali hasil penghitungan dan tindak lanjuti sesuai prosedur.',
  },
  {
    question: 'Apa yang perlu dilakukan jika transaksi gagal disimpan?',
    answer:
      'Periksa koneksi internet, kelengkapan kolom wajib, dan pesan kesalahan yang ditampilkan aplikasi. Jangan mengulang input secara terburu-buru sebelum memastikan apakah transaksi sebelumnya sudah tersimpan.',
  },
  {
    question: 'Mengapa foto tidak berhasil diunggah?',
    answer:
      'Periksa koneksi internet, format file, dan ukuran file. Gunakan foto JPG, PNG, atau WEBP yang dapat dibuka dengan baik. Pastikan proses unggah selesai sebelum meninggalkan halaman.',
  },
  {
    question: 'Mengapa saya tidak bisa mengedit atau menghapus data?',
    answer:
      'Fungsi pengelolaan data mengikuti hak akses akun. Hubungi pengelola sistem apabila diperlukan perubahan hak akses. Penghapusan transaksi yang sudah dibatalkan hanya dapat dilakukan oleh Master Data.',
  },
  {
    question: 'Apakah pembatalan Return sama dengan menghapus transaksi?',
    answer:
      'Tidak. Pembatalan mengubah status transaksi menjadi Dibatalkan, sedangkan penghapusan menghilangkan transaksi yang sudah dibatalkan dari sistem. Penghapusan memiliki pembatasan hak akses tersendiri.',
  },
  {
    question: 'Untuk apa menu Progres Administrasi?',
    answer:
      'Menu ini digunakan untuk memantau informasi administrasi Return, terutama nomor Claim, nomor NCR, dan Disposisi, agar perkembangan tindak lanjut dapat ditelusuri.',
  },
  {
    question: 'Apakah aplikasi menggantikan dokumen fisik dan proses SAP?',
    answer:
      'Tidak. Aplikasi berfungsi membantu pencatatan dan monitoring internal. Dokumen penerimaan, Surat Jalan, memo, dokumen Claim/NCR, dan proses administrasi lain tetap mengikuti prosedur perusahaan.',
  },
]

/* ============================================================
   USER ROLES
   ============================================================ */

const USER_ROLES = [
  {
    name: 'Master Data',
    description:
      'Memiliki kewenangan pengelolaan data Return serta pengelolaan pengguna sistem.',
    permissions: [
      'Membuat dan mengedit data Return.',
      'Mengelola pengguna sistem.',
      'Menghapus transaksi yang sudah dibatalkan.',
    ],
    icon: ShieldCheck,
  },
  {
    name: 'Admin',
    description:
      'Membantu pengelolaan dan pembaruan transaksi sesuai kewenangan akun.',
    permissions: [
      'Membuat data Return.',
      'Mengedit data Return.',
      'Menggunakan fungsi sesuai izin yang diberikan sistem.',
    ],
    icon: UserRound,
  },
  {
    name: 'Read Only',
    description:
      'Digunakan untuk melihat informasi dan memantau transaksi.',
    permissions: [
      'Melihat data Return.',
      'Melihat informasi monitoring.',
      'Tidak memiliki kewenangan membuat atau mengedit data.',
    ],
    icon: LockKeyhole,
  },
]

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {title}
      </h2>

      {description && (
        <p className="mt-1 max-w-3xl text-xs leading-6 text-muted-foreground sm:text-sm">
          {description}
        </p>
      )}
    </div>
  )
}

function QuickLinkCard({ item }: { item: QuickLink }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
          MENU {item.number}
        </p>

        <h3 className="mt-1 break-words text-sm font-semibold text-foreground">
          {item.title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {item.description}
        </p>
      </div>

      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  )
}

function WorkflowCard({
  item,
  isLast,
}: {
  item: (typeof WORKFLOW)[number]
  isLast: boolean
}) {
  const Icon = item.icon

  return (
    <div className="relative min-w-0">
      <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>

          <span className="text-xs font-bold tracking-widest text-primary">
            {item.number}
          </span>
        </div>

        <h3 className="mt-4 text-sm font-bold text-foreground">
          {item.title}
        </h3>

        <p className="mt-2 flex-1 text-xs leading-6 text-muted-foreground">
          {item.description}
        </p>
      </div>

      {!isLast && (
        <div className="pointer-events-none absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-primary/50 xl:block">
          <ArrowRight className="size-4" />
        </div>
      )}
    </div>
  )
}

function FieldRow({ field }: { field: FieldReference }) {
  const Icon = field.icon

  return (
    <div className="group grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-4 py-4 transition-colors hover:bg-muted/20 sm:px-5">
      <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {field.name}
          </span>

          {field.required && (
            <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
              WAJIB
            </span>
          )}

          {field.automatic && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
              OTOMATIS
            </span>
          )}
        </div>

        <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">
          {field.description}
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   HELP PAGE
   ============================================================ */

export default function HelpPage() {
  const headerFields = FIELDS.filter(
    (field) => field.category === 'header',
  )

  const itemFields = FIELDS.filter(
    (field) => field.category === 'item',
  )

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-8 pb-10">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.09] via-transparent to-transparent" />

        <div className="absolute -right-20 -top-28 -z-10 size-80 rounded-full bg-primary/[0.08] blur-3xl" />

        <div className="absolute right-8 top-8 hidden size-28 items-center justify-center rounded-[2rem] border border-primary/10 bg-background/50 text-primary/15 backdrop-blur-sm md:flex">
          <Headphones className="size-16" />
        </div>

        <div className="relative grid gap-7 p-5 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="size-3.5" />
              User Guide · SPINDO 5
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[42px] lg:leading-[1.15]">
              Pusat Bantuan
              <span className="mt-1 block text-primary">
                Customer Return Receiving
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Panduan penggunaan aplikasi untuk membantu proses
              pencatatan penerimaan material Return, pemantauan
              progres administrasi, dan penelusuran riwayat transaksi.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-xs font-medium">
                <BookOpen className="size-4 text-primary" />
                {GUIDES.length} panduan
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-xs font-medium">
                <FileText className="size-4 text-primary" />
                {FIELDS.length} referensi data
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-xs font-medium">
                <CircleHelp className="size-4 text-primary" />
                {FAQS.length} pertanyaan umum
              </div>
            </div>
          </div>

          <div className="hidden w-52 flex-col gap-3 rounded-2xl border border-border bg-background/75 p-4 shadow-sm backdrop-blur-sm lg:flex">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground">
                  User Guide
                </p>

                <p className="text-[10px] text-muted-foreground">
                  Internal Application
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            <p className="text-xs leading-5 text-muted-foreground">
              Gunakan panduan ini sebagai referensi pencatatan
              dan monitoring operasional Return.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK ACCESS
      ===================================================== */}

      <section className="space-y-3">
        <SectionHeading
          eyebrow="Quick Access"
          title="Akses Menu Utama"
          description="Pilih menu sesuai aktivitas yang ingin dilakukan."
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_LINKS.map((item) => (
            <QuickLinkCard
              key={item.href}
              item={item}
            />
          ))}
        </div>
      </section>

      {/* =====================================================
          WORKFLOW
      ===================================================== */}

      <section className="space-y-3">
        <SectionHeading
          eyebrow="Operational Flow"
          title="Alur Monitoring Return"
          description="Gambaran umum tahapan pencatatan dan pemantauan material Return melalui aplikasi."
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {WORKFLOW.map((item, index) => (
            <WorkflowCard
              key={item.number}
              item={item}
              isLast={index === WORKFLOW.length - 1}
            />
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-3">
          <Database className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />

          <p className="text-xs leading-6 text-muted-foreground">
            Aplikasi digunakan untuk membantu pencatatan dan monitoring
            internal. Dokumen fisik, proses administrasi Claim/NCR,
            Disposisi, serta proses GR dan SAP tetap mengikuti prosedur
            perusahaan yang berlaku.
          </p>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* USER GUIDES */}

          <Card className="overflow-hidden rounded-2xl border border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">
                    Panduan Penggunaan Aplikasi
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs leading-5">
                    Petunjuk langkah demi langkah untuk menjalankan
                    proses Return Receiving.
                  </CardDescription>
                </div>

                <span className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold tabular-nums">
                  {GUIDES.length} topik
                </span>
              </div>
            </CardHeader>

            <CardContent className="px-5 py-2 sm:px-6">
              <Accordion
                defaultValue={[GUIDES[1].title]}
                className="w-full"
              >
                {GUIDES.map((guide, index) => {
                  const Icon = guide.icon

                  return (
                    <AccordionItem
                      key={guide.title}
                      value={guide.title}
                      className="border-b border-border last:border-b-0"
                    >
                      <AccordionTrigger className="gap-3 py-5 text-left hover:no-underline">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
                            <Icon className="size-[18px]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                              Panduan {String(index + 1).padStart(2, '0')}
                            </p>

                            <p className="mt-1 text-sm font-semibold leading-5 text-foreground">
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
                                key={`${guide.title}-${stepIndex}`}
                                className="relative flex gap-3"
                              >
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[10px] font-bold text-primary">
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

          <Card className="overflow-hidden rounded-2xl border border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardCheck className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">
                    Referensi Data Return
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs leading-5">
                    Penjelasan fungsi setiap kolom dalam pencatatan
                    Header dan detail material.
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-rose-500" />
                  Wajib diisi
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Otomatis sistem
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="border-b border-border bg-muted/10 px-4 py-3 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  A. Informasi Return / Header
                </p>
              </div>

              <div className="divide-y divide-border">
                {headerFields.map((field) => (
                  <FieldRow
                    key={field.name}
                    field={field}
                  />
                ))}
              </div>

              <div className="border-y border-border bg-muted/10 px-4 py-3 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  B. Detail Material / Items
                </p>
              </div>

              <div className="divide-y divide-border">
                {itemFields.map((field) => (
                  <FieldRow
                    key={field.name}
                    field={field}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ACCESS RIGHTS */}

          <section className="space-y-3">
            <SectionHeading
              eyebrow="Access Control"
              title="Hak Akses Pengguna"
              description="Setiap akun memiliki kewenangan sesuai role yang diberikan."
            />

            <div className="grid gap-3 md:grid-cols-3">
              {USER_ROLES.map((role) => {
                const Icon = role.icon

                return (
                  <Card
                    key={role.name}
                    className="rounded-2xl border border-border shadow-sm"
                  >
                    <CardHeader className="px-4 pb-3 pt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-5" />
                        </div>

                        <CardTitle className="text-sm">
                          {role.name}
                        </CardTitle>
                      </div>

                      <CardDescription className="pt-2 text-xs leading-5">
                        {role.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="px-4 pb-4">
                      <ul className="space-y-2">
                        {role.permissions.map((permission) => (
                          <li
                            key={permission}
                            className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
                          >
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>{permission}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

              <p className="text-xs leading-6 text-muted-foreground">
                Apabila suatu tombol tidak tersedia, kemungkinan akun
                tidak memiliki hak akses untuk fungsi tersebut.
                Hubungi Master Data atau pengelola aplikasi untuk
                pemeriksaan akses.
              </p>
            </div>
          </section>

          {/* FAQ */}

          <Card className="overflow-hidden rounded-2xl border border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CircleHelp className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">
                    Pertanyaan Umum (FAQ)
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs leading-5">
                    Jawaban untuk kendala yang sering ditemui
                    saat menggunakan aplikasi.
                  </CardDescription>
                </div>

                <span className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold tabular-nums">
                  {FAQS.length} FAQ
                </span>
              </div>
            </CardHeader>

            <CardContent className="px-5 py-2 sm:px-6">
              <Accordion className="w-full">
                {FAQS.map((faq, index) => (
                  <AccordionItem
                    key={faq.question}
                    value={`faq-${index}`}
                    className="border-b border-border last:border-b-0"
                  >
                    <AccordionTrigger className="py-4 text-left text-sm font-semibold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>

                    <AccordionContent>
                      <p className="pb-2 text-sm leading-7 text-muted-foreground">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* =================================================
            RIGHT SIDEBAR
        ================================================= */}

        <aside className="space-y-5 xl:sticky xl:top-6">
          {/* CONTACT */}

          <Card className="overflow-hidden rounded-2xl border border-border shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/20" />

            <CardHeader className="px-5 pb-3 pt-5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Headphones className="size-6" />
              </div>

              <CardTitle className="pt-2 text-base">
                Butuh Bantuan?
              </CardTitle>

              <CardDescription className="text-xs leading-5">
                Hubungi Kepala Regu Repair & Return atau pengelola
                sistem apabila mengalami kendala akses maupun data.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 px-5 pb-5">
              <a
                href="mailto:danikurnia244222011@gmail.com"
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="size-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">
                    Email Admin
                  </p>

                  <p className="mt-0.5 break-all text-xs font-semibold text-foreground">
                    danikurnia244222011@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="tel:+628388436725"
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Phone className="size-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">
                    Telepon
                  </p>

                  <p className="mt-0.5 text-xs font-semibold text-foreground">
                    (+62) 8388-4367-25
                  </p>
                </div>
              </a>

              <div className="flex gap-3 rounded-xl bg-muted/40 p-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Jam Operasional
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Senin-Rabu
                    <br />
                    09.00-15.00 WIB
                  </p>
                </div>
              </div>

              <p className="text-[10px] leading-5 text-muted-foreground">
                Saat melapor, sertakan No Return, waktu kejadian,
                uraian kendala, dan screenshot apabila diperlukan.
              </p>
            </CardContent>
          </Card>

          {/* BEST PRACTICES */}

          <Card className="rounded-2xl border border-border shadow-sm">
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
                  'Pastikan Qty Aktual sesuai hasil pemeriksaan fisik.',
                  'Gunakan foto yang jelas sebagai bukti pendukung.',
                  'Periksa kembali Header dan detail item sebelum konfirmasi.',
                  'Perbarui informasi administrasi berdasarkan dokumen yang sudah dikonfirmasi.',
                  'Jangan membagikan akun atau kata sandi kepada pengguna lain.',
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

          {/* IMPORTANT NOTES */}

          <Card className="rounded-2xl border border-border shadow-sm">
            <CardHeader className="px-4 pb-2 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <AlertCircle className="size-5" />
                </div>

                <CardTitle className="text-sm">
                  Catatan Penting
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4">
              <p className="text-xs leading-6 text-muted-foreground">
                Pastikan transaksi yang dicatat sesuai dokumen
                penerimaan dan hasil pemeriksaan aktual. Apabila
                terdapat selisih, perbedaan dokumen, atau kendala
                administrasi, lakukan koordinasi dengan pihak terkait
                sebelum memperbarui informasi.
              </p>
            </CardContent>
          </Card>

          {/* SECURITY */}

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />

              <div>
                <p className="text-xs font-semibold text-foreground">
                  Keamanan Data
                </p>

                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  Gunakan akun sesuai hak akses. Jangan membagikan
                  kata sandi, informasi rahasia, atau data transaksi
                  kepada pihak yang tidak berkepentingan.
                </p>
              </div>
            </div>
          </div>

          {/* FOOTNOTE */}

          <div className="flex items-center justify-between gap-2 px-1 text-[10px] text-muted-foreground">
            <span>SPINDO 5 · Internal System</span>

            <span className="inline-flex items-center gap-1">
              <Activity className="size-3" />
              Return Receiving
            </span>
          </div>
        </aside>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="flex flex-col gap-2 border-t border-border pt-4 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          SPINDO 5 · Customer Return Receiving
        </p>

        <p className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" />
          Internal Application · User Guide
        </p>
      </footer>
    </main>
  )
}