export interface TaskDocument {
    id: string
    name: string
    type: string // MIME type
    size: number // file size in bytes
    data: string // base64 data URL or blob URL
    uploadedAt: Date
}

export interface TaskLink {
    id: string
    url: string
    title?: string
    addedAt: Date
}

export interface Task {
    id: string
    title: string
    completed: boolean
    order: number
    createdAt: Date
    completedAt?: Date
    description?: string
    documents?: TaskDocument[]
    links?: TaskLink[]
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
    week?: number // Optional week number (1, 2, 3, etc.)
}

export interface TimetableContextType {
    events: Event[]
    allEvents: Event[] // All events (unfiltered) for week button calculation
    addEvent: (event: Omit<Event, 'id'>) => void
    updateEvent: (id: string, event: Partial<Event>) => void
    deleteEvent: (id: string) => void
    setEvents: (events: Event[]) => void
    searchTerm: string
    setSearchTerm: (term: string) => void
    darkMode: boolean
    setDarkMode: (dark: boolean) => void
    selectedWeek: number | null // null = show all weeks
    setSelectedWeek: (week: number | null) => void
    description: string
    setDescription: (description: string) => void
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
    documents?: Array<{
        id?: string
        name?: string
        type?: string
        size?: number
        data?: string
        uploadedAt?: string | Date
    }>
    links?: Array<{
        id?: string
        url?: string
        title?: string
        addedAt?: string | Date
    }>
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
