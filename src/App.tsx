import { useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { TimetableGrid } from './components/TimetableGrid'
import { AddEventDialog } from './components/AddEventDialog'
import { LearningPlanDialog } from './components/LearningPlanDialog'
import { DocumentViewer } from './components/DocumentViewer'
import { Button } from './components/ui/button'
import { Plus, Sparkles } from 'lucide-react'
import { TimetableProvider } from './context/TimetableContext'
import { SettingsProvider } from './context/SettingsContext'
import { ToastProvider } from './components/ui/toast'
import type { TaskDocument, TaskLink } from './types'
import './App.css'

function App() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [isLearningPlanOpen, setIsLearningPlanOpen] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<TaskDocument | null>(null)
  const [viewingAllDocuments, setViewingAllDocuments] = useState<TaskDocument[]>([])
  const [viewingLink, setViewingLink] = useState<TaskLink | null>(null)
  const [viewingAllLinks, setViewingAllLinks] = useState<TaskLink[]>([])

  const handleViewDocument = (document: TaskDocument, allDocuments?: TaskDocument[], allLinks?: TaskLink[]) => {
    setViewingDocument(document)
    setViewingAllDocuments(allDocuments || [])
    setViewingLink(null)
    setViewingAllLinks(allLinks || [])
  }

  const handleViewLink = (link: TaskLink, allDocuments?: TaskDocument[], allLinks?: TaskLink[]) => {
    setViewingLink(link)
    setViewingAllLinks(allLinks || [])
    setViewingDocument(null)
    setViewingAllDocuments(allDocuments || [])
  }

  const handleCloseDocument = () => {
    setViewingDocument(null)
    setViewingAllDocuments([])
    setViewingLink(null)
    setViewingAllLinks([])
  }

  return (
    <ToastProvider>
      <SettingsProvider>
        <TimetableProvider>
          <div className="min-h-screen bg-background flex flex-col h-screen">
            <Header />
            
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <Sidebar />
              
              <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden min-w-0">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-bold">Timetable</h1>
                  <div className="flex gap-2">
                    <Button onClick={() => setIsLearningPlanOpen(true)} variant="outline">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Learning Plan
                    </Button>
                    <Button onClick={() => setIsAddEventOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                  </div>
                </div>
                
                <TimetableGrid onViewDocument={handleViewDocument} onViewLink={handleViewLink} />
              </main>
            </div>

            <AddEventDialog 
              open={isAddEventOpen} 
              onOpenChange={setIsAddEventOpen}
            />

            <LearningPlanDialog
              open={isLearningPlanOpen}
              onOpenChange={setIsLearningPlanOpen}
            />

            {/* Document Viewer - Overlay on top */}
            {(viewingDocument || viewingLink) && (
              <DocumentViewer 
                document={viewingDocument}
                link={viewingLink}
                allDocuments={viewingAllDocuments.length > 0 ? viewingAllDocuments : undefined}
                allLinks={viewingAllLinks.length > 0 ? viewingAllLinks : undefined}
                onClose={handleCloseDocument} 
              />
            )}
          </div>
        </TimetableProvider>
      </SettingsProvider>
    </ToastProvider>
  )
}

export default App
