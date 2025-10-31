import React, { useState, useEffect, useRef } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { useTimetable } from '../context/TimetableContext'
import { useToast } from './ui/toast'
import { TimePicker } from './TimePicker'
import { parseTimeString } from '../utils/timeUtils'
import { CheckSquare, Edit3, X, Plus, Trash2, Edit, ChevronDown, ChevronUp, GripVertical, ListTodo, Check, ClipboardList, CheckCircle2, Paperclip, FileText, Image as ImageIcon, FileSpreadsheet, File, Link as LinkIcon } from 'lucide-react'
import { Checkbox } from './ui/checkbox'
import type { TaskDocument, TaskLink } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface TaskPanelProps {
  open: boolean
  onClose: () => void
  eventId: string | null
  initialTab?: TabType
  onViewDocument?: (document: TaskDocument, allDocuments?: TaskDocument[], allLinks?: TaskLink[]) => void
  onViewLink?: (link: TaskLink, allDocuments?: TaskDocument[], allLinks?: TaskLink[]) => void
}

type TabType = 'tasks' | 'edit'

const DAYS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

const COLORS = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Red', value: 'bg-red-500' },
]

interface EventFormData {
  title: string
  day: string
  startTime: string
  endTime: string
  teacher: string
  location: string
  color: string
  description: string
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ 
  open, 
  onClose, 
  eventId,
  initialTab = 'tasks',
  onViewDocument,
  onViewLink
}) => {
  const { events, addTask, updateTask, deleteTask, toggleTask, updateEvent, deleteEvent, reorderTasks } = useTimetable()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  const dragCounter = useRef(0)
  const newTaskFilesRef = useRef<HTMLInputElement | null>(null)
  const editingTaskFilesRef = useRef<HTMLInputElement | null>(null)
  const [newTaskFiles, setNewTaskFiles] = useState<TaskDocument[]>([])
  const [editingTaskFiles, setEditingTaskFiles] = useState<TaskDocument[]>([])
  const [newTaskLinks, setNewTaskLinks] = useState<TaskLink[]>([])
  const [editingTaskLinks, setEditingTaskLinks] = useState<TaskLink[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [editingLinkUrl, setEditingLinkUrl] = useState('')
  const [editingLinkTitle, setEditingLinkTitle] = useState('')

  const [eventFormData, setEventFormData] = useState<EventFormData>({
    title: '',
    day: '',
    startTime: '',
    endTime: '',
    teacher: '',
    location: '',
    color: 'bg-blue-500',
    description: ''
  })

  const event = events.find(e => e.id === eventId)
  const tasks = event?.tasks?.sort((a, b) => a.order - b.order) || []

  const completedTasks = tasks.filter(task => task.completed)
  const pendingTasks = tasks.filter(task => !task.completed)

  // Update active tab when initialTab prop changes
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
    }
  }, [open, initialTab])

  // Initialize event form data when event changes
  useEffect(() => {
    if (event) {
      // Handle both old format (numbers) and new format (strings)
      const startTime = typeof event.startTime === 'string' 
        ? event.startTime 
        : typeof event.startTime === 'number' 
          ? '8:00 AM' // fallback for migration
          : '8:00 AM'
      
      const endTime = typeof event.endTime === 'string'
        ? event.endTime
        : typeof event.endTime === 'number'
          ? '9:00 AM' // fallback for migration
          : '9:00 AM'
      
      setEventFormData({
        title: event.title,
        day: event.day.toString(),
        startTime: startTime,
        endTime: endTime,
        teacher: event.teacher || '',
        location: event.location || '',
        color: event.color,
        description: event.description || ''
      })
    }
  }, [event])

  if (!open || !event) return null

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !eventId) return

    addTask(eventId, {
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      completed: false,
      createdAt: new Date(),
      documents: newTaskFiles.length > 0 ? newTaskFiles : undefined,
      links: newTaskLinks.length > 0 ? newTaskLinks : undefined
    })

    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskFiles([])
    setNewTaskLinks([])
    setNewLinkUrl('')
    setNewLinkTitle('')
    addToast({
      title: 'Task Added',
      description: 'New task has been added to this event.',
      variant: 'success'
    })
  }

  const handleToggleTask = (taskId: string) => {
    if (!eventId) return
    toggleTask(eventId, taskId)
  }

  const handleDeleteTask = (taskId: string) => {
    if (!eventId) return
    deleteTask(eventId, taskId)
    addToast({
      title: 'Task Deleted',
      description: 'Task has been removed from this event.',
      variant: 'success'
    })
  }

  const handleEditStart = (task: any) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
    setEditingDescription(task.description || '')
    setEditingTaskFiles(task.documents || [])
    setEditingTaskLinks(task.links || [])
  }

  const handleEditSave = () => {
    if (!editingTaskId || !eventId || !editingTitle.trim()) return

    updateTask(eventId, editingTaskId, {
      title: editingTitle.trim(),
      description: editingDescription.trim() || undefined,
      documents: editingTaskFiles.length > 0 ? editingTaskFiles : undefined,
      links: editingTaskLinks.length > 0 ? editingTaskLinks : undefined
    })

    setEditingTaskId(null)
    setEditingTitle('')
    setEditingDescription('')
    setEditingTaskFiles([])
    setEditingTaskLinks([])
    setEditingLinkUrl('')
    setEditingLinkTitle('')
    addToast({
      title: 'Task Updated',
      description: 'Task has been updated successfully.',
      variant: 'success'
    })
  }

  const handleEditCancel = () => {
    setEditingTaskId(null)
    setEditingTitle('')
    setEditingDescription('')
    setEditingTaskFiles([])
    setEditingTaskLinks([])
    setEditingLinkUrl('')
    setEditingLinkTitle('')
  }

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleEventFormChange = (field: keyof EventFormData, value: string) => {
    setEventFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!event) return

    // Validate times
    const startMinutes = parseTimeString(eventFormData.startTime)
    const endMinutes = parseTimeString(eventFormData.endTime)
    
    if (startMinutes >= endMinutes) {
      addToast({
        title: 'Invalid Time Range',
        description: 'End time must be after start time.',
        variant: 'destructive'
      })
      return
    }

    const eventData = {
      title: eventFormData.title,
      day: parseInt(eventFormData.day),
      startTime: eventFormData.startTime,
      endTime: eventFormData.endTime,
      teacher: eventFormData.teacher,
      location: eventFormData.location,
      color: eventFormData.color,
      description: eventFormData.description
    }

    updateEvent(event.id, eventData)
    addToast({
      title: 'Event Updated',
      description: 'Event has been updated successfully.',
      variant: 'success'
    })
  }

  const handleDeleteEvent = () => {
    if (!event) return
    
    deleteEvent(event.id)
    setShowDeleteConfirm(false)
    onClose()
    addToast({
      title: 'Event Deleted',
      description: 'Event has been deleted successfully.',
      variant: 'success'
    })
  }

  // Drag and drop handlers for task reordering
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnter = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    dragCounter.current++
    if (draggedTaskId && draggedTaskId !== taskId) {
      // Only highlight if dragging within the same list (pending/completed)
      const draggedTask = tasks.find(t => t.id === draggedTaskId)
      const targetTask = tasks.find(t => t.id === taskId)
      if (draggedTask && targetTask && draggedTask.completed === targetTask.completed) {
        setDragOverTaskId(taskId)
      }
    }
  }

  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverTaskId(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropTaskId: string) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragOverTaskId(null)
    
    if (!draggedTaskId || !eventId || draggedTaskId === dropTaskId) {
      setDraggedTaskId(null)
      return
    }

    // Get dragged and drop tasks to check if they're in the same list
    const draggedTask = tasks.find(t => t.id === draggedTaskId)
    const dropTask = tasks.find(t => t.id === dropTaskId)
    
    // Only allow reordering within the same list (pending/completed)
    if (!draggedTask || !dropTask || draggedTask.completed !== dropTask.completed) {
      setDraggedTaskId(null)
      return
    }

    // Calculate new order - only reorder tasks within the same completion status
    const sameStatusTasks = tasks.filter(t => t.completed === draggedTask.completed)
    
    const sameStatusOrder = sameStatusTasks.map(t => t.id)
    const draggedIndex = sameStatusOrder.indexOf(draggedTaskId)
    const dropIndex = sameStatusOrder.indexOf(dropTaskId)
    
    // Reorder: remove from old position and insert at new position
    const reorderedSameStatus = [...sameStatusOrder]
    reorderedSameStatus.splice(draggedIndex, 1)
    reorderedSameStatus.splice(dropIndex, 0, draggedTaskId)

    // Combine with other tasks (pending/completed stay separated)
    const finalOrder = draggedTask.completed 
      ? [...tasks.filter(t => !t.completed).map(t => t.id), ...reorderedSameStatus]
      : [...reorderedSameStatus, ...tasks.filter(t => t.completed).map(t => t.id)]

    reorderTasks(eventId, finalOrder)
    setDraggedTaskId(null)
    
    addToast({
      title: 'Task Reordered',
      description: 'Task has been moved successfully.',
      variant: 'success'
    })
  }

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setDraggedTaskId(null)
    setDragOverTaskId(null)
    dragCounter.current = 0
  }

  // File upload handlers for creating/editing tasks
  const handleFileUpload = async (files: FileList | null, isEditing: boolean) => {
    if (!files || files.length === 0) return

    const maxSize = 10 * 1024 * 1024 // 10MB limit

    const processFile = (file: File): Promise<TaskDocument> => {
      return new Promise((resolve, reject) => {
        if (file.size > maxSize) {
          reject(new Error(`File ${file.name} is too large (max 10MB)`))
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          
          // Detect markdown files by extension if MIME type is not set correctly
          let fileType = file.type
          if (!fileType || fileType === 'application/octet-stream') {
            if (file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.markdown')) {
              fileType = 'text/markdown'
            }
          }
          
          resolve({
            id: uuidv4(),
            name: file.name,
            type: fileType,
            size: file.size,
            data: dataUrl,
            uploadedAt: new Date()
          })
        }
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
        reader.readAsDataURL(file)
      })
    }

    try {
      const filePromises = Array.from(files).map(file => processFile(file))
      const newDocuments = await Promise.all(filePromises)

      if (isEditing) {
        setEditingTaskFiles(prev => [...prev, ...newDocuments])
      } else {
        setNewTaskFiles(prev => [...prev, ...newDocuments])
      }

      addToast({
        title: 'Files Added',
        description: `${files.length} file(s) added successfully.`,
        variant: 'success'
      })
    } catch (error: any) {
      addToast({
        title: 'Upload Failed',
        description: error.message || 'An error occurred while uploading the file.',
        variant: 'destructive'
      })
    }
  }

  const handleRemoveFile = (fileId: string, isEditing: boolean) => {
    if (isEditing) {
      setEditingTaskFiles(prev => prev.filter(f => f.id !== fileId))
    } else {
      setNewTaskFiles(prev => prev.filter(f => f.id !== fileId))
    }
  }

  const handleAddLink = (isEditing: boolean) => {
    const url = isEditing ? editingLinkUrl.trim() : newLinkUrl.trim()
    if (!url) return

    // Validate URL format
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      addToast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL.',
        variant: 'destructive'
      })
      return
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    const newLink: TaskLink = {
      id: uuidv4(),
      url: normalizedUrl,
      title: (isEditing ? editingLinkTitle : newLinkTitle).trim() || undefined,
      addedAt: new Date()
    }

    if (isEditing) {
      setEditingTaskLinks(prev => [...prev, newLink])
      setEditingLinkUrl('')
      setEditingLinkTitle('')
    } else {
      setNewTaskLinks(prev => [...prev, newLink])
      setNewLinkUrl('')
      setNewLinkTitle('')
    }
  }

  const handleRemoveLink = (linkId: string, isEditing: boolean) => {
    if (isEditing) {
      setEditingTaskLinks(prev => prev.filter(l => l.id !== linkId))
    } else {
      setNewTaskLinks(prev => prev.filter(l => l.id !== linkId))
    }
  }

  const handleLinkClick = (link: TaskLink) => {
    if (onViewLink) {
      // Find the task that contains this link
      const task = tasks.find(t => t.links?.some(l => l.id === link.id))
      if (task) {
        // Pass all documents and links from the same task
        onViewLink(link, task.documents, task.links)
      } else {
        // Fallback to single link
        onViewLink(link)
      }
    } else {
      // Fallback: open in new tab
      window.open(link.url, '_blank')
    }
  }

  const handleDeleteDocument = (taskId: string, documentId: string) => {
    if (!eventId) return
    const task = tasks.find(t => t.id === taskId)
    if (!task || !task.documents) return

    const updatedDocuments = task.documents.filter(doc => doc.id !== documentId)
    updateTask(eventId, taskId, {
      documents: updatedDocuments.length > 0 ? updatedDocuments : undefined
    })

    addToast({
      title: 'Document Removed',
      description: 'Document has been removed from the task.',
      variant: 'success'
    })
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

  const handleDocumentClick = (document: TaskDocument) => {
    if (onViewDocument) {
      // Find the task that contains this document
      const task = tasks.find(t => t.documents?.some(d => d.id === document.id))
      if (task) {
        // Pass all documents and links from the same task
        onViewDocument(document, task.documents, task.links)
      } else {
        // Fallback to single document
        onViewDocument(document, [document])
      }
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-300 shadow-lg z-[100] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Task count indicator */}
        {tasks.length > 0 && activeTab === 'tasks' && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <CheckSquare className="h-4 w-4" />
            <span>{completedTasks.length}/{tasks.length} completed</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ListTodo className="h-4 w-4" />
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'edit'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Edit className="h-4 w-4" />
            Edit Event
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'tasks' ? (
          <div className="space-y-4">
            {/* Add new task form */}
            <form onSubmit={handleAddTask} className="space-y-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Task description (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
              />
              
              {/* File attachments for new task */}
              <div className="space-y-2">
                <input
                  ref={newTaskFilesRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.bmp,.webp,.md,.markdown"
                  onChange={(e) => {
                    handleFileUpload(e.target.files, false)
                    if (e.target) e.target.value = ''
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => newTaskFilesRef.current?.click()}
                  className="w-full text-xs"
                >
                  <Paperclip className="h-3 w-3 mr-1" />
                  Attach Files
                </Button>
                
                {/* Display attached files */}
                {newTaskFiles.length > 0 && (
                  <div className="space-y-1">
                    {newTaskFiles.map((file) => {
                      const FileIcon = getFileIcon(file.type)
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
                        >
                          <FileIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFile(file.id, false)}
                            className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Link attachments for new task */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter URL..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddLink(false)
                      }
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddLink(false)}
                    className="text-xs"
                    disabled={!newLinkUrl.trim()}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Add Link
                  </Button>
                </div>
                {newLinkUrl && (
                  <input
                    type="text"
                    placeholder="Link title (optional)..."
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                )}
                {/* Display added links */}
                {newTaskLinks.length > 0 && (
                  <div className="space-y-1">
                    {newTaskLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
                      >
                        <LinkIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{link.title || link.url}</p>
                          <p className="text-xs text-gray-500 truncate">{link.url}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveLink(link.id, false)}
                          className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button type="submit" size="sm" disabled={!newTaskTitle.trim()} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </form>

            {/* Task statistics */}
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              Total: {tasks.length} | Completed: {completedTasks.length} | Pending: {pendingTasks.length}
            </div>

            {/* Pending tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Pending Tasks
                </h4>
                <div className="space-y-2">
                  {pendingTasks.map((task) => {
                    const isExpanded = expandedTasks.has(task.id)
                    const isEditing = editingTaskId === task.id
                    const isDragging = draggedTaskId === task.id
                    const isDragOver = dragOverTaskId === task.id
                    return (
                      <Card 
                        key={task.id} 
                        className={`p-3 transition-all cursor-move ${isDragOver ? 'border-2 border-blue-400 bg-blue-50' : ''} ${isDragging ? 'opacity-50' : ''}`}
                        draggable={!isEditing}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnter={(e) => handleDragEnter(e, task.id)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, task.id)}
                        onDragEnd={handleDragEnd}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Task title"
                            />
                            <textarea
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Task description (optional)"
                              rows={2}
                            />
                            
                            {/* File attachments for editing task */}
                            <div className="space-y-2">
                              <input
                                ref={editingTaskFilesRef}
                                type="file"
                                multiple
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.bmp,.webp,.md,.markdown"
                                onChange={(e) => {
                                  handleFileUpload(e.target.files, true)
                                  if (e.target) e.target.value = ''
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => editingTaskFilesRef.current?.click()}
                                className="w-full text-xs"
                              >
                                <Paperclip className="h-3 w-3 mr-1" />
                                Attach Files
                              </Button>
                              
                              {/* Display attached files */}
                              {editingTaskFiles.length > 0 && (
                                <div className="space-y-1">
                                  {editingTaskFiles.map((file) => {
                                    const FileIcon = getFileIcon(file.type)
                                    return (
                                      <div
                                        key={file.id}
                                        className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
                                      >
                                        <FileIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleRemoveFile(file.id, true)}
                                          className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Link attachments for editing task */}
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Enter URL..."
                                  value={editingLinkUrl}
                                  onChange={(e) => setEditingLinkUrl(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleAddLink(true)
                                    }
                                  }}
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddLink(true)}
                                  className="text-xs"
                                  disabled={!editingLinkUrl.trim()}
                                >
                                  <LinkIcon className="h-3 w-3 mr-1" />
                                  Add Link
                                </Button>
                              </div>
                              {editingLinkUrl && (
                                <input
                                  type="text"
                                  placeholder="Link title (optional)..."
                                  value={editingLinkTitle}
                                  onChange={(e) => setEditingLinkTitle(e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                              )}
                              {/* Display added links */}
                              {editingTaskLinks.length > 0 && (
                                <div className="space-y-1">
                                  {editingTaskLinks.map((link) => (
                                    <div
                                      key={link.id}
                                      className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
                                    >
                                      <LinkIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-700 truncate">{link.title || link.url}</p>
                                        <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemoveLink(link.id, true)}
                                        className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={handleEditSave} className="flex-1 flex items-center justify-center gap-1">
                                <Check className="h-3 w-3" />
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleEditCancel} className="flex-1 flex items-center justify-center gap-1">
                                <X className="h-3 w-3" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div 
                                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="flex items-center gap-3 flex-1">
                                <Checkbox
                                  checked={task.completed}
                                  onCheckedChange={() => handleToggleTask(task.id)}
                                />
                                <span 
                                  className="flex-1 cursor-pointer text-sm"
                                  onClick={() => handleEditStart(task)}
                                  onMouseDown={(e) => {
                                    // Prevent drag when clicking on text
                                    if (e.currentTarget === e.target) {
                                      e.stopPropagation()
                                    }
                                  }}
                                >
                                  {task.title}
                                </span>
                              </div>
                              {task.description && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleTaskExpansion(task.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="Toggle description"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditStart(task)
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteTask(task.id)
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            {task.description && isExpanded && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-600 whitespace-pre-wrap">{task.description}</p>
                                
                                {/* Documents section - display only, no upload */}
                                {task.documents && task.documents.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {task.documents.map((doc) => {
                                      const FileIcon = getFileIcon(doc.type)
                                      return (
                                        <div
                                          key={doc.id}
                                          className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer group"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDocumentClick(doc)
                                          }}
                                        >
                                          <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-700 truncate">{doc.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                {/* Links section */}
                                {task.links && task.links.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {task.links.map((link) => (
                                      <div
                                        key={link.id}
                                        className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer group"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleLinkClick(link)
                                        }}
                                      >
                                        <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-700 truncate">{link.title || link.url}</p>
                                          <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {!task.description && task.documents && task.documents.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                {/* Documents section even without description */}
                                <div className="space-y-1">
                                  {task.documents.map((doc) => {
                                    const FileIcon = getFileIcon(doc.type)
                                    return (
                                      <div
                                        key={doc.id}
                                        className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer group"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDocumentClick(doc)
                                        }}
                                      >
                                        <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-700 truncate">{doc.name}</p>
                                          <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            {!task.description && !task.documents && task.links && task.links.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                {/* Links section even without description */}
                                <div className="space-y-1">
                                  {task.links.map((link) => (
                                    <div
                                      key={link.id}
                                      className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer group"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleLinkClick(link)
                                      }}
                                    >
                                      <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-700 truncate">{link.title || link.url}</p>
                                        <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed Tasks
                </h4>
                <div className="space-y-2">
                  {completedTasks.map((task) => {
                    const isExpanded = expandedTasks.has(task.id)
                    const isEditing = editingTaskId === task.id
                    const isDragging = draggedTaskId === task.id
                    const isDragOver = dragOverTaskId === task.id
                    return (
                      <Card 
                        key={task.id} 
                        className={`p-3 opacity-75 transition-all cursor-move ${isDragOver ? 'border-2 border-blue-400 bg-blue-50' : ''} ${isDragging ? 'opacity-30' : ''}`}
                        draggable={!isEditing}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnter={(e) => handleDragEnter(e, task.id)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, task.id)}
                        onDragEnd={handleDragEnd}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 line-through"
                              placeholder="Task title"
                            />
                            <textarea
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Task description (optional)"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={handleEditSave} className="flex-1 flex items-center justify-center gap-1">
                                <Check className="h-3 w-3" />
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleEditCancel} className="flex-1 flex items-center justify-center gap-1">
                                <X className="h-3 w-3" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div 
                                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="flex items-center gap-3 flex-1">
                                <Checkbox
                                  checked={task.completed}
                                  onCheckedChange={() => handleToggleTask(task.id)}
                                />
                                <span 
                                  className="flex-1 cursor-pointer text-sm line-through"
                                  onClick={() => handleEditStart(task)}
                                  onMouseDown={(e) => {
                                    // Prevent drag when clicking on text
                                    if (e.currentTarget === e.target) {
                                      e.stopPropagation()
                                    }
                                  }}
                                >
                                  {task.title}
                                </span>
                              </div>
                              {task.description && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleTaskExpansion(task.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="Toggle description"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              <span className="text-xs text-gray-500">
                                {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditStart(task)
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteTask(task.id)
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            {task.description && isExpanded && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-600 whitespace-pre-wrap">{task.description}</p>
                                
                                {/* Documents section - display only, no upload */}
                                {task.documents && task.documents.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {task.documents.map((doc) => {
                                      const FileIcon = getFileIcon(doc.type)
                                      return (
                                        <div
                                          key={doc.id}
                                          className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer group"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDocumentClick(doc)
                                          }}
                                        >
                                          <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-700 truncate">{doc.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                {/* Links section */}
                                {task.links && task.links.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {task.links.map((link) => (
                                      <div
                                        key={link.id}
                                        className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer group"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleLinkClick(link)
                                        }}
                                      >
                                        <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-700 truncate">{link.title || link.url}</p>
                                          <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {!task.description && task.documents && task.documents.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                {/* Documents section even without description */}
                                <div className="space-y-1">
                                  {task.documents.map((doc) => {
                                    const FileIcon = getFileIcon(doc.type)
                                    return (
                                      <div
                                        key={doc.id}
                                        className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer group"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDocumentClick(doc)
                                        }}
                                      >
                                        <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-700 truncate">{doc.name}</p>
                                          <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            {!task.description && !task.documents && task.links && task.links.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                {/* Links section even without description */}
                                <div className="space-y-1">
                                  {task.links.map((link) => (
                                    <div
                                      key={link.id}
                                      className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer group"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleLinkClick(link)
                                      }}
                                    >
                                      <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-700 truncate">{link.title || link.url}</p>
                                        <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks yet. Add one above to get started!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Title</label>
                <input
                  type="text"
                  value={eventFormData.title}
                  onChange={(e) => handleEventFormChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Day</label>
                <select
                  value={eventFormData.day}
                  onChange={(e) => handleEventFormChange('day', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="">Select a day</option>
                  {DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <TimePicker
                    value={eventFormData.startTime}
                    onChange={(value) => handleEventFormChange('startTime', value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <TimePicker
                    value={eventFormData.endTime}
                    onChange={(value) => handleEventFormChange('endTime', value)}
                    minTime={eventFormData.startTime}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teacher</label>
                <input
                  type="text"
                  value={eventFormData.teacher}
                  onChange={(e) => handleEventFormChange('teacher', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter teacher name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={eventFormData.location}
                  onChange={(e) => handleEventFormChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={eventFormData.description}
                  onChange={(e) => handleEventFormChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleEventFormChange('color', color.value)}
                      className={`w-8 h-8 rounded-full ${color.value} ${
                        eventFormData.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button type="submit" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Update Event
                </Button>
              </div>
            </form>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                <Card className="w-full max-w-sm p-6 m-4">
                  <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete "{event.title}"? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteEvent}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}