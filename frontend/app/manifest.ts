import type { MetadataRoute } from 'next'

// Web App Manifest — controls how the site looks when installed to a home
// screen or desktop (PWA). Name shows under the icon; icons are the app icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PDFmesh',
    short_name: 'PDFmesh',
    description:
      'Free online PDF tools — convert PDF to Word, merge, compress, JPG to PDF and more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0b1220',
    icons: [
      { src: '/logo.png', sizes: '337x322', type: 'image/png' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
