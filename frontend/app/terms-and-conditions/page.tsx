import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar, Footer } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/terms-and-conditions'

export const metadata: Metadata = {
  title: 'Terms & Conditions — PDFmesh',
  description:
    'Read the PDFmesh Terms & Conditions covering acceptable use of our free online PDF tools, disclaimers, intellectual property, and limitations of liability.',
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'Terms & Conditions — PDFmesh',
    description: 'The terms that govern your use of PDFmesh.',
  },
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="content-page">
        <div className="container content-page-inner">
          <span className="eyebrow">The rules of the road</span>
          <h1>Terms &amp; Conditions</h1>
          <p className="content-meta">Last updated: September 2026</p>
          <p className="content-lead">
            These Terms &amp; Conditions govern your use of the PDFmesh website and its online PDF
            tools. By using PDFmesh, you agree to these terms. If you do not agree, please do not use
            the service.
          </p>

          <h2>Use of the service</h2>
          <p>
            PDFmesh provides free online tools to convert, merge, split, compress, and transform PDF
            and image files. You may use the service for lawful personal and business purposes. You
            agree not to upload content that is illegal, infringing, malicious, or that you do not
            have the right to process.
          </p>

          <h2>No account, no warranty</h2>
          <p>
            The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, whether express or implied. While we work to keep conversions
            accurate, we do not guarantee that every output will perfectly preserve formatting,
            layout, or content, particularly for complex documents.
          </p>

          <h2>Your files and responsibility</h2>
          <p>
            You are responsible for the files you upload and for keeping your own backups. Uploaded
            files are processed to complete your request and are removed automatically afterward, as
            described in our <Link href="/privacy-policy">Privacy Policy</Link>. Do not rely on
            PDFmesh as a storage service.
          </p>

          <h2>Acceptable use</h2>
          <p>
            You agree not to misuse the service, including attempting to disrupt it, overload it,
            bypass limits, reverse engineer it, or use it to process malware or unlawful material. We
            may limit or suspend access to protect the service and its users.
          </p>

          <h2>Intellectual property</h2>
          <p>
            The PDFmesh name, branding, website design, and software are the property of PDFmesh. You
            retain all rights to the files you upload; we claim no ownership over your content.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, PDFmesh is not liable for any indirect,
            incidental, or consequential damages, or for any loss of data arising from your use of the
            service.
          </p>

          <h2>Changes to these terms</h2>
          <p>
            We may update these Terms &amp; Conditions from time to time. Continued use of PDFmesh
            after changes are posted constitutes acceptance of the updated terms.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms? Reach us via the{' '}
            <Link href="/contact">Contact Us</Link> page or at{' '}
            <a href="mailto:support@pdfmesh.app">support@pdfmesh.app</a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
