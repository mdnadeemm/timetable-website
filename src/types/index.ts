export interface Task {
    id: string
    title: string
    completed: boolean
    order: number
    createdAt: Date
    completedAt?: Date
    description?: string
}

export interface Event {
    id: string
    title: string
    day: number // 0-6 (Sunday to Saturday)
    startTime: string // Time string in format "8:00 AM"
    endTime: string // Time string in format "9:00 AM"
    color: string
    teacher?: string
    location?: string
    description?: string
    tasks?: Task[]
}

export interface TimetableContextType {
    events: Event[]
    addEvent: (event: Omit<Event, 'id'>) => void
    updateEvent: (id: string, event: Partial<Event>) => void
    deleteEvent: (id: string) => void
    setEvents: (events: Event[]) => void
    searchTerm: string
    setSearchTerm: (term: string) => void
    darkMode: boolean
    setDarkMode: (dark: boolean) => void
    // Task management functions
    addTask: (eventId: string, task: Omit<Task, 'id' | 'order'>) => void
    updateTask: (eventId: string, taskId: string, updates: Partial<Task>) => void
    deleteTask: (eventId: string, taskId: string) => void
    toggleTask: (eventId: string, taskId: string) => void
    reorderTasks: (eventId: string, taskIds: string[]) => void
}

// Interface for import data validation
export interface ImportTaskData {
    id?: string
    title?: string
    completed?: boolean
    order?: number
    createdAt?: string | Date
    completedAt?: string | Date
    description?: string
}

export interface ImportEventData {
    title?: string
    day?: number | string
    startTime?: number | string
    endTime?: number | string
    teacher?: string
    location?: string
    color?: string
    description?: string
    tasks?: ImportTaskData[]
}
