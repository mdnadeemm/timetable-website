import { useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { TimetableGrid } from './components/TimetableGrid'
import { AddEventDialog } from './components/AddEventDialog'
import { Button } from './components/ui/button'
import { Plus } from 'lucide-react'
import { TimetableProvider } from './context/TimetableContext'
import { SettingsProvider } from './context/SettingsContext'
import { ToastProvider } from './components/ui/toast'
import './App.css'

function App() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)

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
                  <Button onClick={() => setIsAddEventOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </div>
                
                <TimetableGrid />
              </main>
            </div>

            <AddEventDialog 
              open={isAddEventOpen} 
              onOpenChange={setIsAddEventOpen}
            />
          </div>
        </TimetableProvider>
      </SettingsProvider>
    </ToastProvider>
  )
}

export default App
