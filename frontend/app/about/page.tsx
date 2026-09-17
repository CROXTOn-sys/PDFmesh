import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar, Footer } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/about'

export const metadata: Metadata = {
  title: 'About Us — PDFmesh',
  description:
    'Learn about PDFmesh, a free online PDF toolkit that helps you convert PDF to Word, merge, compress, and convert PDF and image files quickly and securely.',
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'About PDFmesh',
    description: 'A free, fast, and secure online PDF toolkit for everyday document work.',
  },
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="content-page">
        <div className="container content-page-inner">
          <span className="eyebrow">About PDFmesh</span>
          <h1>About Us</h1>
          <p className="content-lead">
            PDFmesh is a free online toolkit that makes everyday document tasks simple. From
            converting PDF to Word to merging, compressing, and converting files between PDF and
            images, our goal is to help you finish document work quickly — with no sign-up, no
            watermarks, and no software to install.
          </p>

          <h2>Our mission</h2>
          <p>
            We believe the tools people use most should be fast, private, and free. PDFmesh brings
            the most common PDF tasks into one clean, reliable place so you can spend less time
            wrestling with files and more time on the work that matters.
          </p>

          <h2>What we offer</h2>
          <p>
            PDFmesh includes a growing set of focused tools: PDF to Word, Word to PDF, Merge PDF,
            Split PDF, Compress PDF, JPG to PDF, and PDF to JPG. Every tool runs in your browser and
            connects to a secure processing service, so it works on Windows, Mac, Android, and iPhone
            without any download.
          </p>

          <h2>Privacy first</h2>
          <p>
            Your files are yours. We process documents securely and do not share them, so you can use
            PDFmesh with confidence for resumes, contracts, and other personal files. Read more in our{' '}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>

          <h2>Get in touch</h2>
          <p>
            Have a question, suggestion, or issue? We would love to hear from you — visit our{' '}
            <Link href="/contact">Contact Us</Link> page and we will get back to you.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
