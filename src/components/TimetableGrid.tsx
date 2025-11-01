import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Card } from './ui/card'
import { useTimetable } from '../context/TimetableContext'
import { useSettings } from '../context/SettingsContext'
import { TaskPanel } from './TaskPanel'
import { useToast } from './ui/toast'
import { CheckSquare, GripVertical } from 'lucide-react'
import type { TaskDocument, TaskLink } from '../types'
import { parseTimeString, generateZoomedTimeSlots, formatTimeWithZoom } from '../utils/timeUtils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const TimetableGrid: React.FC<{ 
  onViewDocument?: (document: TaskDocument, allDocuments?: TaskDocument[], allLinks?: TaskLink[]) => void
  onViewLink?: (link: TaskLink, allDocuments?: TaskDocument[], allLinks?: TaskLink[]) => void
}> = ({ onViewDocument, onViewLink }) => {
  const { events, allEvents, updateEvent, selectedWeek, setSelectedWeek } = useTimetable()
  const { settings } = useSettings()
  const { addToast } = useToast()
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)
  const [initialTab, setInitialTab] = useState<'tasks' | 'edit'>('tasks')
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  
  // Zoom state - 0 = 60min, 1 = 30min, 2 = 15min, 3 = 5min, 4 = 1min
  const [zoomLevel, setZoomLevel] = useState<number>(2) // Default: 15min intervals
  const [displayZoomLevel, setDisplayZoomLevel] = useState<number>(2) // Smooth display zoom level
  const [isZooming, setIsZooming] = useState<boolean>(false)
  const [zoomStartY, setZoomStartY] = useState<number>(0)
  const [zoomStartLevel, setZoomStartLevel] = useState<number>(2)
  const [hoveredHandle, setHoveredHandle] = useState<boolean>(false)
  const draggingRef = useRef<boolean>(false)
  const currentDisplayZoomRef = useRef<number>(2)

  // Always show 24 hours (0-24)
  const timeRange = useMemo(() => {
    return { startHour: 0, endHour: 24 }
  }, [])

  // Generate zoomed time slots based on display zoom level (for smooth transitions)
  const TIMES = useMemo(() => {
    // Use displayZoomLevel for smooth visual transitions, but use integer zoomLevel for actual slot generation
    const effectiveZoom = Math.round(displayZoomLevel)
    return generateZoomedTimeSlots(timeRange.startHour, timeRange.endHour, effectiveZoom)
  }, [timeRange.startHour, timeRange.endHour, displayZoomLevel])

  // Update current time every minute
  useEffect(() => {
    // Update immediately on mount
    setCurrentTime(new Date())
    
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Load zoom level from localStorage
  useEffect(() => {
    const savedZoom = localStorage.getItem('timetable-zoom-level')
    if (savedZoom) {
      try {
        const parsed = parseInt(savedZoom)
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) {
          setZoomLevel(parsed)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading zoom level:', error)
      }
    }
  }, [])

  // Save zoom level to localStorage
  useEffect(() => {
    localStorage.setItem('timetable-zoom-level', zoomLevel.toString())
  }, [zoomLevel])

  // Handle mouse move for zooming with smooth animation
  useEffect(() => {
    if (!isZooming) return
    
    let isDragging = true
    let rafId: number | null = null
    
    const updateVisuals = () => {
      if (isDragging && draggingRef.current) {
        // Update display zoom level from ref to trigger re-render
        // This ensures React re-renders on every frame for smooth updates
        setDisplayZoomLevel(currentDisplayZoomRef.current)
        rafId = requestAnimationFrame(updateVisuals)
      } else {
        rafId = null
      }
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !isDragging) return
      
      const deltaY = zoomStartY - e.clientY // Negative = zoom in, Positive = zoom out
      const sensitivity = 0.02 // Adjusted for smoother feel
      const zoomDelta = deltaY * sensitivity
      const newZoomLevel = Math.max(0, Math.min(4, zoomStartLevel + zoomDelta))
      
      // Clamp to bounds
      const clampedZoom = Math.max(0, Math.min(4, newZoomLevel))
      
      // Update ref immediately (always available for getSlotHeight)
      currentDisplayZoomRef.current = clampedZoom
      
      // Round to integer for actual zoom level (only update when crossing threshold)
      const roundedZoom = Math.round(clampedZoom)
      if (roundedZoom !== zoomLevel) {
        setZoomLevel(roundedZoom)
      }
    }

    const handleMouseUp = () => {
      isDragging = false
      draggingRef.current = false
      
      // Finalize zoom level to nearest integer
      const finalZoom = Math.round(currentDisplayZoomRef.current)
      setZoomLevel(finalZoom)
      setDisplayZoomLevel(finalZoom)
      currentDisplayZoomRef.current = finalZoom
      
      setIsZooming(false)
      setHoveredHandle(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      
      // Cancel animation frame
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    // Start animation loop immediately
    rafId = requestAnimationFrame(updateVisuals)
    
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp, { once: false })
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'

    return () => {
      isDragging = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }
  }, [isZooming, zoomStartY, zoomStartLevel, zoomLevel])

  // Handle zoom start (only from handle)
  const handleZoomStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    draggingRef.current = true
    setIsZooming(true)
    setZoomStartY(e.clientY)
    setZoomStartLevel(displayZoomLevel)
    currentDisplayZoomRef.current = displayZoomLevel
  }
  
  // Prevent zoom when clicking on timeline (not handle)
  const handleTimelineClick = (e: React.MouseEvent) => {
    // Only prevent if clicking directly on timeline, not on handle
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.zoom-handle')) {
      return
    }
    e.stopPropagation()
  }
  
  // Sync display zoom level with actual zoom level when not zooming
  useEffect(() => {
    if (!isZooming) {
      setDisplayZoomLevel(zoomLevel)
      currentDisplayZoomRef.current = zoomLevel
    }
  }, [zoomLevel, isZooming])
  
  // Initialize display zoom ref
  useEffect(() => {
    if (!isZooming) {
      currentDisplayZoomRef.current = displayZoomLevel
    }
  }, [])

  // Get slot height (consistent height for all slots) - use displayZoomLevel for smooth transitions
  const getSlotHeight = (): number => {
    // Adjust slot height based on zoom level - more slots = smaller height
    const baseHeight = 64
    const zoomMultiplier = [1.2, 1.0, 0.8, 0.6, 0.5] // Smaller for higher zoom
    
    // Use ref when zooming for immediate updates, otherwise use state
    const currentZoom = isZooming ? currentDisplayZoomRef.current : displayZoomLevel
    
    // Interpolate between zoom levels for smooth transitions
    const floorZoom = Math.floor(currentZoom)
    const ceilZoom = Math.min(4, Math.ceil(currentZoom))
    const fraction = currentZoom - floorZoom
    
    const floorMultiplier = zoomMultiplier[floorZoom] || 1.0
    const ceilMultiplier = zoomMultiplier[ceilZoom] || 1.0
    
    const interpolatedMultiplier = floorMultiplier + (ceilMultiplier - floorMultiplier) * fraction
    return baseHeight * interpolatedMultiplier
  }

  // Get current time position in the grid
  const currentTimePos = useMemo(() => {
    const now = currentTime
    const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday
    const currentHours = now.getHours()
    const currentMinutes = now.getMinutes()
    const currentTimeMinutes = currentHours * 60 + currentMinutes

    // Find which time slot the current time falls into
    let slotIndex = -1
    let positionInSlot = 0 // 0 = top of slot, 1 = bottom of slot

    for (let i = 0; i < TIMES.length; i++) {
      const slotStart = parseTimeString(TIMES[i])
      // Calculate end time: use next slot if available, otherwise add 30 minutes
      let slotEnd: number
      if (i + 1 < TIMES.length) {
        slotEnd = parseTimeString(TIMES[i + 1])
      } else {
        // Last slot: add 30 minutes as default duration
        slotEnd = slotStart + 30
      }

      if (slotStart === -1 || slotEnd === -1) continue

      // Check if current time falls within this slot (inclusive start, exclusive end)
      if (currentTimeMinutes >= slotStart && currentTimeMinutes < slotEnd) {
        slotIndex = i
        positionInSlot = (currentTimeMinutes - slotStart) / (slotEnd - slotStart)
        break
      }
    }

    // If not found, check if we're before first slot or after last slot
    if (slotIndex === -1 && TIMES.length > 0) {
      const firstSlot = parseTimeString(TIMES[0])
      const lastSlot = parseTimeString(TIMES[TIMES.length - 1])
      if (currentTimeMinutes < firstSlot) {
        // Before first slot - don't show indicator
      } else if (currentTimeMinutes >= lastSlot) {
        // After last slot - show at end of last slot
        slotIndex = TIMES.length - 1
        positionInSlot = 1
      }
    }

    return { slotIndex, positionInSlot, currentDay }
  }, [currentTime, TIMES])

  const getEventsForDayAndTime = (day: number, timeSlot: string) => {
    const slotMinutes = parseTimeString(timeSlot)
    return events.filter(event => {
      if (event.day !== day) return false
      
      const eventStartMinutes = parseTimeString(event.startTime)
      const eventEndMinutes = parseTimeString(event.endTime)
      
      // Include slot if it's within the event range (inclusive start, exclusive end)
      return slotMinutes >= eventStartMinutes && slotMinutes < eventEndMinutes
    })
  }

  const handleCellClick = (day: number, timeSlot: string) => {
    // eslint-disable-next-line no-console
    console.log(`Clicked on day ${day}, time ${timeSlot}`)
  }

  const handleEventClick = (event: React.MouseEvent, eventId: string) => {
    event.stopPropagation()
    // Toggle panel: if same event clicked again, close; if different event, switch
    if (selectedEventId === eventId) {
      setSelectedEventId(null)
    } else {
      setSelectedEventId(eventId)
      setInitialTab('tasks')
    }
  }

  const handleEventEdit = (event: React.MouseEvent, eventId: string) => {
    event.stopPropagation()
    event.preventDefault()
    // For right-click, open panel with edit tab
    setSelectedEventId(eventId)
    setInitialTab('edit')
  }

  const handlePanelClose = () => {
    setSelectedEventId(null)
  }

  const handleDragStart = (event: React.DragEvent, eventId: string) => {
    setDraggedEvent(eventId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', eventId)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (event: React.DragEvent, day: number, timeSlot: string) => {
    event.preventDefault()
    const eventId = event.dataTransfer.getData('text/plain')
    
    if (eventId && draggedEvent === eventId) {
      const eventToMove = events.find(e => e.id === eventId)
      if (eventToMove) {
        const startMinutes = parseTimeString(timeSlot)
        const duration = parseTimeString(eventToMove.endTime) - parseTimeString(eventToMove.startTime)
        const endMinutes = startMinutes + duration
        
        // Format end time
        const hours = Math.floor(endMinutes / 60)
        const mins = endMinutes % 60
        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
        const formattedEndTime = `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
        
        updateEvent(eventId, {
          day: day,
          startTime: timeSlot,
          endTime: formattedEndTime
        })
        
        addToast({
          title: 'Event Moved Successfully',
          description: `"${eventToMove.title}" has been moved to ${DAYS[day]} at ${timeSlot}.`,
          variant: 'success'
        })
      }
      setDraggedEvent(null)
    }
  }

  // Check for scheduling conflicts
  const getConflicts = () => {
    const conflicts: string[] = []
    const timeSlots: { [key: string]: number } = {}
    
    events.forEach(event => {
      const key = `${event.day}-${event.startTime}-${event.endTime}`
      timeSlots[key] = (timeSlots[key] || 0) + 1
    })
    
    Object.entries(timeSlots).forEach(([key, count]) => {
      if (count > 1) {
        conflicts.push(key)
      }
    })
    
    return conflicts
  }

  const conflicts = getConflicts()

  // Get all unique week numbers from all events (unfiltered) so all week buttons always show
  const availableWeeks = useMemo(() => {
    const weeks = new Set<number>()
    allEvents.forEach(event => {
      if (event.week) {
        weeks.add(event.week)
      }
    })
    return Array.from(weeks).sort((a, b) => a - b)
  }, [allEvents])

  const formatTooltip = (event: import('../types').Event) => {
    return `${event.title}
Teacher: ${event.teacher || 'Not specified'}
Location: ${event.location || 'Not specified'}
Time: ${event.startTime} - ${event.endTime}
Duration: ${Math.round((parseTimeString(event.endTime) - parseTimeString(event.startTime)) / 60 * 10) / 10} hour(s)
${event.description ? `Description: ${event.description}` : ''}`
  }

  return (
    <Card className="p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      <div className="flex flex-row relative flex-1 min-h-0">
        {/* Week Tabs on the left */}
        {availableWeeks.length > 0 && (
          <div className="flex flex-col gap-2 mr-4 flex-shrink-0" style={{ width: '100px' }}>
            <div className="sticky top-0 z-40 bg-background pb-1 mb-1">
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">Weeks</div>
            </div>
            <div className="flex flex-col gap-1">
              {availableWeeks.map(week => (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedWeek === week
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  Week {week}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col relative flex-1 min-h-0">
        {/* Single vertical zoom handle - fixed, doesn't scroll */}
        <div
          className={`zoom-handle absolute left-0 top-0 bottom-0 z-50 flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors duration-200 ${
            hoveredHandle ? 'bg-blue-500' : 'bg-muted/50 hover:bg-muted'
          } ${
            isZooming ? 'bg-blue-600 shadow-lg' : ''
          }`}
          style={{
            width: '16px',
            borderRight: '2px solid',
            borderColor: hoveredHandle || isZooming ? 'rgb(59 130 246)' : 'rgb(229 231 235)',
            borderRadius: '0 4px 4px 0',
            transition: 'background-color 0.2s ease-out',
            top: '52px', // Account for header height
            bottom: '0px'
          }}
          onMouseEnter={() => {
            if (!isZooming) {
              setHoveredHandle(true)
            }
          }}
          onMouseLeave={() => {
            if (!isZooming) {
              setHoveredHandle(false)
            }
          }}
          onMouseDown={handleZoomStart}
          title={`Drag handle to zoom time scale (Current: ${Math.round(displayZoomLevel) === 0 ? '60min' : Math.round(displayZoomLevel) === 1 ? '30min' : Math.round(displayZoomLevel) === 2 ? '15min' : Math.round(displayZoomLevel) === 3 ? '5min' : '1min'} intervals)`}
        >
          <div className="flex flex-col items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <GripVertical 
                key={i}
                className={`h-4 w-4 transition-colors duration-200 ${
                  hoveredHandle || isZooming ? 'text-white' : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Fixed Header row */}
        <div className="sticky top-0 z-40 bg-background pb-1 mb-1 flex-shrink-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid gap-1 relative" style={{
                display: 'grid',
                gridTemplateColumns: '64px repeat(7, 1fr)'
              }}>
                <div className="h-10 relative">
                  {/* Zoom indicator at top - only visible when dragging */}
                  {isZooming && (
                    <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                      <div className="grid grid-cols-[1fr_auto] gap-2 items-center h-full">
                        {/* First column - two rows */}
                        <div className="flex flex-col justify-center items-start">
                          <div className="leading-tight font-semibold">
                            {Math.round(displayZoomLevel) === 0 ? '60min' : Math.round(displayZoomLevel) === 1 ? '30min' : Math.round(displayZoomLevel) === 2 ? '15min' : Math.round(displayZoomLevel) === 3 ? '5min' : '1min'}
                          </div>
                          <div className="text-[10px] leading-tight opacity-90">
                            intervals
                          </div>
                        </div>
                        {/* Second column - icons */}
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          {Math.round(displayZoomLevel) < 4 && (
                            <span className="text-[12px] leading-none">↑</span>
                          )}
                          {Math.round(displayZoomLevel) > 0 && (
                            <span className="text-[12px] leading-none">↓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {DAYS.map((day) => (
                  <div 
                    key={day} 
                    className="h-10 bg-muted flex items-center justify-center font-semibold text-sm text-muted-foreground rounded"
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Time slots and events */}
        <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0 custom-scrollbar">
          <div className="min-w-[800px] pl-4">
            {/* Time slots and events */}
            {TIMES.map((time, timeIndex) => {
              const isCurrentTimeSlot = currentTimePos.slotIndex === timeIndex
              const showCurrentTimeIndicator = isCurrentTimeSlot && currentTimePos.slotIndex !== -1
              
              return (
                <div 
                  key={timeIndex} 
                  className="grid gap-1 mb-1 relative" 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px repeat(7, 1fr)',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  {/* Current time indicator line */}
                  {showCurrentTimeIndicator && (
                    <div 
                      className="absolute left-0 right-0 z-[60] pointer-events-none"
                      style={{
                        top: `${currentTimePos.positionInSlot * getSlotHeight()}px`,
                        transform: 'translateY(-50%)',
                        height: '2px'
                      }}
                    >
                      <div className="flex items-center h-full w-full">
                        {/* Space for handle */}
                        <div className="w-4 flex items-center justify-center h-full">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-md"></div>
                        </div>
                        {/* Indicator dot on time label */}
                        {settings.showTimeSlots && (
                          <div className="w-16 flex items-center justify-center h-full">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg border-2 border-white"></div>
                          </div>
                        )}
                        {!settings.showTimeSlots && (
                          <div className="w-16 h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-md"></div>
                          </div>
                        )}
                        
                        {/* Horizontal line across all day columns */}
                        <div className="flex-1 relative h-full">
                          <div className="absolute left-0 right-0 top-0 h-1 bg-red-500 shadow-lg opacity-90"></div>
                          {/* Current time label */}
                          <div className="absolute left-2 -top-6 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-10 border border-red-600">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Time label - sticky when scrolling horizontally */}
                  <div 
                    className={`sticky z-30 bg-card border flex items-center justify-center text-xs font-medium text-muted-foreground rounded relative ${
                      isCurrentTimeSlot ? 'bg-red-50 border-red-300' : 'border-border'
                    }`}
                    style={{ 
                      backgroundColor: isCurrentTimeSlot ? 'rgb(254 242 242)' : undefined,
                      height: `${getSlotHeight()}px`,
                      left: '16px',
                      transition: isZooming ? 'none' : 'height 0.15s ease-out'
                    }}
                    onClick={handleTimelineClick}
                  >
                    {/* Time display */}
                    {settings.showTimeSlots ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="font-semibold">{formatTimeWithZoom(time, Math.round(displayZoomLevel))}</div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative">
                        {isCurrentTimeSlot && (
                          <div className="absolute top-1/2 right-1 transform -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse z-10"></div>
                        )}
                      </div>
                    )}
                    
                    {/* Current time indicator dot */}
                    {isCurrentTimeSlot && settings.showTimeSlots && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse z-10"></div>
                    )}
                  </div>
                  
                  {/* Day columns */}
                  {DAYS.map((_, dayIndex) => {
                    const eventsAtTime = getEventsForDayAndTime(dayIndex, time)
                    const mainEvent = eventsAtTime[0] // Get the first event at this time
                    const isEventStart = mainEvent && mainEvent.startTime === time
                    
                    // Calculate event height based on actual slots spanned
                    let eventHeight = 0
                    if (isEventStart && mainEvent) {
                      const startIndex = TIMES.indexOf(mainEvent.startTime)
                      const endIndex = TIMES.indexOf(mainEvent.endTime)
                      
                      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                        // Calculate height: include slots from startIndex to endIndex - 1 (exclusive end)
                        // Event ends at the beginning of the end slot
                        const slotsSpanned = endIndex - startIndex // Don't include end slot
                        const gapsBetween = slotsSpanned - 1
                        const slotHeight = getSlotHeight()
                        eventHeight = slotsSpanned * slotHeight + gapsBetween * 4
                      }
                    }
                    
                    const eventDuration = mainEvent ? (parseTimeString(mainEvent.endTime) - parseTimeString(mainEvent.startTime)) / 60 : 0
                    const isCurrentDay = currentTimePos.currentDay === dayIndex
                    
                    return (
                      <div
                        key={`${dayIndex}-${timeIndex}`}
                        className={`bg-card border border-border hover:bg-accent/50 cursor-pointer transition-colors relative rounded ${
                          isCurrentTimeSlot && isCurrentDay ? 'bg-red-50/30' : ''
                        }`}
                        style={{ 
                          height: `${getSlotHeight()}px`,
                          transition: isZooming ? 'none' : 'height 0.15s ease-out',
                          overflow: 'visible'
                        }}
                        onClick={() => handleCellClick(dayIndex, time)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, dayIndex, time)}
                      >
                        {/* Render event if this is the start time */}
                        {isEventStart && mainEvent && (
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, mainEvent.id)}
                            onClick={(e) => handleEventClick(e, mainEvent.id)}
                            onContextMenu={(e) => handleEventEdit(e, mainEvent.id)}
                            onMouseEnter={() => setHoveredEvent(mainEvent.id)}
                            onMouseLeave={() => setHoveredEvent(null)}
                            className={`${mainEvent.color} text-white p-2 rounded shadow-md cursor-pointer hover:opacity-90 transition-all duration-200 absolute flex flex-col justify-center text-center hover:scale-105 z-10`}
                            style={{
                              top: '4px',
                              left: '4px',
                              right: '4px',
                              height: `${eventHeight}px`,
                              minHeight: '60px',
                              zIndex: draggedEvent === mainEvent.id ? 50 : 10
                            }}
                            title={formatTooltip(mainEvent)}
                          >
                            <div className="font-bold text-sm leading-tight">{mainEvent.title}</div>
                            
                            {/* Task count indicator */}
                            {mainEvent.tasks && mainEvent.tasks.length > 0 && (
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <CheckSquare className="h-3 w-3" />
                                <span className="text-xs">
                                  {mainEvent.tasks.filter(t => t.completed).length}/{mainEvent.tasks.length}
                                </span>
                              </div>
                            )}
                            
                            {/* Always show more details for better UX */}
                            {(hoveredEvent === mainEvent.id || eventDuration > 1) && (
                              <>
                                {settings.showTeacherNames && mainEvent.teacher && (
                                  <div className="text-xs opacity-90 mt-1">{mainEvent.teacher}</div>
                                )}
                                {settings.showLocations && mainEvent.location && (
                                  <div className="text-xs opacity-75">{mainEvent.location}</div>
                                )}
                                {settings.showTimeSlots && (
                                  <div className="text-xs opacity-80 mt-1 font-medium">
                                    {mainEvent.startTime} - {mainEvent.endTime}
                                  </div>
                                )}
                                {settings.showDescriptions && mainEvent.description && (
                                  <div className="text-xs opacity-75 mt-1 italic line-clamp-2">{mainEvent.description}</div>
                                )}
                              </>
                            )}
                            
                            {eventDuration <= 1 && settings.showTimeSlots && (
                              <div className="text-xs opacity-60 mt-1">
                                {mainEvent.startTime} - {mainEvent.endTime}
                              </div>
                            )}
                            
                            <div className="text-xs opacity-60 mt-1 italic">
                              {hoveredEvent === mainEvent.id ? 'Left click: Tasks • Right click: Edit' : 'Click to view tasks'}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
        </div>
      </div>
      
      {/* Statistics and Conflicts - Scrollable container */}
      <div className="mt-4 overflow-y-auto flex-shrink-0 custom-scrollbar" style={{ maxHeight: '200px' }}>
        {/* Statistics */}
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold mb-3">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Events</div>
              <div className="font-semibold text-lg">{events.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">This Week</div>
              <div className="font-semibold text-lg">{events.filter(e => e.day >= 1 && e.day <= 5).length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Conflicts</div>
              <div className={`font-semibold text-lg ${conflicts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {conflicts.length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Utilization</div>
              <div className="font-semibold text-lg">{Math.round((events.length / (12 * 7)) * 100)}%</div>
            </div>
          </div>
        </div>

        {/* Conflict Warning */}
        {conflicts.length > 0 && settings.enableConflictWarnings && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">
              ⚠️ Scheduling Conflicts Detected
            </h4>
            <p className="text-sm text-yellow-700">
              You have {conflicts.length} time slot(s) with multiple events. 
              Consider adjusting your schedule to avoid conflicts.
            </p>
          </div>
        )}
      </div>

      {/* Task Panel */}
      <TaskPanel
        open={!!selectedEventId}
        onClose={handlePanelClose}
        eventId={selectedEventId}
        initialTab={initialTab}
        onViewDocument={onViewDocument}
        onViewLink={onViewLink}
      />
    </Card>
  )
}
