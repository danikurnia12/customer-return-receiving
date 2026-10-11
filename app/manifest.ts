
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Customer Return',
    short_name: 'Customer Return',
    description:
      'Aplikasi internal untuk penerimaan dan inspeksi material retur PT Steel Pipe Indonesia.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f5f7fa',
    theme_color: '#f5f7fa',
    lang: 'id',
    icons: [
      {
        src: '/logo-2-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-2-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
