import type { MetadataRoute } from 'next'

const SITE_URL = 'https://pdfmesh.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = [
    { path: '', priority: 1.0 },
    { path: 'pdf-to-word', priority: 0.9 },
    { path: 'word-to-pdf', priority: 0.8 },
    { path: 'merge-pdf', priority: 0.9 },
    { path: 'split-pdf', priority: 0.7 },
    { path: 'compress-pdf', priority: 0.8 },
    { path: 'jpg-to-pdf', priority: 0.8 },
    { path: 'pdf-to-jpg', priority: 0.8 },
    { path: 'about', priority: 0.5 },
    { path: 'contact', priority: 0.5 },
    { path: 'privacy-policy', priority: 0.4 },
    { path: 'terms-and-conditions', priority: 0.4 },
  ]
  return routes.map((r) => ({
    url: r.path ? `${SITE_URL}/${r.path}` : SITE_URL,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: r.priority,
  }))
}
