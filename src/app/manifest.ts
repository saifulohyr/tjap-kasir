import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tjap Chacoh — Kasir',
    short_name: 'Tjap Kasir',
    description: 'Sistem kasir heritage untuk kedai kopi modern-tradisional. Sejak Kemarin Sore.',
    start_url: '/pos',
    display: 'standalone',
    orientation: 'any',
    background_color: '#FDF5E6',
    theme_color: '#8B0000',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
