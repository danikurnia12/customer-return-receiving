import type { Metadata } from 'next'
import { Mail, Phone } from 'lucide-react'
import { PageHeader } from '@/components/app/states'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Bantuan' }

const GUIDES = [
  {
    title: 'Cara membuat penerimaan Return',
    steps: [
      'Buka menu Return Items, klik tombol "Penerimaan Baru".',
      'Isi bagian A. Informasi Return: Tanggal Penerimaan, No SPPB / Surat Jalan, dan Customer wajib diisi.',
      'Tambahkan minimal 1 item material pada bagian B.',
      'Klik "Simpan Penerimaan Return", periksa ringkasan, lalu klik "Ya, Simpan".',
      'Sistem membuat No Return otomatis dengan format RET-YYYYMMDD-XXX.',
    ],
  },
  {
    title: 'Cara menambahkan beberapa item dalam satu Return',
    steps: [
      'Pada bagian B. Material Items, klik "+ Tambah Item".',
      'Isi dimensi, qty, kondisi, lokasi, dan upload foto bila ada, lalu klik "Simpan Item".',
      'Ulangi untuk setiap material. Semua item akan berada di Return Header yang sama.',
      'Gunakan ikon pensil untuk mengedit dan ikon tempat sampah untuk menghapus item sebelum disimpan.',
    ],
  },
  {
    title: 'Cara mencari Return',
    steps: [
      'Buka menu Return Items.',
      'Ketik No Return, No Surat Jalan, No Claim, atau nama Customer di kolom Pencarian.',
      'Gunakan filter Periode Tanggal, Customer, dan Status, lalu klik "Terapkan".',
      'Klik No Return untuk membuka detail.',
    ],
  },
  {
    title: 'Cara melihat History',
    steps: [
      'Buka menu Return History untuk melihat seluruh aktivitas.',
      'Setiap perubahan mencatat waktu, user, aktivitas, data sebelum dan sesudah, serta catatan.',
      'History per return juga tampil di bagian bawah halaman detail return.',
      'History bersifat permanen dan tidak hilang walaupun data return diedit.',
    ],
  },
]

const FIELDS = [
  ['No Return', 'Nomor unik otomatis dari sistem, format RET-YYYYMMDD-XXX.'],
  ['Tanggal Penerimaan', 'Tanggal material retur diterima di gudang. Wajib.'],
  ['No SPPB / Surat Jalan', 'Nomor dokumen pengiriman dari customer. Wajib.'],
  ['No Claim', 'Nomor klaim customer terkait material abnormal (opsional).'],
  ['Customer', 'Nama customer yang mengembalikan material. Wajib.'],
  ['PIC Penerima', 'Nama petugas gudang yang menerima material.'],
  ['Diameter', 'Diameter material, contoh: 2", 1-1/2", atau 60.5mm.'],
  ['Tebal / Panjang', 'Dalam satuan mm, harus angka lebih dari 0.'],
  ['Batch / No Box', 'Identitas batch produksi dan nomor box/kemasan.'],
  ['Qty Surat Jalan', 'Jumlah sesuai dokumen surat jalan. Tidak boleh negatif.'],
  ['Qty Aktual Diterima', 'Jumlah fisik yang diterima. Bila berbeda dari Qty SJ, muncul indikator Selisih.'],
  ['Kondisi Material', 'Jenis abnormalitas: Dent, Scratch, Rust, Bending, dan lain-lain.'],
  ['Lokasi / SLOC', 'Lokasi penyimpanan di gudang, contoh GD01.'],
  ['Foto Material / Surat Jalan', 'Foto bukti (JPG/PNG/WEBP, maks 5 MB), disimpan di Supabase Storage.'],
]

export default function HelpPage() {
  return (
    <>
      <PageHeader title="Bantuan" description="Panduan singkat penggunaan aplikasi Customer Return Receiving." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Panduan Penggunaan</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion defaultValue={[GUIDES[0].title]}>
                {GUIDES.map((g) => (
                  <AccordionItem key={g.title} value={g.title}>
                    <AccordionTrigger>{g.title}</AccordionTrigger>
                    <AccordionContent>
                      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
                        {g.steps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Penjelasan Field</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col divide-y">
                {FIELDS.map(([name, desc]) => (
                  <div key={name} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium">{name}</dt>
                    <dd className="text-sm text-muted-foreground sm:col-span-2">{desc}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Kontak Admin</CardTitle>
            <CardDescription>Hubungi admin gudang bila mengalami kendala akses atau data.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <a href="mailto:admin.warehouse@perusahaan.co.id" className="flex items-center gap-2 text-primary hover:underline">
              <Mail className="size-4" />
              admin.warehouse@perusahaan.co.id
            </a>
            <a href="tel:+622100000000" className="flex items-center gap-2 text-primary hover:underline">
              <Phone className="size-4" />
              (021) 0000-0000
            </a>
            <p className="text-muted-foreground">Jam operasional: Senin - Sabtu, 07.00 - 17.00 WIB</p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
