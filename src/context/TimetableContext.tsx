import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Event, Task, TimetableContextType } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { migrateEventToTimeStrings } from '../utils/timeUtils'

const DEFAULT_TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM'
]

const TimetableContext = createContext<TimetableContextType | undefined>(undefined)

// Sample events for initial load
const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'Mathematics',
    day: 1,
    startTime: '8:00 AM',
    endTime: '9:00 AM',
    color: 'bg-blue-500',
    teacher: 'Dr. Smith',
    location: 'Room 101',
    description: 'Advanced Calculus'
  },
  {
    id: '2',
    title: 'Physics',
    day: 2,
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    color: 'bg-green-500',
    teacher: 'Dr. Johnson',
    location: 'Lab 2',
    description: 'Quantum Mechanics'
  },
  {
    id: '3',
    title: 'Chemistry',
    day: 3,
    startTime: '12:00 PM',
    endTime: '1:00 PM',
    color: 'bg-purple-500',
    teacher: 'Dr. Brown',
    location: 'Room 203',
    description: 'Organic Chemistry'
  },
  {
    id: '4',
    title: 'Computer Science',
    day: 1,
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    color: 'bg-orange-500',
    teacher: 'Prof. Wilson',
    location: 'Computer Lab',
    description: 'Data Structures'
  },
  {
    id: '5',
    title: 'English Literature',
    day: 4,
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    color: 'bg-pink-500',
    teacher: 'Ms. Davis',
    location: 'Room 105',
    description: 'Shakespeare Studies'
  }
]

export const TimetableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [description, setDescription] = useState<string>('')

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('timetable-events')
    const savedDarkMode = localStorage.getItem('timetable-dark-mode')
    
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents)
        // Migrate old events if needed and convert task dates
        const migratedEvents = parsed.map((event: any) => {
          let migratedEvent = event
          if (typeof event.startTime === 'number' || typeof event.endTime === 'number') {
            migratedEvent = migrateEventToTimeStrings(event, DEFAULT_TIMES)
          }
          // Convert task date strings to Date objects if needed
          if (migratedEvent.tasks && Array.isArray(migratedEvent.tasks)) {
            migratedEvent = {
              ...migratedEvent,
              tasks: migratedEvent.tasks.map((task: any) => ({
                ...task,
                createdAt: typeof task.createdAt === 'string' ? new Date(task.createdAt) : task.createdAt,
                completedAt: task.completedAt && typeof task.completedAt === 'string' 
                  ? new Date(task.completedAt) 
                  : task.completedAt,
                documents: task.documents && Array.isArray(task.documents)
                  ? task.documents.map((doc: any) => ({
                      ...doc,
                      uploadedAt: typeof doc.uploadedAt === 'string' ? new Date(doc.uploadedAt) : doc.uploadedAt
                    }))
                  : task.documents,
                links: task.links && Array.isArray(task.links)
                  ? task.links.map((link: any) => ({
                      ...link,
                      addedAt: typeof link.addedAt === 'string' ? new Date(link.addedAt) : link.addedAt
                    }))
                  : task.links
              }))
            }
          }
          return migratedEvent
        })
        setEvents(migratedEvents)
        // Save migrated events back if migration occurred
        if (migratedEvents.some((_e: any, i: number) => 
          typeof parsed[i].startTime === 'number' || typeof parsed[i].endTime === 'number'
        )) {
          localStorage.setItem('timetable-events', JSON.stringify(migratedEvents))
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading events from localStorage:', error)
        setEvents(sampleEvents)
      }
    } else {
      setEvents(sampleEvents)
    }

    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  // Save events to localStorage whenever events change
  useEffect(() => {
    localStorage.setItem('timetable-events', JSON.stringify(events))
  }, [events])

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('timetable-dark-mode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const addEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: uuidv4()
    }
    setEvents(prev => [...prev, newEvent])
  }

  const updateEvent = (id: string, eventData: Partial<Event>) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === id ? { ...event, ...eventData } : event
      )
    )
  }

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id))
  }

  // Task management functions
  const addTask = (eventId: string, taskData: Omit<Task, 'id' | 'order'>) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const currentTasks = event.tasks || []
        const newTask: Task = {
          ...taskData,
          id: uuidv4(),
          order: currentTasks.length
        }
        return {
          ...event,
          tasks: [...currentTasks, newTask]
        }
      }
      return event
    }))
  }

  const updateTask = (eventId: string, taskId: string, updates: Partial<Task>) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const currentTasks = event.tasks || []
        const updatedTasks = currentTasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
        return {
          ...event,
          tasks: updatedTasks
        }
      }
      return event
    }))
  }

  const deleteTask = (eventId: string, taskId: string) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const currentTasks = event.tasks || []
        const filteredTasks = currentTasks.filter(task => task.id !== taskId)
        // Reorder remaining tasks
        const reorderedTasks = filteredTasks.map((task, index) => ({
          ...task,
          order: index
        }))
        return {
          ...event,
          tasks: reorderedTasks
        }
      }
      return event
    }))
  }

  const toggleTask = (eventId: string, taskId: string) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const currentTasks = event.tasks || []
        const updatedTasks = currentTasks.map(task =>
          task.id === taskId 
            ? { 
                ...task, 
                completed: !task.completed,
                completedAt: !task.completed ? new Date() : undefined
              } 
            : task
        )
        return {
          ...event,
          tasks: updatedTasks
        }
      }
      return event
    }))
  }

  const reorderTasks = (eventId: string, taskIds: string[]) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const currentTasks = event.tasks || []
        const taskMap = new Map(currentTasks.map(task => [task.id, task]))
        const reorderedTasks = taskIds.map((taskId, index) => {
          const task = taskMap.get(taskId)
          return task ? { ...task, order: index } : null
        }).filter(Boolean) as Task[]
        
        return {
          ...event,
          tasks: reorderedTasks
        }
      }
      return event
    }))
  }

  // Auto-select Week 1 if there are week-based events and no week is selected
  useEffect(() => {
    if (selectedWeek === null) {
      const weekEvents = events.filter(event => event.week !== undefined && event.week !== null)
      if (weekEvents.length > 0) {
        const weeks = new Set(weekEvents.map(e => e.week).filter((w): w is number => w !== undefined))
        const sortedWeeks = Array.from(weeks).sort((a, b) => a - b)
        if (sortedWeeks.length > 0) {
          setSelectedWeek(sortedWeeks[0]) // Select the first available week (usually Week 1)
        }
      }
    }
  }, [events, selectedWeek])

  // Filter events based on search term and selected week
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.teacher?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Only show events for the selected week
    // If selectedWeek is null, show all events (including those without a week)
    // If selectedWeek is set, only show events from that specific week
    const matchesWeek = selectedWeek === null 
      ? true // Show all events when no week is selected
      : event.week === selectedWeek // Only show events from the selected week
    
    return matchesSearch && matchesWeek
  })

  // Load description from localStorage
  useEffect(() => {
    const savedDescription = localStorage.getItem('timetable-description')
    if (savedDescription) {
      setDescription(savedDescription)
    }
  }, [])

  // Save description to localStorage
  useEffect(() => {
    if (description) {
      localStorage.setItem('timetable-description', description)
    }
  }, [description])

  const value: TimetableContextType = {
    events: filteredEvents,
    allEvents: events, // Expose all events (unfiltered) for week button calculation
    addEvent,
    updateEvent,
    deleteEvent,
    setEvents,
    searchTerm,
    setSearchTerm,
    darkMode,
    setDarkMode,
    selectedWeek,
    setSelectedWeek,
    description,
    setDescription,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    reorderTasks
  }

  return (
    <TimetableContext.Provider value={value}>
      {children}
    </TimetableContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components */
export const useTimetable = (): TimetableContextType => {
  const context = useContext(TimetableContext)
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider')
  }
  return context
}
