import type { Metadata } from 'next'
import { ToolPage } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/jpg-to-pdf'

export const metadata: Metadata = {
  title: 'JPG to PDF — Convert Images to PDF Online Free',
  description:
    'Convert JPG to PDF online for free. Combine JPG, PNG, and other images into a single professional PDF in seconds — fast, secure, and no sign-up with PDFmesh.',
  keywords: ['jpg to pdf', 'image to pdf', 'png to pdf', 'photo to pdf', 'convert jpg to pdf'],
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'JPG to PDF — Free Online Image to PDF Converter',
    description: 'Combine JPG and PNG images into one PDF online, free and secure.',
  },
}

export default function Page() { return <ToolPage toolKey="jpg-to-pdf" /> }
