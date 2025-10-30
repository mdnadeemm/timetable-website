import { Event } from '../types'

// Parse time string (e.g., "8:00 AM") to minutes since midnight
export const parseTimeString = (timeStr: string): number => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return -1
  
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3].toUpperCase()
  
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  
  return hours * 60 + minutes
}

// Format minutes since midnight to time string (e.g., "8:00 AM")
export const formatTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
}

// Generate all unique time slots from events
export const generateTimeSlotsFromEvents = (events: Event[]): string[] => {
  const timeSet = new Set<string>()
  
  events.forEach(event => {
    if (event.startTime) timeSet.add(event.startTime)
    if (event.endTime) timeSet.add(event.endTime)
  })
  
  // Convert to array and sort by time
  const times = Array.from(timeSet)
  return times.sort((a, b) => {
    const timeA = parseTimeString(a)
    const timeB = parseTimeString(b)
    return timeA - timeB
  })
}

// Find the index of a time in the slots array
export const getTimeSlotIndex = (time: string, slots: string[]): number => {
  return slots.indexOf(time)
}

// Generate time slots based on zoom level and time range
export const generateZoomedTimeSlots = (
  startHour: number = 6,
  endHour: number = 24,
  zoomLevel: number = 2 // 0 = 60min, 1 = 30min, 2 = 15min, 3 = 5min, 4 = 1min
): string[] => {
  const intervals = [60, 30, 15, 5, 1] // minutes
  const interval = intervals[Math.min(zoomLevel, intervals.length - 1)]
  
  const slots: string[] = []
  const startMinutes = startHour * 60
  const endMinutes = endHour * 60
  
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += interval) {
    slots.push(formatTimeString(minutes))
  }
  
  return slots
}

// Format time string with appropriate detail based on zoom level
export const formatTimeWithZoom = (timeStr: string, zoomLevel: number): string => {
  const minutes = parseTimeString(timeStr)
  if (minutes === -1) return timeStr
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  
  // Show minutes detail based on zoom level
  if (zoomLevel >= 3) {
    // High zoom: show minutes prominently
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
  } else if (zoomLevel >= 2) {
    // Medium zoom: show minutes if not :00
    if (mins === 0) {
      return `${displayHours}:00 ${period}`
    } else {
      return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
    }
  } else {
    // Low zoom: show only hours or :00/:30
    if (mins === 0) {
      return `${displayHours}:00 ${period}`
    } else if (mins === 30) {
      return `${displayHours}:30 ${period}`
    } else {
      return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
    }
  }
}

// Convert old event format (with number indices) to new format (with time strings)
export const migrateEventToTimeStrings = (event: any, oldSlots: string[]): Event => {
  if (typeof event.startTime === 'string' && typeof event.endTime === 'string') {
    // Already in new format
    return event as Event
  }

  // Convert from old format
  const startTimeIndex = typeof event.startTime === 'number' ? event.startTime : parseInt(event.startTime)
  const endTimeIndex = typeof event.endTime === 'number' ? event.endTime : parseInt(event.endTime)

  return {
    ...event,
    startTime: oldSlots[startTimeIndex] || '8:00 AM',
    endTime: oldSlots[endTimeIndex] || '9:00 AM'
  }
}
