import type { Metadata } from 'next'
import { Navbar, Footer } from '@/components/docflow/docflow'

const URL = 'https://pdfmesh.vercel.app/contact'

export const metadata: Metadata = {
  title: 'Contact Us — PDFmesh',
  description:
    'Contact the PDFmesh team with questions, feedback, or support requests about our free online PDF tools such as PDF to Word, merge PDF, and compress PDF.',
  alternates: { canonical: URL },
  openGraph: {
    url: URL,
    title: 'Contact PDFmesh',
    description: 'Get in touch with the PDFmesh team for support and feedback.',
  },
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="content-page">
        <div className="container content-page-inner">
          <span className="eyebrow">We would love to hear from you</span>
          <h1>Contact Us</h1>
          <p className="content-lead">
            Have a question, found a bug, or want to suggest a feature? Reach out and the PDFmesh
            team will get back to you. We usually respond within 2–3 business days.
          </p>

          <h2>Email</h2>
          <p>
            For support, feedback, or general questions, email us at{' '}
            <a href="mailto:support@pdfmesh.app">support@pdfmesh.app</a>.
          </p>

          <h2>Feedback &amp; feature requests</h2>
          <p>
            PDFmesh is always improving. If there is a tool or option you would like to see —
            such as new file formats or editing features — let us know and we will consider it for a
            future update.
          </p>

          <h2>Report a problem</h2>
          <p>
            If a conversion did not work as expected, email us with the tool you used and a short
            description of the issue. Please do not send sensitive documents; a description of the
            problem is enough for us to help.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
