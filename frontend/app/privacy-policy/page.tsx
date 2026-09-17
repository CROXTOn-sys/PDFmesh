import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar, Footer } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/privacy-policy'

export const metadata: Metadata = {
  title: 'Privacy Policy — PDFmesh',
  description:
    'Read the PDFmesh Privacy Policy to learn how we handle your files and data when you use our free online PDF tools, including how uploads are processed and deleted.',
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'Privacy Policy — PDFmesh',
    description: 'How PDFmesh handles your files and data.',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="content-page">
        <div className="container content-page-inner">
          <span className="eyebrow">Your privacy matters</span>
          <h1>Privacy Policy</h1>
          <p className="content-meta">Last updated: September 2026</p>
          <p className="content-lead">
            This Privacy Policy explains how PDFmesh (&ldquo;we&rdquo;, &ldquo;us&rdquo;) handles
            information when you use our website and online PDF tools. By using PDFmesh, you agree to
            the practices described below.
          </p>

          <h2>Files you upload</h2>
          <p>
            When you use a tool such as PDF to Word, Merge PDF, or Compress PDF, your file is
            uploaded to our processing service only to perform the conversion you requested. Uploaded
            files and their generated outputs are stored temporarily and are automatically removed
            from the server after processing. We do not use your file contents for any purpose other
            than completing your requested task, and we do not sell or share your documents.
          </p>

          <h2>Information we collect</h2>
          <p>
            We aim to collect as little as possible. We do not require an account to use PDFmesh. We
            may collect basic, non-identifying analytics — such as which tools are used and general
            usage statistics — to help us improve the service. We may also process standard technical
            data (like your browser type and IP address) that is part of any normal web request.
          </p>

          <h2>Cookies and analytics</h2>
          <p>
            We may use privacy-friendly analytics to understand how the site is used. These tools may
            set cookies or use similar technologies to measure aggregate traffic. You can control
            cookies through your browser settings.
          </p>

          <h2>Data security</h2>
          <p>
            We use reasonable technical measures to protect files during transfer and processing.
            However, no method of transmission or storage is completely secure, so we encourage you to
            avoid uploading highly sensitive documents where possible.
          </p>

          <h2>Third-party services</h2>
          <p>
            PDFmesh runs on hosting and infrastructure providers that process requests on our behalf.
            These providers are bound by their own privacy and security terms. We do not share your
            documents with third parties for marketing.
          </p>

          <h2>Children&rsquo;s privacy</h2>
          <p>
            PDFmesh is not directed at children under 13, and we do not knowingly collect personal
            information from them.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be posted on this
            page with an updated date above.
          </p>

          <h2>Contact</h2>
          <p>
            If you have questions about this policy, please visit our{' '}
            <Link href="/contact">Contact Us</Link> page or email{' '}
            <a href="mailto:support@pdfmesh.app">support@pdfmesh.app</a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
