// Single source of truth for the FAQ content. Kept in a plain (non-client)
// module so it can be safely imported by both the client accordion component
// and the Server Component that emits FAQPage JSON-LD structured data.
export type FaqItem = { q: string; a: string }

export const FAQ_ITEMS: FaqItem[] = [
  { q: 'How do I convert a PDF to Word for free?', a: 'Open the PDF to Word tool on PDFmesh, upload your PDF file, and download the converted, editable Word document. It is completely free and needs no sign-up.' },
  { q: 'How to convert PDF to Word?', a: 'Go to the PDF to Word tool, add your PDF, and PDFmesh converts it into an editable DOCX document that keeps your text and layout as closely as possible. Then simply download the result.' },
  { q: 'Is PDF a MS Word format?', a: 'No. PDF (Portable Document Format) is a fixed-layout format made for consistent viewing, while MS Word (DOC/DOCX) is an editable document format. To edit a PDF like a Word file, convert it to Word first.' },
  { q: 'Can AI convert PDF to Word?', a: 'Yes. Modern converters, including AI-assisted tools, can turn a PDF into an editable Word document by recognising text, headings, and layout. PDFmesh converts PDF to Word online for free.' },
  { q: 'How to convert PDF to Word for free offline?', a: 'To convert offline, use desktop software such as LibreOffice or Microsoft Word, which can open a PDF and save it as a DOCX. If you are online, PDFmesh does the same conversion instantly in your browser for free.' },
  { q: 'Can I convert a PDF to Word without paying?', a: 'Yes. PDFmesh lets you convert PDF to Word completely free, with no subscription, no watermark, and no account required.' },
  { q: 'What is the best free software to convert PDFs to Word?', a: 'Popular free options include PDFmesh (online, no install), LibreOffice, and Google Docs. PDFmesh is ideal when you want a fast, browser-based conversion with no software to download.' },
  { q: 'What is a PDF?', a: 'A PDF (Portable Document Format) is a file format that preserves the exact layout, fonts, and images of a document so it looks the same on any device. It is widely used for sharing forms, resumes, and reports.' },
  { q: 'What does PDF stand for?', a: 'PDF stands for Portable Document Format, a file format created by Adobe for sharing documents that look identical across devices and platforms.' },
  { q: 'How to edit a PDF?', a: 'You can edit a PDF by converting it to an editable format such as Word, making your changes, and converting it back. On PDFmesh, use PDF to Word to edit the text, then Word to PDF to save it back as a PDF.' },
  { q: 'How to split PDF files?', a: 'Use the Split PDF tool on PDFmesh. Upload your PDF and it separates the document into individual pages that you can download, packaged together for convenience.' },
  { q: 'How to combine PDF files?', a: 'Use the Merge PDF tool. Add all the PDF files you want to join, drag them into the order you want, and download a single combined PDF document.' },
  { q: 'How to merge PDF files?', a: 'Open the Merge PDF tool, upload two or more PDFs, arrange them, and click Merge. PDFmesh combines them into one PDF that you can download immediately.' },
  { q: 'How to compress a PDF?', a: 'Use the Compress PDF tool. Upload your PDF, choose a compression level, and PDFmesh reduces the file size while keeping the pages readable, so it is easier to email and upload.' },
  { q: 'How to reduce PDF file size?', a: 'The Compress PDF tool reduces file size by optimising the images and content inside the PDF. Pick the balance between quality and size that suits you, then download the smaller file.' },
  { q: 'How to convert PDF to JPG?', a: 'Use the PDF to JPG tool. Upload your PDF and PDFmesh renders each page into a high-quality JPG image, ready to download and share.' },
  { q: 'How to convert JPG to PDF?', a: 'Use the JPG to PDF tool. Select your JPG, PNG, or other images, and PDFmesh combines them into a single professional PDF, one image per page.' },
  { q: 'How to convert Word to PDF?', a: 'Use the Word to PDF tool. Upload a DOC or DOCX file and PDFmesh converts it into a polished PDF that looks the same on every device.' },
  { q: 'How to make a PDF?', a: 'You can make a PDF by converting existing files. On PDFmesh, use Word to PDF for documents or JPG to PDF for images to create a new PDF you can download and share.' },
  { q: 'How to type on a PDF?', a: 'To add or change text on a PDF, convert it to Word using the PDF to Word tool, type your changes in the editable document, then convert it back with Word to PDF.' },
  { q: 'How to sign a PDF?', a: 'To sign a PDF, you typically add a signature image or use a dedicated e-sign tool. With PDFmesh you can convert JPG to PDF to include a scanned signature, or edit via PDF to Word and back.' },
  { q: 'How to remove a password from a PDF?', a: 'To remove a password you must first know it and open the PDF, then re-save it without protection using PDF software. For security, PDFmesh does not bypass passwords on protected files.' },
  { q: 'How to password protect a PDF?', a: 'Password protection is added with PDF software or a secure PDF tool that encrypts the file. Keep the password safe, as an encrypted PDF cannot be opened or converted without it.' },
  { q: 'How to make a PDF fillable?', a: 'A fillable PDF contains interactive form fields, which are added using PDF form software. You can prepare the content in Word and export it, then add form fields in a dedicated PDF editor.' },
  { q: 'How to edit a PDF on Mac?', a: 'On a Mac you can edit a PDF using Preview for basic annotations, or convert it to Word with PDFmesh, edit the text, and convert it back to PDF. PDFmesh works in any browser on macOS.' },
]
