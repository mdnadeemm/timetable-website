import { useState, useEffect } from 'react'

const DEFAULT_TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM'
]

export const useTimeSlots = (): string[] => {
  const [timeSlots, setTimeSlots] = useState<string[]>(DEFAULT_TIMES)

  useEffect(() => {
    const savedTimeSlots = localStorage.getItem('timetable-time-slots')
    if (savedTimeSlots) {
      try {
        const parsed = JSON.parse(savedTimeSlots)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimeSlots(parsed)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading time slots:', error)
      }
    }
  }, [])

  // Listen for storage changes to update when time slots are modified
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'timetable-time-slots') {
        try {
          const parsed = JSON.parse(e.newValue || '[]')
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTimeSlots(parsed)
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error parsing time slots from storage:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      const savedTimeSlots = localStorage.getItem('timetable-time-slots')
      if (savedTimeSlots) {
        try {
          const parsed = JSON.parse(savedTimeSlots)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTimeSlots(parsed)
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error parsing time slots:', error)
        }
      }
    }

    window.addEventListener('time-slots-updated', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('time-slots-updated', handleCustomStorageChange)
    }
  }, [])

  return timeSlots
}

export const getTimeSlots = (): string[] => {
  const savedTimeSlots = localStorage.getItem('timetable-time-slots')
  if (savedTimeSlots) {
    try {
      const parsed = JSON.parse(savedTimeSlots)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading time slots:', error)
    }
  }
  return DEFAULT_TIMES
}
