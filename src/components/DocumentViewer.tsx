import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { X, Download, FileText, Image as ImageIcon, FileSpreadsheet, File, ChevronLeft, ChevronRight, Grid, Link as LinkIcon } from 'lucide-react'
import type { TaskDocument, TaskLink } from '../types'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

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
          // Extract base64 data from data URL
          const base64Data = currentDocument.data.includes(',') 
            ? currentDocument.data.split(',')[1] 
            : currentDocument.data
          const csvContent = atob(base64Data)
          const htmlContent = convertCSVToHTML(csvContent)
          setPreviewContent(htmlContent)
          setLoading(false)
          return
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
        !currentDocument.name.toLowerCase().endsWith('.docx') &&
        !currentDocument.name.toLowerCase().endsWith('.xlsx') &&
        !currentDocument.name.toLowerCase().endsWith('.xls') &&
        !currentDocument.name.toLowerCase().endsWith('.csv')) {
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

