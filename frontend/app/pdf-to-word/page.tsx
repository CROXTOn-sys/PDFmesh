import type { Metadata } from 'next'
import { ToolPage } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/pdf-to-word'

export const metadata: Metadata = {
  title: 'PDF to Word — Convert PDF to Word Online Free',
  description:
    'Convert PDF to Word online for free. Turn your PDF into an editable Word document (DOCX) while keeping the layout — fast, secure, and no sign-up with PDFmesh.',
  keywords: ['pdf to word', 'convert pdf to word', 'pdf to docx', 'pdf converter', 'free pdf editor'],
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'PDF to Word — Free Online Converter',
    description: 'Convert PDF to an editable Word document (DOCX) online, free and secure.',
  },
}

export default function Page() { return <ToolPage toolKey="pdf-to-word" /> }
