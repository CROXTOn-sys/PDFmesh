'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, FileImage, FileText, Files, Gauge, GripVertical, Layers, Menu, ShieldCheck, Sparkles, Upload, X, Zap } from 'lucide-react'
import { useToast } from '@/components/toast/toast'
import { FAQ_ITEMS } from '@/lib/faq-data'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'

// Tools that are not yet ready for users. Their card is shown but marked
// "Coming soon" and is not clickable, and their tool page blocks uploads.
const COMING_SOON: Partial<Record<string, boolean>> = { 'pdf-to-word': true }

export type ToolKey = 'pdf-to-word' | 'word-to-pdf' | 'jpg-to-pdf' | 'pdf-to-jpg' | 'merge-pdf' | 'split-pdf' | 'compress-pdf'
type Category = 'Convert' | 'Organize' | 'Optimize'
export const tools: { key: ToolKey; title: string; description: string; category: Category; icon: typeof FileText; accent: string }[] = [
  { key: 'pdf-to-word', title: 'PDF to Word', description: 'Convert PDF files into editable Word documents.', category: 'Convert', icon: FileText, accent: '#19b7c9' },
  { key: 'word-to-pdf', title: 'Word to PDF', description: 'Turn Word documents into polished PDF files.', category: 'Convert', icon: FileText, accent: '#3568e8' },
  { key: 'jpg-to-pdf', title: 'JPG to PDF', description: 'Convert images into a single professional PDF.', category: 'Convert', icon: FileImage, accent: '#6d5dfc' },
  { key: 'pdf-to-jpg', title: 'PDF to JPG', description: 'Convert PDF pages into high-quality JPG images.', category: 'Convert', icon: FileImage, accent: '#e6a642' },
  { key: 'merge-pdf', title: 'Merge PDF', description: 'Combine multiple PDF files into one document.', category: 'Organize', icon: Layers, accent: '#34c6a3' },
  { key: 'split-pdf', title: 'Split PDF', description: 'Extract pages or divide a PDF into separate files.', category: 'Organize', icon: Files, accent: '#d36b9b' },
  { key: 'compress-pdf', title: 'Compress PDF', description: 'Reduce PDF file size while keeping great quality.', category: 'Optimize', icon: Gauge, accent: '#ef765f' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  return <header className="site-header"><div className="container nav-inner"><Link className="brand" href="/" aria-label="PDFmesh home"><img src="/pdfmesh-logo-transparent.png" alt="PDFmesh — Structured Document Solutions" className="brand-logo" width={155} height={52} /></Link><nav className={open ? 'nav-links nav-open' : 'nav-links'}><a href="/#tools" onClick={() => setOpen(false)}>PDF Tools</a><a href="/#features" onClick={() => setOpen(false)}>Features</a><a href="/#pricing" onClick={() => setOpen(false)}>Pricing</a><a href="/#faq" onClick={() => setOpen(false)}>FAQ</a><div className="nav-actions"><button className="button button-ghost">Sign In</button><button className="button button-primary">Get Started</button></div></nav><button aria-label="Toggle menu" className="menu-button" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div></header>
}

export function Footer() {
  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    { title: 'Tools', links: [
      { label: 'PDF to Word', href: '/pdf-to-word' },
      { label: 'Merge PDF', href: '/merge-pdf' },
      { label: 'Compress PDF', href: '/compress-pdf' },
      { label: 'JPG to PDF', href: '/jpg-to-pdf' },
    ] },
    { title: 'Company', links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
    ] },
    { title: 'Legal', links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-and-conditions' },
    ] },
  ]
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" href="/"><span className="brand-mark"><Sparkles size={16} /></span>PDFmesh</Link>
          <p className="footer-note">The simpler way to work with everyday documents.</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4>{col.title}</h4>
            {col.links.map((l) => <Link href={l.href} key={l.label}>{l.label}</Link>)}
          </div>
        ))}
      </div>
      <div className="container footer-bottom">
        <span>© 2026 PDFmesh. All rights reserved.</span>
        <span>Made for better workflows.</span>
      </div>
    </footer>
  )
}

function ToolSymbol({ toolKey, accent, size = 'card' }: { toolKey: ToolKey; accent: string; size?: 'card' | 'page' }) { const isMerge = toolKey === 'merge-pdf'; const isSplit = toolKey === 'split-pdf'; const isCompress = toolKey === 'compress-pdf'; const source = toolKey.includes('word') ? 'W' : toolKey.includes('jpg') ? 'JPG' : 'PDF'; const target = toolKey === 'pdf-to-word' ? 'W' : toolKey === 'word-to-pdf' ? 'PDF' : toolKey === 'pdf-to-jpg' || toolKey === 'jpg-to-pdf' ? 'JPG' : 'PDF'; const marker = isMerge ? 'merge' : isSplit ? 'split' : isCompress ? 'compress' : 'convert'; return <svg className={`tool-symbol tool-symbol-${size} tool-symbol-${marker}`} viewBox="0 0 52 52" style={{ '--symbol-accent': accent } as React.CSSProperties} aria-hidden="true"><defs><marker id={`arrow-${toolKey}-${size}`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 5 2.5 0 5Z" fill="currentColor" /></marker></defs>{isMerge ? <><rect x="5" y="7" width="20" height="20" rx="4" fill="currentColor" opacity=".38"/><rect x="27" y="25" width="20" height="20" rx="4" fill="currentColor" opacity=".92"/><path d="M17 21 30 34M35 21 22 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" markerEnd={`url(#arrow-${toolKey}-${size})`}/></> : isSplit ? <><rect x="16" y="16" width="20" height="20" rx="4" fill="currentColor" opacity=".92"/><path d="M25 25 11 11M27 27 41 41" stroke="currentColor" strokeWidth="3" strokeLinecap="round" markerEnd={`url(#arrow-${toolKey}-${size})`}/></> : isCompress ? <><rect x="16" y="16" width="20" height="20" rx="4" fill="currentColor" opacity=".9"/><path d="M7 7 16 16M45 7 36 16M7 45 16 36M45 45 36 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" markerEnd={`url(#arrow-${toolKey}-${size})`}/></> : <><rect x="4" y="7" width="21" height="21" rx="4" fill="currentColor" opacity=".32"/><text x="14.5" y="20" textAnchor="middle" fontSize={source.length > 2 ? 5.5 : 10} fontWeight="800" fill="currentColor">{source}</text><rect x="27" y="24" width="21" height="21" rx="4" fill="currentColor" opacity=".92"/><text x="37.5" y="38" textAnchor="middle" fontSize={target.length > 2 ? 5.5 : 10} fontWeight="800" fill="white">{target}</text><path d="M20 28 31 37" stroke="currentColor" strokeWidth="3" strokeLinecap="round" markerEnd={`url(#arrow-${toolKey}-${size})`}/></>}</svg> }
function ToolCard({ tool }: { tool: typeof tools[number] }) { const soon = !!COMING_SOON[tool.key]; if (soon) return <div className="tool-card tool-card-soon" aria-disabled="true" style={{ '--card-accent': tool.accent } as React.CSSProperties}><span className="soon-badge">Coming soon</span><div className="tool-icon"><ToolSymbol toolKey={tool.key} accent={tool.accent} /></div><div className="tool-card-copy"><h3>{tool.title}</h3><p>{tool.description}</p></div><span className="tool-link">Coming soon</span></div>; return <Link href={`/${tool.key}`} className="tool-card" style={{ '--card-accent': tool.accent } as React.CSSProperties}><div className="tool-icon"><ToolSymbol toolKey={tool.key} accent={tool.accent} /></div><div className="tool-card-copy"><h3>{tool.title}</h3><p>{tool.description}</p></div><span className="tool-link">Open tool <ArrowRight size={15} /></span></Link> }
function ToolGrid() { const [category, setCategory] = useState<'All' | Category>('All'); const cats = ['All','Convert','Organize','Optimize'] as const; return <section id="tools" className="section tools-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">Powerful, focused tools</span><h2>Everything in one place.</h2></div><p>Choose the tool that fits your workflow and get more done with less friction.</p></div><div className="tabs" role="tablist">{cats.map(cat => <button key={cat} className={category === cat ? 'tab active' : 'tab'} onClick={() => setCategory(cat)}>{cat}</button>)}</div><div className="tool-grid">{tools.filter(tool => category === 'All' || tool.category === category).map(tool => <ToolCard key={tool.key} tool={tool} />)}</div></div></section> }

export function HomePage() { return <><Navbar /><main><section className="hero"><div className="hero-glow" /><div className="container hero-content"><span className="eyebrow">A sharper standard for document work</span><h1>Move every document<br /><span>forward with confidence.</span></h1><p>Precision tools for converting, organizing, and optimizing the files that keep work moving.</p><div className="hero-actions"><a className="button button-primary button-large" href="#tools">Explore PDF Tools <ArrowRight size={17} /></a><a className="button button-secondary button-large" href="#how">How it works <ChevronDown size={16} /></a></div><div className="hero-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>+</span></div><span>Trusted by teams who value their time</span></div><div className="trust-badges"><div className="trust-badge"><span className="trust-badge-icon trust-secure"><ShieldCheck size={16} /></span><div className="trust-badge-text"><strong>Secure &amp; private</strong><span>Files auto-deleted after processing</span></div></div><div className="trust-badge"><span className="trust-badge-icon trust-instant"><Zap size={16} /></span><div className="trust-badge-text"><strong>Fast &amp; instant</strong><span>Convert in just a few clicks</span></div></div><div className="trust-badge"><span className="trust-badge-icon trust-free"><Check size={16} /></span><div className="trust-badge-text"><strong>100% free</strong><span>No sign-up, no watermarks</span></div></div></div></div></section><ToolGrid /><section id="features" className="section trust-section"><div className="container"><div className="center-heading"><span className="eyebrow">Built around your workflow</span><h2>Simple. Secure. Built for<br />everyday documents.</h2></div><div className="feature-grid">{[[ShieldCheck,'Private by design','Your files are yours. We keep your workflow focused and your documents protected.'],[Zap,'Fast processing','No unnecessary steps. Get from upload to finished document in a few clicks.'],[Sparkles,'Easy to use','A clear, thoughtful experience that feels natural from the very first file.']].map(([Icon,title,text]) => <div className="feature-card" key={title as string}><div className="feature-icon"><Icon size={22} /></div><h3>{title as string}</h3><p>{text as string}</p></div>)}</div></div></section><section id="how" className="section how-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">A better way to work</span><h2>Three steps. Zero guesswork.</h2></div></div><div className="steps">{[['01','Choose a tool','Start with the document task you need to complete.'],['02','Upload your file','Drag and drop your file or select it from your device.'],['03','Download the result','Your finished document is ready to use and share.']].map(([number,title,text]) => <div className="step" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section><section id="pricing" className="cta-section"><div className="container cta-inner"><div><span className="eyebrow eyebrow-light">Make room for better work</span><h2>Ready to simplify your<br />PDF workflow?</h2></div><a className="button button-light button-large" href="#tools">Start using PDFmesh <ArrowRight size={17} /></a></div></section><SeoContent /><FaqSection /></main><Footer /></> }

function SeoContent() {
  return (
    <section className="section seo-content" id="about">
      <div className="container">
        <article className="seo-article">
          <h2>Free Online PDF Converter, Editor and Toolkit</h2>
          <p>
            PDFmesh is a fast, free <strong>PDF converter</strong> and online toolkit built for
            everyday document work. Whether you need to <strong>convert PDF to Word</strong>, merge
            several files into one, shrink a large report, or turn photos into a shareable document,
            PDFmesh gives you a clean, reliable place to get it done — with no sign-up, no watermarks,
            and no software to install. Every tool runs in your browser and connects to a secure
            processing service, so you can work from a laptop or phone in seconds.
          </p>

          <h3>Convert PDF to Word in seconds</h3>
          <p>
            Our <strong>PDF to Word</strong> tool turns fixed PDF files into fully editable Word
            documents so you can update text, fix typos, and reuse content without retyping. When you{' '}
            <strong>convert PDF to Word</strong> with PDFmesh, we work to preserve your headings,
            paragraphs, lists, and layout as closely as possible, giving you a document that is ready
            to edit. It is the quickest way to move content from a locked PDF back into an editable
            format for reports, resumes, contracts, and school work.
          </p>

          <h3>Merge, combine and split PDF files</h3>
          <p>
            Need to bring several documents together? The <strong>merge PDF</strong> tool acts as a
            simple <strong>PDF merger</strong> and <strong>PDF combiner</strong> — add your files,
            drag them into the right order, and <strong>combine PDF</strong> pages into one clean
            document. When you need the opposite, the Split PDF tool separates a single file into
            individual pages. Whether you are assembling an invoice pack or breaking apart a scanned
            bundle, you can <strong>merge PDF</strong> and split files in just a few clicks.
          </p>

          <h3>JPG to PDF and PDF to JPG conversion</h3>
          <p>
            Turn images into documents with our <strong>JPG to PDF</strong> converter — select JPG,
            PNG, and other common image formats and combine them into a single, professional PDF,
            perfect for photo collections, receipts, and ID copies. Going the other way, the{' '}
            <strong>PDF to JPG</strong> tool renders each page of a PDF into a high-quality image you
            can share, post, or embed. Both tools handle large batches so you can convert many files
            at once.
          </p>

          <h3>Compress PDF and convert Word to PDF</h3>
          <p>
            Large files are slow to email and upload, so the <strong>compress PDF</strong> tool
            reduces file size while keeping your pages readable — choose the balance between quality
            and size that fits your needs. And when you need a polished, shareable file, the{' '}
            <strong>Word to PDF</strong> tool converts your documents into a PDF that looks the same
            on every device. Together with our <strong>free PDF editor</strong> tools, PDFmesh covers
            the full document workflow from creation to sharing.
          </p>

          <h3>Why choose PDFmesh</h3>
          <p>
            PDFmesh is designed to be genuinely free and simple. There are no accounts to create and
            no confusing menus — just pick a tool, add your file, and download the result. Files are
            processed securely and are not shared, so you can trust the platform with resumes,
            contracts, and personal documents. Because the tools are web based, they work on Windows,
            Mac, Android, and iPhone without any download. From a quick{' '}
            <strong>PDF to Word</strong> conversion to combining a stack of scans, PDFmesh brings the
            most-used PDF tasks into one dependable, easy-to-use place so you can finish your work and
            move on.
          </p>
        </article>
      </div>
    </section>
  )
}

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="section faq-section" id="faq">
      <div className="container">
        <div className="center-heading">
          <span className="eyebrow">Frequently asked questions</span>
          <h2>PDF questions, answered.</h2>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div className={open === i ? 'faq-item is-open' : 'faq-item'} key={item.q}>
              <button
                type="button"
                className="faq-question"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{item.q}</span>
                <ChevronDown size={18} className="faq-chevron" />
              </button>
              {open === i && <div className="faq-answer"><p>{item.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const configs: Record<ToolKey,{title:string; description:string; accept:string; action:string; result:string; multiple?:boolean}> = { 'pdf-to-word':{title:'PDF to Word',description:'Convert your PDF files into editable Word documents.',accept:'PDF',action:'Convert to Word',result:'DOCX'},'word-to-pdf':{title:'Word to PDF',description:'Turn your Word documents into polished PDF files.',accept:'DOC or DOCX',action:'Convert to PDF',result:'PDF'},'jpg-to-pdf':{title:'JPG to PDF',description:'Convert images into a single professional PDF.',accept:'JPG or PNG',action:'Create PDF',result:'PDF',multiple:true},'pdf-to-jpg':{title:'PDF to JPG',description:'Convert PDF pages into high-quality JPG images.',accept:'PDF',action:'Convert to JPG',result:'JPG'},'merge-pdf':{title:'Merge PDF',description:'Combine multiple PDF files into one document.',accept:'PDF',action:'Merge PDFs',result:'PDF',multiple:true},'split-pdf':{title:'Split PDF',description:'Extract pages or divide a PDF into separate files.',accept:'PDF',action:'Split PDF',result:'PDF'},'compress-pdf':{title:'Compress PDF',description:'Reduce PDF file size while keeping great quality.',accept:'PDF',action:'Compress PDF',result:'PDF'} }

function FileList({ files, remove, reorder }: { files: File[]; remove:(i:number)=>void; reorder:(from:number,to:number)=>void }) { const [dragged,setDragged]=useState<number|null>(null); return <div className="file-list">{files.map((file,i) => <div className={dragged===i ? 'file-row is-dragging' : 'file-row'} draggable onDragStart={e => { setDragged(i); e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',String(i)) }} onDragEnd={() => setDragged(null)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); reorder(Number(e.dataTransfer.getData('text/plain')),i); setDragged(null) }} key={`${file.name}-${i}`}><GripVertical className="grip" size={17}/><div className="file-badge"><FileText size={18}/></div><div className="file-meta"><strong>{file.name}</strong><span>{(file.size/1024/1024).toFixed(2)} MB</span></div><button className="icon-button" aria-label={`Remove ${file.name}`} onClick={() => remove(i)}><X size={17}/></button></div>)}</div> }
function UploadZone({ select, multiple, accept, loading }: {select:(files:File[])=>void; multiple?:boolean; accept:string; loading?:boolean}) { const [dragging,setDragging]=useState(false); return <label className={`${dragging ? 'upload-zone is-dragging' : 'upload-zone'}${loading ? ' is-loading' : ''}`} onDragOver={e => { if(loading){ e.preventDefault(); return } e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); if(loading) return; setDragging(false); select(Array.from(e.dataTransfer.files)) }}><input type="file" accept={accept} multiple={multiple} disabled={loading} onChange={e => select(Array.from(e.target.files || []))}/><div className="upload-icon"><Upload size={22}/></div><h3>{loading ? 'Loading your files...' : dragging ? 'Drop to add your files' : `Drag & drop your ${accept} here`}</h3><p>{loading ? 'Please wait a moment.' : dragging ? 'Release to continue' : 'or choose a file from your device'}</p><span className={`button button-primary${loading ? ' button-loading' : ''}`} aria-busy={loading || undefined}>{loading ? <><span className="btn-spinner" aria-hidden="true" />Loading...</> : `Select ${multiple ? 'files' : 'a file'}`}</span><small>Maximum file size: 50 MB</small></label> }
function StateMessage({ type, config, reset, errorMessage, downloadUrl, downloadName, onDownload, noteMessage }: {type:'processing'|'success'|'error'; config:typeof configs[ToolKey]; reset:()=>void; errorMessage?:string; downloadUrl?:string; downloadName?:string; onDownload?:(e?:{ preventDefault:()=>void })=>void; noteMessage?:string}) { const [progress,setProgress]=useState(8); useEffect(() => { if (type !== 'processing') return; const timer=window.setInterval(() => setProgress(value => Math.min(value + 9, 92)), 420); return () => window.clearInterval(timer) }, [type]); if(type==='processing') return <div className="state-card" aria-live="polite"><div className="loader"><span /></div><h2>Processing your file...</h2><div className="progress"><span style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong><p>Please wait while we prepare your document.</p></div>; if(type==='error') return <div className="state-card"><div className="state-icon error"><X size={25}/></div><h2>Something went wrong</h2><p>{errorMessage || 'Please try again or choose another file.'}</p><button className="button button-primary" onClick={reset}>Try again</button></div>; const fileName = downloadName || `document.${config.result.toLowerCase()}`; const downloadLabel = (fileName.split('.').pop() || config.result).toUpperCase(); return <div className="state-card"><div className="state-icon"><Check size={25}/></div><h2>Your file is ready!</h2><p>{fileName}</p>{noteMessage && <p className="state-note">{noteMessage}</p>}<div className="state-actions">{downloadUrl ? <a className="button button-primary" href={downloadUrl} download={fileName} onClick={onDownload}>Download {downloadLabel}</a> : <button className="button button-primary">Download {config.result}</button>}<button className="button button-secondary" onClick={reset}>Convert another file</button></div></div> }
export function ToolPage({ toolKey }: {toolKey:ToolKey}) { const config=configs[toolKey]; const toast=useToast(); const [files,setFiles]=useState<File[]>([]); const [state,setState]=useState<'idle'|'processing'|'success'|'error'>('idle'); const [downloadUrl,setDownloadUrl]=useState<string|null>(null); const [downloadBlob,setDownloadBlob]=useState<Blob|null>(null); const [downloadName,setDownloadName]=useState<string|undefined>(undefined); const [errorMessage,setErrorMessage]=useState<string|undefined>(undefined); const [compressLevel,setCompressLevel]=useState<'extreme'|'recommended'|'less'>('recommended'); const [noteMessage,setNoteMessage]=useState<string|undefined>(undefined); const [preparing,setPreparing]=useState(false); const preparingSince=useRef(0); const select=(newFiles:File[])=>{
    if(newFiles.length===0) return;
    // Show the loading state up-front for selections that can lag while the
    // browser reads/renders them: several files, or one large file. Applies to
    // every tool. Cleared once the list has rendered (see effect below).
    const bigCount = newFiles.length + files.length >= 5;
    const bigSingle = newFiles.some(f => f.size >= 8*1024*1024);
    if(bigCount || bigSingle){ preparingSince.current = Date.now(); setPreparing(true); }
    // Per-tool limits (mirror the backend so users learn early, before upload).
    const maxBytes = toolKey==='jpg-to-pdf' ? 1024*1024*1024 : 50*1024*1024;
    const maxLabel = toolKey==='jpg-to-pdf' ? '1 GB' : '50 MB';
    const maxFiles = toolKey==='jpg-to-pdf' ? 300 : config.multiple ? 30 : 1;
    // Drop files that exceed the per-file size limit and warn about them.
    const sized = newFiles.filter(f => f.size <= maxBytes);
    const tooBig = newFiles.length - sized.length;
    if(tooBig>0) toast.error(`${tooBig} ${tooBig===1?'file is':'files are'} larger than ${maxLabel} and ${tooBig===1?'was':'were'} skipped.`);
    if(sized.length===0) return;
    if(!config.multiple){ setFiles(sized.slice(0,1)); return }
    // Multi-file: append, de-duplicate, and cap at maxFiles with a warning.
    setFiles(prev => {
      const merged=[...prev];
      let dupes=0;
      for(const f of sized){ if(merged.some(e => e.name===f.name && e.size===f.size)){ dupes++; continue } merged.push(f) }
      if(dupes>0) toast.info(`${dupes} duplicate ${dupes===1?'file was':'files were'} skipped.`);
      const capped = merged.length>maxFiles ? merged.slice(0,maxFiles) : merged;
      if(merged.length>maxFiles) toast.warning(`You can add up to ${maxFiles} files here. Extra files were not added.`);
      // Heads-up for very large batches, only when first crossing the threshold.
      if(prev.length < 100 && capped.length >= 100) toast.info(`Large batch (${capped.length} files) — uploading and processing may take a little while.`);
      return capped;
    });
  }; const reset=()=>{ if(downloadUrl) URL.revokeObjectURL(downloadUrl); setDownloadUrl(null); setDownloadBlob(null); setDownloadName(undefined); setErrorMessage(undefined); setNoteMessage(undefined); setPreparing(false); preparingSince.current=0; setFiles([]); setState('idle') }; useEffect(() => () => { if(downloadUrl) URL.revokeObjectURL(downloadUrl) }, [downloadUrl]);
  // Clear the "loading files" state once the file list has actually rendered AND
  // a short minimum time has elapsed, so the loader never flashes-and-vanishes.
  useEffect(() => {
    if(!preparing) return;
    const MIN_MS = 450;
    let raf1 = 0, raf2 = 0, t = 0;
    const finish = () => {
      const elapsed = Date.now() - (preparingSince.current || 0);
      const wait = Math.max(0, MIN_MS - elapsed);
      t = window.setTimeout(() => setPreparing(false), wait) as unknown as number;
    };
    if(typeof window !== 'undefined' && window.requestAnimationFrame){
      // Two frames = the browser has painted the (heavy) file list.
      raf1 = window.requestAnimationFrame(() => { raf2 = window.requestAnimationFrame(finish); });
    } else {
      finish();
    }
    return () => { if(raf1) cancelAnimationFrame(raf1); if(raf2) cancelAnimationFrame(raf2); if(t) clearTimeout(t); };
  }, [preparing, files.length]);
  const reorder=(from:number,to:number)=>{const next=[...files]; const [item]=next.splice(from,1); next.splice(to,0,item);setFiles(next)};
  /* Cross-platform download. Desktop keeps the standard anchor+download behavior. Mobile Safari/Chrome often ignore the download attribute on blob URLs, so we route through a programmatic anchor and fall back to opening the file on iOS. */
  const triggerDownload=(e?:{ preventDefault:()=>void })=>{ if(e) e.preventDefault(); const name=downloadName || `document.${config.result.toLowerCase()}`; const blob=downloadBlob; const href=downloadUrl; if(!href) return; const ua=typeof navigator!=='undefined' ? navigator.userAgent : ''; const isIOS=/iP(ad|hone|od)/.test(ua) || (/(Macintosh)/.test(ua) && typeof document!=='undefined' && 'ontouchend' in document); const a=document.createElement('a'); a.href=href; a.download=name; a.rel='noopener'; document.body.appendChild(a); a.click(); document.body.removeChild(a); if(isIOS && blob){ window.open(href,'_blank'); } toast.success('Your download has started.'); };
  const convertPdfToWord=async()=>{ const file=files[0]; if(!file) return; setErrorMessage(undefined); setState('processing'); try { const formData=new FormData(); formData.append('file',file); const response=await fetch(`${API_BASE_URL}/api/pdf-to-docx`,{ method:'POST', body:formData }); if(!response.ok){ let message='The conversion failed. Please try again or choose another file.'; try { const data=await response.json(); if(data && typeof data.error==='string') message=data.error } catch {} setErrorMessage(message); setState('error'); toast.error(message); return } const blob=await response.blob(); const url=URL.createObjectURL(blob); const baseName=file.name.replace(/\.[^.]+$/,'') || 'document'; setDownloadBlob(blob); setDownloadUrl(url); setDownloadName(`${baseName}.docx`); setState('success') } catch { const msg='Could not reach the conversion service. Please check your connection and try again.'; setErrorMessage(msg); setState('error'); toast.error(msg) } };
  // Free, faithful utility tools handled by the backend (field name: "files").
  // Each returns a downloadable blob (PDF or ZIP) with a sensible filename.
  const TOOL_ENDPOINTS: Partial<Record<ToolKey,{ path:string; outName:(f:File[])=>string }>> = {
    'merge-pdf': { path:'/api/merge-pdf', outName:()=>'merged.pdf' },
    'split-pdf': { path:'/api/split-pdf', outName:(f)=>`${(f[0]?.name||'document').replace(/\.[^.]+$/,'')}_pages.zip` },
    'pdf-to-jpg': { path:'/api/pdf-to-jpg', outName:(f)=>`${(f[0]?.name||'document').replace(/\.[^.]+$/,'')}_images.zip` },
    'jpg-to-pdf': { path:'/api/jpg-to-pdf', outName:()=>'images.pdf' },
    'compress-pdf': { path:'/api/compress-pdf', outName:(f)=>`${(f[0]?.name||'document').replace(/\.[^.]+$/,'')}_compressed.pdf` },
    'word-to-pdf': { path:'/api/word-to-pdf', outName:(f)=>`${(f[0]?.name||'document').replace(/\.[^.]+$/,'')}.pdf` },
  };
  const runToolOp=async()=>{ const spec=TOOL_ENDPOINTS[toolKey]; if(!spec || files.length===0) return; setErrorMessage(undefined); setState('processing'); try { const formData=new FormData(); for(const f of files) formData.append('files',f); if(toolKey==='compress-pdf') formData.append('level',compressLevel); const response=await fetch(`${API_BASE_URL}${spec.path}`,{ method:'POST', body:formData }); if(!response.ok){ let message='The operation failed. Please try again or choose another file.'; try { const data=await response.json(); if(data && typeof data.error==='string') message=data.error } catch {} setErrorMessage(message); setState('error'); toast.error(message); return } const blob=await response.blob(); const url=URL.createObjectURL(blob); const name=spec.outName(files); const skipped=Number(response.headers.get('X-Skipped-Count')||'0'); const converted=Number(response.headers.get('X-Converted-Count')||'0'); if(skipped>0){ const msg=`Converted ${converted} ${converted===1?'image':'images'}, skipped ${skipped} unsupported ${skipped===1?'file':'files'}.`; setNoteMessage(msg); toast.warning(msg) } else { setNoteMessage(undefined) } setDownloadBlob(blob); setDownloadUrl(url); setDownloadName(name); setState('success') } catch { const msg='Could not reach the service. Please check your connection and try again.'; setErrorMessage(msg); setState('error'); toast.error(msg) } };
  const handleProcess=()=>{ if(files.length===0){ toast.error('Please select a file first.'); return } if(toolKey==='pdf-to-word'){ void convertPdfToWord(); return } if(TOOL_ENDPOINTS[toolKey]){ void runToolOp(); return } setState('processing'); setTimeout(()=>setState('success'),1400) };
  return <><Navbar/><main className="tool-page"><div className="container tool-page-inner"><Link href="/" className="back-link">← All PDF tools</Link><div className="tool-header"><div className="tool-page-icon"><ToolSymbol toolKey={toolKey} accent={toolKey === 'pdf-to-word' ? '#3568e8' : toolKey.includes('jpg') ? '#d6bd1d' : toolKey === 'compress-pdf' ? '#83b95b' : '#ef765f'} size="page" /></div><span className="eyebrow">PDFmesh tool</span><h1>{config.title}</h1><p>{config.description}</p></div><div className="workspace">{COMING_SOON[toolKey] ? <div className="state-card"><span className="soon-badge">Coming soon</span><h2>This tool is coming soon</h2><p>We&apos;re putting the finishing touches on {config.title}. It will be available shortly. In the meantime, explore our other PDF tools.</p><Link href="/" className="button button-primary">Explore other tools</Link></div> : state !== 'idle' ? <StateMessage type={state} config={config} reset={reset} errorMessage={errorMessage} downloadUrl={downloadUrl || undefined} downloadName={downloadName} onDownload={triggerDownload} noteMessage={noteMessage}/> : (files.length===0 || preparing) ? <UploadZone select={select} multiple={config.multiple} accept={config.accept} loading={preparing}/> : <div className="uploaded-state"><div className="workspace-top"><div><span className="eyebrow">Ready to process</span><h2>Your {config.multiple ? 'files are' : 'file is'} ready.</h2><span className="file-count">{config.accept}: {files.length} {files.length===1 ? 'file' : 'files'}</span></div><div className="workspace-top-actions">{config.multiple && <label className="button button-secondary add-more-button"><input type="file" accept={config.accept} multiple onChange={e => { select(Array.from(e.target.files || [])); e.currentTarget.value='' }} hidden/>Add more files</label>}<button className="button button-ghost" onClick={reset}>Clear all</button></div></div><FileList files={files} remove={i=>setFiles(files.filter((_,idx)=>idx!==i))} reorder={reorder}/>{toolKey==='compress-pdf' && <div className="option-grid"><button type="button" className={compressLevel==='extreme' ? 'option-card selected' : 'option-card'} onClick={()=>setCompressLevel('extreme')}><strong>Extreme</strong><span>Smallest file</span></button><button type="button" className={compressLevel==='recommended' ? 'option-card selected' : 'option-card'} onClick={()=>setCompressLevel('recommended')}><strong>Recommended</strong><span>Great balance</span></button><button type="button" className={compressLevel==='less' ? 'option-card selected' : 'option-card'} onClick={()=>setCompressLevel('less')}><strong>Less compression</strong><span>Best quality</span></button></div>}{toolKey==='pdf-to-jpg' && <div className="quality-row"><strong>Image quality</strong><button className="quality active">High</button><button className="quality">Medium</button><button className="quality">Low</button></div>}<button className="button button-primary button-large process-button" onClick={handleProcess}>{config.action} <ArrowRight size={17}/></button></div>}</div><p className="security-note"><ShieldCheck size={16}/> Files are processed securely and never shared.</p></div></main><Footer/></> }
