import type { Metadata } from 'next'
import { ToolPage } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/word-to-pdf'

export const metadata: Metadata = {
  title: 'Word to PDF — Convert Word Documents to PDF Free',
  description:
    'Convert Word to PDF online for free. Turn DOC and DOCX files into polished, shareable PDFs that look the same on every device — fast and secure with PDFmesh.',
  keywords: ['word to pdf', 'convert word to pdf', 'docx to pdf', 'pdf converter'],
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'Word to PDF — Free Online Converter',
    description: 'Convert Word (DOC/DOCX) documents to PDF online, free and secure.',
  },
}

export default function Page() { return <ToolPage toolKey="word-to-pdf" /> }
