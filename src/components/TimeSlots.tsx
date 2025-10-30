import React, { useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Clock, Zap, Calendar, Plus, Sun, Moon, Coffee, GraduationCap } from 'lucide-react'
import { useTimetable } from '../context/TimetableContext'
import { useToast } from './ui/toast'
import { AddEventDialog } from './AddEventDialog'
import { formatTimeString } from '../utils/timeUtils'

interface TimePreset {
  name: string
  startTime: string
  endTime: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const TIME_PRESETS: TimePreset[] = [
  { name: 'Morning', startTime: '8:00 AM', endTime: '12:00 PM', icon: Sun, description: '8 AM - 12 PM' },
  { name: 'Afternoon', startTime: '12:00 PM', endTime: '5:00 PM', icon: Sun, description: '12 PM - 5 PM' },
  { name: 'Evening', startTime: '5:00 PM', endTime: '9:00 PM', icon: Moon, description: '5 PM - 9 PM' },
  { name: 'Full Day', startTime: '9:00 AM', endTime: '5:00 PM', icon: Calendar, description: '9 AM - 5 PM' },
  { name: 'Short Session', startTime: '9:00 AM', endTime: '10:30 AM', icon: Clock, description: '1.5 hours' },
  { name: 'Long Session', startTime: '10:00 AM', endTime: '1:00 PM', icon: Clock, description: '3 hours' },
]

const EVENT_TEMPLATES = [
  { name: 'Class', icon: GraduationCap, duration: 60, color: 'bg-blue-500' },
  { name: 'Meeting', icon: Calendar, duration: 60, color: 'bg-green-500' },
  { name: 'Break', icon: Coffee, duration: 15, color: 'bg-orange-500' },
  { name: 'Study', icon: GraduationCap, duration: 120, color: 'bg-purple-500' },
]

export const TimeSlots: React.FC = () => {
  const { addEvent } = useTimetable()
  const { addToast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [presetData, setPresetData] = useState<{ startTime?: string; endTime?: string; title?: string; color?: string } | null>(null)

  const handleQuickEvent = (preset: TimePreset) => {
    setIsAddDialogOpen(true)
    setPresetData({
      startTime: preset.startTime,
      endTime: preset.endTime,
    })
  }

  const handleTemplateEvent = (template: typeof EVENT_TEMPLATES[0]) => {
    setIsAddDialogOpen(true)
    const now = new Date()
    const startHour = now.getHours()
    const startMinutes = now.getMinutes()
    
    // Round to nearest 30 minutes
    const roundedMinutes = Math.round(startMinutes / 30) * 30
    let adjustedHour = startHour
    let finalMinutes = roundedMinutes
    
    if (roundedMinutes === 60) {
      adjustedHour = startHour + 1
      finalMinutes = 0
    }
    
    // Calculate start time in minutes since midnight
    const startTimeMinutes = adjustedHour * 60 + finalMinutes
    const startTime = formatTimeString(startTimeMinutes)
    
    // Calculate end time
    const endTimeMinutes = startTimeMinutes + template.duration
    const endTime = formatTimeString(endTimeMinutes)

    setPresetData({
      startTime,
      endTime,
      title: template.name,
      color: template.color,
    })
  }

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <Zap className="h-4 w-4 flex-shrink-0 text-primary" />
        <h2 className="text-base font-semibold truncate">Quick Actions</h2>
      </div>

      {/* Quick Time Presets */}
      <Card className="p-4 min-w-0">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Quick Time Presets</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-3 break-words">
          Select a time range to quickly create an event
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TIME_PRESETS.map((preset) => {
            const Icon = preset.icon
            return (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent(preset)}
                className="flex flex-col items-center justify-center h-auto py-3 px-2 text-xs hover:bg-accent"
              >
                <Icon className="h-4 w-4 mb-1" />
                <span className="font-medium">{preset.name}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{preset.description}</span>
              </Button>
            )
          })}
        </div>
      </Card>

      {/* Event Templates */}
      <Card className="p-4 min-w-0">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Event Templates</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-3 break-words">
          Quick event templates with common durations
        </p>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TEMPLATES.map((template) => {
            const Icon = template.icon
            return (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                onClick={() => handleTemplateEvent(template)}
                className="flex items-center justify-center gap-2 h-auto py-2.5 px-2 text-xs hover:bg-accent"
              >
                <Icon className="h-4 w-4" />
                <span>{template.name}</span>
                <span className="text-[10px] text-muted-foreground">({template.duration}min)</span>
              </Button>
            )
          })}
        </div>
      </Card>

      {/* Info */}
      <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg border border-border">
        <p className="break-words">
          <strong>Tip:</strong> Click any preset or template to open the event creation dialog with pre-filled times.
        </p>
      </div>

      {/* Add Event Dialog with preset data */}
      {isAddDialogOpen && (
        <AddEventDialog 
          open={isAddDialogOpen} 
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) setPresetData(null)
          }}
          presetData={presetData}
        />
      )}
    </div>
  )
}
