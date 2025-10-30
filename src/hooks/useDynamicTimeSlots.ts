import { useState, useEffect, useMemo } from 'react'
import type { Event } from '../types'
import { generateTimeSlotsFromEvents, migrateEventToTimeStrings, parseTimeString, formatTimeString } from '../utils/timeUtils'

const DEFAULT_TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM'
]

export const useDynamicTimeSlots = (events: Event[]): string[] => {
  const [migrated, setMigrated] = useState(false)

  // Migrate old events on mount
  useEffect(() => {
    const needsMigration = events.some(event => 
      typeof event.startTime === 'number' || typeof event.endTime === 'number'
    )
    
    if (needsMigration && !migrated) {
      // Migrate events in localStorage
      const savedEvents = localStorage.getItem('timetable-events')
      if (savedEvents) {
        try {
          const parsed = JSON.parse(savedEvents)
          const migratedEvents = parsed.map((event: any) => 
            migrateEventToTimeStrings(event, DEFAULT_TIMES)
          )
          localStorage.setItem('timetable-events', JSON.stringify(migratedEvents))
          window.dispatchEvent(new Event('storage'))
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error migrating events:', error)
        }
      }
      setMigrated(true)
    }
  }, [events, migrated])

  // Generate slots from events
  const dynamicSlots = useMemo(() => {
    const slots = generateTimeSlotsFromEvents(events)
    
    // If no events, return default slots
    if (slots.length === 0) {
      return DEFAULT_TIMES
    }
    
    // Ensure we have at least some reasonable range
    // Add slots before first and after last if needed
    const firstTime = parseTimeString(slots[0])
    const lastTime = parseTimeString(slots[slots.length - 1])
    
    const startHour = Math.floor(firstTime / 60)
    const endHour = Math.ceil(lastTime / 60)
    
    // Generate slots from start to end in 30-minute increments
    const allSlots: string[] = []
    for (let hour = Math.max(6, startHour - 1); hour <= Math.min(23, endHour + 1); hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeMinutes = hour * 60 + min
        const formatted = formatTimeString(timeMinutes)
        allSlots.push(formatted)
      }
    }
    
    // Merge with event-based slots and sort
    const merged = [...new Set([...slots, ...allSlots])].sort((a, b) => {
      return parseTimeString(a) - parseTimeString(b)
    })
    
    return merged
  }, [events])

  return dynamicSlots
}
