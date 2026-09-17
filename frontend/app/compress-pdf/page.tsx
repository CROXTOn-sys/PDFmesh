import type { Metadata } from 'next'
import { ToolPage } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/compress-pdf'

export const metadata: Metadata = {
  title: 'Compress PDF — Reduce PDF File Size Online Free',
  description:
    'Compress PDF online for free. Reduce PDF file size while keeping great quality, so your documents are easy to email and upload — fast and secure with PDFmesh.',
  keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'pdf compressor', 'pdf converter'],
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'Compress PDF — Free Online PDF Compressor',
    description: 'Reduce PDF file size while keeping quality, online and free.',
  },
}

export default function Page() { return <ToolPage toolKey="compress-pdf" /> }
