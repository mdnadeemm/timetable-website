import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Download, Upload, FileText, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import { useTimetable } from '../context/TimetableContext'
import { useToast } from './ui/toast'
import type { ImportEventData } from '../types'
import { parseTimeString } from '../utils/timeUtils'
import type { Task } from '../types'

const DEFAULT_TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM'
]

export const ExportImport: React.FC = () => {
  const { events, addEvent } = useTimetable()
  const { addToast } = useToast()
  const [importStatus, setImportStatus] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const exportToJSON = () => {
    // Count total tasks across all events
    const totalTasks = events.reduce((sum, event) => sum + (event.tasks?.length || 0), 0)
    
    // Serialize events with tasks - Date objects will be serialized as ISO strings by JSON.stringify
    const dataStr = JSON.stringify(events, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `timetable-export-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    addToast({
      title: 'Export Successful',
      description: `Exported ${events.length} events${totalTasks > 0 ? ` with ${totalTasks} tasks` : ''} to JSON file.`,
      variant: 'success'
    })
  }

  const exportToText = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const totalTasks = events.reduce((sum, event) => sum + (event.tasks?.length || 0), 0)

    let content = 'TIMETABLE EXPORT\n'
    content += `Generated on: ${new Date().toLocaleDateString()}\n`
    content += '='.repeat(50) + '\n\n'

    days.forEach((dayName, dayIndex) => {
      const dayEvents = events.filter(e => e.day === dayIndex)
      if (dayEvents.length > 0) {
        content += `${dayName.toUpperCase()}\n`
        content += '-'.repeat(20) + '\n'
        
        dayEvents.forEach(event => {
          const startTime = typeof event.startTime === 'string' ? event.startTime : 
            (typeof event.startTime === 'number' ? DEFAULT_TIMES[event.startTime] || `Slot ${event.startTime}` : 'Unknown')
          const endTime = typeof event.endTime === 'string' ? event.endTime :
            (typeof event.endTime === 'number' ? DEFAULT_TIMES[event.endTime] || `Slot ${event.endTime}` : 'Unknown')
          content += `${startTime} - ${endTime}\n`
          content += `  ${event.title}\n`
          if (event.teacher) content += `  Teacher: ${event.teacher}\n`
          if (event.location) content += `  Location: ${event.location}\n`
          if (event.description) content += `  Description: ${event.description}\n`
          
          // Include tasks if they exist
          if (event.tasks && event.tasks.length > 0) {
            content += `  Tasks:\n`
            event.tasks.forEach((task, index) => {
              const status = task.completed ? '[✓]' : '[ ]'
              content += `    ${status} ${task.title}\n`
              if (task.description) content += `      ${task.description}\n`
            })
          }
          
          content += '\n'
        })
        content += '\n'
      }
    })

    const dataBlob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `timetable-export-${new Date().toISOString().split('T')[0]}.txt`
    link.click()
    URL.revokeObjectURL(url)
    
    addToast({
      title: 'Export Successful',
      description: `Exported ${events.length} events${totalTasks > 0 ? ` with ${totalTasks} tasks` : ''} to text file.`,
      variant: 'success'
    })
  }

  const importFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedEvents = JSON.parse(content)
        
        // Validate the imported data
        if (Array.isArray(importedEvents)) {
          let importedCount = 0
          let failedCount = 0
          let totalTasksImported = 0
          
          importedEvents.forEach((eventData: ImportEventData, index: number) => {
            try {
              // Validate required fields
              if (!eventData.title || eventData.day === undefined || 
                  eventData.startTime === undefined || eventData.endTime === undefined) {
                failedCount++
                return
              }
              
              // Create event object - handle both old (number) and new (string) formats
              let startTime: string
              let endTime: string
              
              if (typeof eventData.startTime === 'string') {
                startTime = eventData.startTime
              } else if (typeof eventData.startTime === 'number') {
                startTime = DEFAULT_TIMES[eventData.startTime] || '8:00 AM'
              } else {
                startTime = '8:00 AM'
              }
              
              if (typeof eventData.endTime === 'string') {
                endTime = eventData.endTime
              } else if (typeof eventData.endTime === 'number') {
                endTime = DEFAULT_TIMES[eventData.endTime] || '9:00 AM'
              } else {
                endTime = '9:00 AM'
              }
              
              // Process tasks if they exist - convert Date strings back to Date objects
              let tasks: Task[] | undefined
              if (eventData.tasks && Array.isArray(eventData.tasks)) {
                tasks = eventData.tasks.map((taskData, taskIndex) => {
                  const task: Task = {
                    id: taskData.id || `imported-${index}-${taskIndex}`,
                    title: taskData.title || 'Untitled Task',
                    completed: taskData.completed || false,
                    order: taskData.order !== undefined ? taskData.order : taskIndex,
                    createdAt: taskData.createdAt 
                      ? (typeof taskData.createdAt === 'string' ? new Date(taskData.createdAt) : taskData.createdAt)
                      : new Date(),
                    completedAt: taskData.completedAt
                      ? (typeof taskData.completedAt === 'string' ? new Date(taskData.completedAt) : taskData.completedAt)
                      : undefined,
                    description: taskData.description
                  }
                  return task
                })
                totalTasksImported += tasks.length
              }
              
              const newEvent = {
                title: eventData.title,
                day: parseInt(eventData.day?.toString() || '') || 1,
                startTime: startTime,
                endTime: endTime,
                teacher: eventData.teacher || '',
                location: eventData.location || '',
                color: eventData.color || 'bg-blue-500',
                description: eventData.description || '',
                tasks: tasks
              }
              
              // Validate time range
              const startMinutes = parseTimeString(startTime)
              const endMinutes = parseTimeString(endTime)
              
              if (endMinutes > startMinutes && startMinutes !== -1 && endMinutes !== -1) {
                addEvent(newEvent)
                importedCount++
              } else {
                failedCount++
              }
            } catch (error) {
              failedCount++
              // eslint-disable-next-line no-console
              console.error(`Failed to import event at index ${index}:`, error)
            }
          })
          
          if (importedCount > 0) {
            const taskMessage = totalTasksImported > 0 ? ` with ${totalTasksImported} tasks` : ''
            setImportStatus(`Successfully imported ${importedCount} events${taskMessage}${failedCount > 0 ? ` (${failedCount} failed)` : ''}`)
            addToast({
              title: 'Import Successful',
              description: `Imported ${importedCount} events${taskMessage} from file.`,
              variant: 'success'
            })
          } else {
            setImportStatus(`No valid events found in file${failedCount > 0 ? ` (${failedCount} invalid entries)` : ''}`)
            addToast({
              title: 'Import Failed',
              description: 'No valid events found in the imported file.',
              variant: 'destructive'
            })
          }
        } else {
          setImportStatus('Invalid file format. Expected JSON array.')
          addToast({
            title: 'Import Failed',
            description: 'Invalid file format. Please select a valid JSON file.',
            variant: 'destructive'
          })
        }
      } catch (error) {
        setImportStatus('Error parsing file. Please check file format.')
        addToast({
          title: 'Import Failed',
          description: 'Error parsing file. Please check the file format.',
          variant: 'destructive'
        })
      }
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4 min-w-0">
      <Card className="p-4 min-w-0">
        <h3 className="text-base font-semibold mb-2 flex items-center min-w-0">
          <Download className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">Export Timetable</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-3 break-words">
          Download your timetable data for backup or sharing.
        </p>
        <div className="space-y-2">
          <Button onClick={exportToJSON} className="w-full justify-start min-w-0" size="sm" disabled={events.length === 0}>
            <FileText className="w-3 h-3 mr-2 flex-shrink-0" />
            <span className="truncate">Export as JSON ({events.length} events)</span>
          </Button>
          <Button onClick={exportToText} variant="outline" className="w-full justify-start min-w-0" size="sm" disabled={events.length === 0}>
            <FileText className="w-3 h-3 mr-2 flex-shrink-0" />
            <span className="truncate">Export as Text ({events.length} events)</span>
          </Button>
        </div>
      </Card>

      <Card className="p-4 min-w-0">
        <h3 className="text-base font-semibold mb-2 flex items-center min-w-0">
          <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">Import Timetable</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-3 break-words">
          Upload a JSON file to import events and their tasks. This will add to your existing timetable.
        </p>
        <div className="space-y-3 min-w-0">
          <div className="min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importFromFile}
              className="hidden"
              id="import-file"
            />
            <Button onClick={handleImportClick} className="w-full min-w-0" variant="outline" size="sm">
              <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
              <span className="truncate">Choose JSON File</span>
            </Button>
          </div>
          {importStatus && (
            <div className={`text-xs p-2 rounded bg-muted break-words min-w-0 flex items-start gap-2 ${
              importStatus.startsWith('Successfully') ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            }`}>
              {importStatus.startsWith('Successfully') ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{importStatus}</span>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded min-w-0">
            <h4 className="font-medium mb-1">Expected JSON format:</h4>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words min-w-0">
{`[{
  "title": "Event",
  "day": 1,
  "startTime": "8:00 AM",
  "endTime": "9:00 AM",
  "tasks": [
    {
      "title": "Task 1",
      "completed": false,
      "order": 0
    }
  ]
}]`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  )
}
