import type { Metadata } from 'next'
import { ToolPage } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/split-pdf'

export const metadata: Metadata = {
  title: 'Split PDF — Extract & Separate PDF Pages Online Free',
  description:
    'Split PDF online for free. Extract pages or divide a PDF into separate files in seconds — a fast, secure PDF splitter from PDFmesh, no sign-up required.',
  keywords: ['split pdf', 'separate pdf', 'extract pdf pages', 'pdf splitter', 'pdf converter'],
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'Split PDF — Free Online PDF Splitter',
    description: 'Extract pages or divide a PDF into separate files online, free and secure.',
  },
}

export default function Page() { return <ToolPage toolKey="split-pdf" /> }
