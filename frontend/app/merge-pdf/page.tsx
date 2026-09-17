import type { Metadata } from 'next'
import { ToolPage } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/merge-pdf'

export const metadata: Metadata = {
  title: 'Merge PDF — Combine PDF Files Online Free',
  description:
    'Merge PDF files online for free. Combine multiple PDFs into one document, reorder pages, and download — a fast, secure PDF merger and combiner from PDFmesh.',
  keywords: ['merge pdf', 'combine pdf', 'pdf merger', 'pdf combiner', 'join pdf'],
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'Merge PDF — Free Online PDF Merger & Combiner',
    description: 'Combine multiple PDF files into one document online, free and secure.',
  },
}

export default function Page() { return <ToolPage toolKey="merge-pdf" /> }
