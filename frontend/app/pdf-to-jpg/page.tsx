import type { Metadata } from 'next'
import { ToolPage } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/pdf-to-jpg'

export const metadata: Metadata = {
  title: 'PDF to JPG — Convert PDF to Images Online Free',
  description:
    'Convert PDF to JPG online for free. Turn every page of your PDF into a high-quality JPG image, ready to share or download — fast and secure with PDFmesh.',
  keywords: ['pdf to jpg', 'pdf to image', 'pdf to png', 'convert pdf to jpg', 'pdf converter'],
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'PDF to JPG — Free Online PDF to Image Converter',
    description: 'Convert PDF pages into high-quality JPG images online, free and secure.',
  },
}

export default function Page() { return <ToolPage toolKey="pdf-to-jpg" /> }
