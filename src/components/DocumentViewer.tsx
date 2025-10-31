import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { X, Download, FileText, Image as ImageIcon, FileSpreadsheet, File, ChevronLeft, ChevronRight, Grid, Link as LinkIcon } from 'lucide-react'
import type { TaskDocument, TaskLink } from '../types'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'

interface DocumentViewerProps {
  document?: TaskDocument
  link?: TaskLink
  allDocuments?: TaskDocument[]
  allLinks?: TaskLink[]
  onClose: () => void
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, link, allDocuments, allLinks, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [markdownContent, setMarkdownContent] = useState<string | null>(null)

  // Create unified list of items (documents + links)
  const documents = allDocuments && allDocuments.length > 0 ? allDocuments : (document ? [document] : [])
  const links = allLinks && allLinks.length > 0 ? allLinks : (link ? [link] : [])
  
  // Unified items array: documents come first, then links
  type ViewerItem = { type: 'document', item: TaskDocument } | { type: 'link', item: TaskLink }
  const items: ViewerItem[] = [
    ...documents.map(doc => ({ type: 'document' as const, item: doc })),
    ...links.map(lnk => ({ type: 'link' as const, item: lnk }))
  ]

  const currentItem = items[currentIndex]
  const isLinkView = currentItem?.type === 'link'
  const currentDocument = currentItem?.type === 'document' ? currentItem.item : undefined
  const currentLink = currentItem?.type === 'link' ? currentItem.item : undefined

  useEffect(() => {
    // Find the index of the initial item
    let initialIndex = 0
    
    if (document) {
      const docIndex = items.findIndex(item => item.type === 'document' && item.item.id === document.id)
      if (docIndex !== -1) initialIndex = docIndex
    } else if (link) {
      const linkIndex = items.findIndex(item => item.type === 'link' && item.item.id === link.id)
      if (linkIndex !== -1) initialIndex = linkIndex
    }
    
    setCurrentIndex(initialIndex)
    setLoading(true)
    setError(null)
    setPreviewContent(null)
    setMarkdownContent(null)

    // Prevent body scroll when viewer is open
    window.document.body.style.overflow = 'hidden'
    
    return () => {
      // Restore body scroll when viewer closes
      window.document.body.style.overflow = ''
    }
  }, [document?.id, link?.id, items.length])

  // Load preview content when item changes
  useEffect(() => {
    if (isLinkView) {
      setLoading(false)
      return // Links don't need preview loading
    }
    
    const loadPreview = async () => {
      if (!currentDocument) return

      setLoading(true)
      setError(null)
      setPreviewContent(null)
      setMarkdownContent(null)

      try {
        // Handle DOCX files
        if (currentDocument.type.includes('wordprocessingml') || 
            currentDocument.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            currentDocument.name.toLowerCase().endsWith('.docx')) {
          const arrayBuffer = base64ToArrayBuffer(currentDocument.data)
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setPreviewContent(result.value)
          setLoading(false)
          return
        }

        // Handle DOC files (old format) - limited support
        if (currentDocument.type.includes('msword') || 
            currentDocument.name.toLowerCase().endsWith('.doc')) {
          setError('DOC files (old Word format) cannot be previewed. Please convert to DOCX or download the file.')
          setLoading(false)
          return
        }

        // Handle Excel files (XLSX)
        if (currentDocument.type.includes('spreadsheetml') ||
            currentDocument.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            currentDocument.name.toLowerCase().endsWith('.xlsx')) {
          const arrayBuffer = base64ToArrayBuffer(currentDocument.data)
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const htmlContent = convertExcelToHTML(workbook)
          setPreviewContent(htmlContent)
          setLoading(false)
          return
        }

        // Handle XLS files (old Excel format)
        if (currentDocument.type.includes('ms-excel') ||
            currentDocument.name.toLowerCase().endsWith('.xls')) {
          try {
            const arrayBuffer = base64ToArrayBuffer(currentDocument.data)
            const workbook = XLSX.read(arrayBuffer, { type: 'array' })
            const htmlContent = convertExcelToHTML(workbook)
            setPreviewContent(htmlContent)
            setLoading(false)
          } catch (err) {
            setError('Failed to preview XLS file. Please download and open in Excel.')
            setLoading(false)
          }
          return
        }

        // Handle CSV files
        if (currentDocument.type.includes('csv') ||
            currentDocument.name.toLowerCase().endsWith('.csv')) {
          // Use proper UTF-8 decoding for CSV files to handle Unicode characters correctly
          const csvContent = base64ToUTF8(currentDocument.data)
          const htmlContent = convertCSVToHTML(csvContent)
          setPreviewContent(htmlContent)
          setLoading(false)
          return
        }

        // Handle Markdown files
        if (currentDocument.type.includes('markdown') ||
            currentDocument.type === 'text/markdown' ||
            currentDocument.name.toLowerCase().endsWith('.md') ||
            currentDocument.name.toLowerCase().endsWith('.markdown')) {
          try {
            // Use proper UTF-8 decoding for markdown files to handle Unicode characters correctly
            const decodedMarkdown = base64ToUTF8(currentDocument.data)
            
            // Store markdown content for ReactMarkdown component
            setMarkdownContent(decodedMarkdown)
            setLoading(false)
            return
          } catch (err: any) {
            console.error('Markdown decoding error:', err)
            console.error('Document data preview:', currentDocument.data.substring(0, 100))
            setError('Failed to decode markdown file: ' + (err.message || 'Unknown error'))
            setLoading(false)
            return
          }
        }

        // For other file types, set loading to false
        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'Failed to load preview')
        setLoading(false)
      }
    }

    loadPreview()
  }, [currentDocument, isLinkView])

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    // Remove data URL prefix if present
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  // Helper function to decode UTF-8 from base64
  const base64ToUTF8 = (base64: string): string => {
    // Remove data URL prefix if present
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    // Use TextDecoder to properly decode UTF-8
    return new TextDecoder('utf-8').decode(bytes)
  }

  const convertExcelToHTML = (workbook: XLSX.WorkBook): string => {
    let html = '<div class="excel-preview space-y-4">'
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
      
      if (jsonData.length > 0) {
        html += `<div class="sheet-container mb-6">`
        html += `<h3 class="text-lg font-semibold mb-2 text-foreground">${sheetName}</h3>`
        html += '<div class="overflow-x-auto">'
        html += '<table class="min-w-full border border-border">'
        
        jsonData.forEach((row: any, rowIndex: number) => {
          html += '<tr>'
          row.forEach((cell: any) => {
            const cellContent = cell !== null && cell !== undefined ? String(cell) : ''
            const isHeader = rowIndex === 0
            html += `<td class="border border-border px-2 py-1 ${isHeader ? 'bg-muted font-semibold' : 'bg-background'} text-foreground">${escapeHtml(cellContent)}</td>`
          })
          html += '</tr>'
        })
        
        html += '</table>'
        html += '</div>'
        html += '</div>'
      }
    })
    
    html += '</div>'
    return html
  }

  const convertCSVToHTML = (csvContent: string): string => {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length === 0) return '<p>No data found</p>'
    
    // Improved CSV parsing that handles quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++ // Skip next quote
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }
    
    let html = '<div class="csv-preview overflow-x-auto">'
    html += '<table class="min-w-full border border-border">'
    
    lines.forEach((line, index) => {
      const cells = parseCSVLine(line)
      const isHeader = index === 0
      html += '<tr>'
      cells.forEach(cell => {
        html += `<td class="border border-border px-2 py-1 ${isHeader ? 'bg-muted font-semibold' : 'bg-background'} text-foreground">${escapeHtml(cell)}</td>`
      })
      html += '</tr>'
    })
    
    html += '</table>'
    html += '</div>'
    return html
  }

  const escapeHtml = (text: string): string => {
    const div = window.document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon
    if (type.includes('pdf')) return FileText
    if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) return FileSpreadsheet
    if (type.includes('word') || type.includes('document')) return FileText
    if (type.includes('markdown') || type === 'text/markdown') return FileText
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleDownload = () => {
    if (!currentDocument) return
    const link = window.document.createElement('a')
    link.href = currentDocument.data
    link.download = currentDocument.name
    link.click()
  }

  const renderContent = () => {
    // Handle links - show webpage in iframe
    if (isLinkView && currentLink) {
      return (
        <div className="h-full w-full overflow-hidden">
          <iframe
            src={currentLink.url}
            className="w-full h-full border-0"
            title={currentLink.title || currentLink.url}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError('Failed to load webpage')
              setLoading(false)
            }}
          />
        </div>
      )
    }

    if (!currentDocument) return null

    // Handle DOCX - rendered HTML
    if (previewContent && (
      currentDocument.type.includes('wordprocessingml') ||
      currentDocument.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      currentDocument.name.toLowerCase().endsWith('.docx')
    )) {
      return (
        <div className="h-full w-full overflow-auto">
          <div className="flex items-start justify-center min-h-full p-8">
            <div 
              className="max-w-4xl w-full bg-background prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>
        </div>
      )
    }

    // Handle Excel files - rendered HTML table
    if (previewContent && (
      currentDocument.type.includes('spreadsheetml') ||
      currentDocument.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      currentDocument.type.includes('ms-excel') ||
      currentDocument.name.toLowerCase().endsWith('.xlsx') ||
      currentDocument.name.toLowerCase().endsWith('.xls')
    )) {
      return (
        <div className="h-full w-full overflow-auto">
          <div className="flex items-start justify-center min-h-full p-8">
            <div 
              className="max-w-full w-full bg-background"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>
        </div>
      )
    }

    // Handle CSV files - rendered HTML table
    if (previewContent && (
      currentDocument.type.includes('csv') ||
      currentDocument.name.toLowerCase().endsWith('.csv')
    )) {
      return (
        <div className="h-full w-full overflow-auto">
          <div className="flex items-start justify-center min-h-full p-8">
            <div 
              className="max-w-full w-full bg-background"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>
        </div>
      )
    }

    // Handle Markdown files - rendered with ReactMarkdown
    if (markdownContent && currentDocument && (
      currentDocument.type.includes('markdown') ||
      currentDocument.type === 'text/markdown' ||
      currentDocument.name.toLowerCase().endsWith('.md') ||
      currentDocument.name.toLowerCase().endsWith('.markdown')
    )) {
      return (
        <div className="h-full w-full overflow-auto bg-background">
          <div className="flex items-start justify-center min-h-full py-8 px-4 sm:px-6 lg:px-8">
            <article className="max-w-4xl w-full bg-background prose prose-base dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-foreground prose-headings:mt-8 prose-headings:mb-4
              prose-h1:text-4xl prose-h1:border-b prose-h1:border-border prose-h1:pb-2 prose-h1:mb-6 prose-h1:font-extrabold prose-h1:leading-tight
              prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:font-bold prose-h2:leading-tight
              prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:font-semibold prose-h3:leading-snug
              prose-h4:text-xl prose-h4:mt-4 prose-h4:mb-2 prose-h4:font-semibold prose-h4:leading-snug
              prose-h5:text-lg prose-h5:mt-3 prose-h5:mb-2 prose-h5:font-medium prose-h5:leading-normal
              prose-h6:text-base prose-h6:mt-2 prose-h6:mb-2 prose-h6:font-medium prose-h6:leading-normal
              prose-p:text-foreground prose-p:leading-7 prose-p:my-4 prose-p:text-base
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-strong:text-foreground prose-strong:font-bold
              prose-em:text-foreground prose-em:italic
              prose-ul:text-foreground prose-ul:my-4 prose-ul:pl-6 prose-ul:list-disc
              prose-ol:text-foreground prose-ol:my-4 prose-ol:pl-6 prose-ol:list-decimal
              prose-li:text-foreground prose-li:my-2 prose-li:pl-2
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-4 prose-blockquote:bg-muted/50 prose-blockquote:py-2
              prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
              prose-pre:bg-[#0d1117] prose-pre:text-[#c9d1d9] prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4 prose-pre:border prose-pre:border-border prose-pre:shadow-sm prose-pre:leading-relaxed
              prose-pre code:bg-transparent prose-pre code:p-0 prose-pre code:text-sm prose-pre code:text-[#c9d1d9] prose-pre code:font-mono
              prose-img:rounded-lg prose-img:my-4 prose-img:shadow-md prose-img:border prose-img:border-border prose-img:max-w-full prose-img:h-auto
              prose-hr:border-border prose-hr:my-8 prose-hr:border-t-2
              prose-table:border-collapse prose-table:w-full prose-table:my-4 prose-table:shadow-sm prose-table:border prose-table:border-border prose-table:rounded-lg prose-table:overflow-hidden
              prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
              prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-foreground
              prose-thead:bg-muted
              dark:prose-pre:bg-[#0d1117] dark:prose-pre:text-[#c9d1d9]
              [&_pre.hljs]:bg-[#0d1117] [&_pre.hljs]:text-[#c9d1d9] [&_pre.hljs]:border-[#30363d]
              [&_code.hljs]:bg-transparent [&_code.hljs]:text-[inherit]
              [&_.hljs-comment]:text-[#8b949e] [&_.hljs-quote]:text-[#8b949e]
              [&_.hljs-variable]:text-[#ff7b72] [&_.hljs-template-variable]:text-[#ff7b72]
              [&_.hljs-attribute]:text-[#ff7b72] [&_.hljs-tag]:text-[#ff7b72]
              [&_.hljs-name]:text-[#ff7b72] [&_.hljs-regexp]:text-[#ff7b72]
              [&_.hljs-link]:text-[#ff7b72] [&_.hljs-selector-id]:text-[#ff7b72]
              [&_.hljs-selector-class]:text-[#ff7b72]
              [&_.hljs-number]:text-[#79c0ff] [&_.hljs-meta]:text-[#79c0ff]
              [&_.hljs-built_in]:text-[#ffa657] [&_.hljs-builtin-name]:text-[#ffa657]
              [&_.hljs-literal]:text-[#79c0ff] [&_.hljs-type]:text-[#79c0ff]
              [&_.hljs-params]:text-[#d2a8ff] [&_.hljs-string]:text-[#a5d6ff]
              [&_.hljs-symbol]:text-[#79c0ff] [&_.hljs-bullet]:text-[#79c0ff]
              [&_.hljs-title]:text-[#d2a8ff] [&_.hljs-section]:text-[#d2a8ff]
              [&_.hljs-keyword]:text-[#ff7b72] [&_.hljs-selector-tag]:text-[#ff7b72]
              [&_.hljs-emphasis]:italic [&_.hljs-strong]:font-bold">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
                components={{
                  // Customize code blocks for better syntax highlighting
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  // Customize links to open in new tab
                  a({ node, href, children, ...props }: any) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    )
                  },
                  // Customize images
                  img({ node, src, alt, ...props }: any) {
                    return (
                      <img src={src} alt={alt} className="rounded-lg my-4 shadow-md border border-border max-w-full h-auto" {...props} />
                    )
                  }
                }}
              >
                {markdownContent}
              </ReactMarkdown>
              <style>{`
                /* GitHub-style syntax highlighting */
                .prose pre.hljs,
                .prose pre code.hljs {
                  background: #0d1117 !important;
                  color: #c9d1d9 !important;
                  border: 1px solid #30363d;
                }
                .prose pre code.hljs {
                  background: transparent !important;
                }
                .hljs-comment,
                .hljs-quote {
                  color: #8b949e;
                }
                .hljs-variable,
                .hljs-template-variable,
                .hljs-attribute,
                .hljs-tag,
                .hljs-name,
                .hljs-regexp,
                .hljs-link,
                .hljs-selector-id,
                .hljs-selector-class {
                  color: #ff7b72;
                }
                .hljs-number,
                .hljs-meta {
                  color: #79c0ff;
                }
                .hljs-built_in,
                .hljs-builtin-name {
                  color: #ffa657;
                }
                .hljs-literal,
                .hljs-type {
                  color: #79c0ff;
                }
                .hljs-params {
                  color: #d2a8ff;
                }
                .hljs-string {
                  color: #a5d6ff;
                }
                .hljs-symbol,
                .hljs-bullet {
                  color: #79c0ff;
                }
                .hljs-title,
                .hljs-section {
                  color: #d2a8ff;
                }
                .hljs-keyword,
                .hljs-selector-tag {
                  color: #ff7b72;
                }
                .hljs-emphasis {
                  font-style: italic;
                }
                .hljs-strong {
                  font-weight: bold;
                }
              `}</style>
            </article>
          </div>
        </div>
      )
    }

    // Handle images
    if (currentDocument.type.startsWith('image/')) {
      return (
        <div className="h-full w-full overflow-auto flex items-center justify-center p-4">
          <img 
            src={currentDocument.data} 
            alt={currentDocument.name}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setLoading(false)}
            onError={() => {
              setError('Failed to load image')
              setLoading(false)
            }}
          />
        </div>
      )
    }

    // Handle PDFs
    if (currentDocument.type === 'application/pdf') {
      return (
        <div className="h-full w-full overflow-hidden">
          <iframe
            src={currentDocument.data}
            className="w-full h-full border-0"
            title={currentDocument.name}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError('Failed to load PDF')
              setLoading(false)
            }}
          />
        </div>
      )
    }

    // For other file types, show download option
    const FileIcon = getFileIcon(currentDocument.type)
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 bg-background">
        <FileIcon className="w-24 h-24 text-muted-foreground" />
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{currentDocument.name}</p>
          <p className="text-sm text-muted-foreground mt-2">{formatFileSize(currentDocument.size)}</p>
          <p className="text-sm text-muted-foreground mt-1">This file type cannot be previewed</p>
          <Button onClick={handleDownload} className="mt-4">
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    // Set loading to false after a short delay for non-iframe content that doesn't need processing
    if (isLinkView) {
      setLoading(false)
      return
    }
    
    if (!currentDocument) {
      setLoading(false)
      return
    }
    
    if (!currentDocument.type.startsWith('image/') && 
        currentDocument.type !== 'application/pdf' &&
        !previewContent &&
        !currentDocument.type.includes('wordprocessingml') &&
        !currentDocument.type.includes('spreadsheetml') &&
        !currentDocument.type.includes('ms-excel') &&
        !currentDocument.type.includes('csv') &&
        !currentDocument.type.includes('markdown') &&
        !currentDocument.name.toLowerCase().endsWith('.docx') &&
        !currentDocument.name.toLowerCase().endsWith('.xlsx') &&
        !currentDocument.name.toLowerCase().endsWith('.xls') &&
        !currentDocument.name.toLowerCase().endsWith('.csv') &&
        !currentDocument.name.toLowerCase().endsWith('.md') &&
        !currentDocument.name.toLowerCase().endsWith('.markdown')) {
      setLoading(false)
    }
  }, [currentDocument?.type, currentDocument?.id, currentDocument?.name, previewContent, isLinkView])

  return (
    <div className="fixed inset-0 bg-background z-[200] flex flex-col overflow-hidden">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-background/98 backdrop-blur-sm -z-10" />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isLinkView && currentLink ? (
            <>
              <LinkIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-card-foreground font-semibold truncate">{currentLink.title || currentLink.url}</h2>
                <p className="text-xs text-muted-foreground">
                  {currentLink.url}
                  {items.length > 1 && ` • ${currentIndex + 1} of ${items.length}`}
                </p>
              </div>
            </>
          ) : currentDocument ? (
            <>
              {React.createElement(getFileIcon(currentDocument.type), { className: "w-5 h-5 text-muted-foreground flex-shrink-0" })}
              <div className="flex-1 min-w-0">
                <h2 className="text-card-foreground font-semibold truncate">{currentDocument.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(currentDocument.size)} • {currentDocument.type}
                  {items.length > 1 && ` • ${currentIndex + 1} of ${items.length}`}
                </p>
              </div>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {(items.length > 1 || (documents.length > 0 && links.length > 0)) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowThumbnails(!showThumbnails)}
                title="Toggle thumbnails"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                title="Previous item"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === items.length - 1}
                title="Next item"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
          {!isLinkView && currentDocument && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          {isLinkView && currentLink && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(currentLink.url, '_blank')}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative flex bg-background min-h-0">
        {/* Thumbnails sidebar - show for both documents and links */}
        {showThumbnails && (items.length > 1 || (documents.length > 0 && links.length > 0)) && (
          <div className="w-48 bg-card border-r border-border overflow-y-auto p-2 flex-shrink-0">
            <h3 className="text-card-foreground text-sm font-semibold mb-2 px-2">All Items</h3>
            <div className="space-y-2">
              {items.map((item, index) => {
                const isActive = index === currentIndex
                if (item.type === 'document') {
                  const FileIcon = getFileIcon(item.item.type)
                  return (
                    <div
                      key={`doc-${item.item.id}`}
                      onClick={() => handleThumbnailClick(index)}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileIcon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs truncate ${isActive ? 'text-primary-foreground' : 'text-card-foreground'}`}>{item.item.name}</p>
                          <p className={`text-xs ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{formatFileSize(item.item.size)}</p>
                        </div>
                      </div>
                      {item.item.type.startsWith('image/') && (
                        <img
                          src={item.item.data}
                          alt={item.item.name}
                          className="mt-2 w-full h-20 object-cover rounded"
                        />
                      )}
                    </div>
                  )
                } else {
                  // Link item
                  return (
                    <div
                      key={`link-${item.item.id}`}
                      onClick={() => handleThumbnailClick(index)}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LinkIcon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs truncate ${isActive ? 'text-primary-foreground' : 'text-card-foreground'}`}>
                            {item.item.title || item.item.url}
                          </p>
                          <p className={`text-xs ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'} truncate`}>
                            {item.item.url}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-auto relative bg-background min-h-0">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 backdrop-blur-sm">
              <div className="text-foreground">Loading...</div>
            </div>
          )}
          {error ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center text-foreground">
                <p className="text-lg mb-2">{error}</p>
                <Button onClick={handleDownload} variant="outline" className="mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  )
}

