import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { X, Plus } from 'lucide-react'
import { useTimetable } from '../context/TimetableContext'
import { useSettings } from '../context/SettingsContext'
import { useToast } from './ui/toast'
import { TimePicker } from './TimePicker'
import { parseTimeString } from '../utils/timeUtils'

interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetData?: { startTime?: string; endTime?: string; title?: string; color?: string } | null
}

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

export const AddEventDialog: React.FC<AddEventDialogProps> = ({ open, onOpenChange, presetData }) => {
  const { addEvent } = useTimetable()
  const { settings } = useSettings()
  const { addToast } = useToast()
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    day: '',
    startTime: '8:00 AM',
    endTime: '9:00 AM',
    teacher: '',
    location: '',
    color: 'bg-blue-500',
    description: ''
  })

  // Initialize form with preset data when dialog opens
  useEffect(() => {
    if (open && presetData) {
      setFormData(prev => ({
        ...prev,
        startTime: presetData.startTime || prev.startTime,
        endTime: presetData.endTime || prev.endTime,
        title: presetData.title || prev.title,
        color: presetData.color || prev.color
      }))
    } else if (open && !presetData) {
      // Reset form when opening without preset
      setFormData({
        title: '',
        day: '',
        startTime: '8:00 AM',
        endTime: '9:00 AM',
        teacher: '',
        location: '',
        color: 'bg-blue-500',
        description: ''
      })
    }
  }, [open, presetData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate times
    const startMinutes = parseTimeString(formData.startTime)
    const endMinutes = parseTimeString(formData.endTime)
    
    if (startMinutes >= endMinutes) {
      addToast({
        title: 'Invalid Time Range',
        description: 'End time must be after start time.',
        variant: 'destructive'
      })
      return
    }

    const eventData = {
      title: formData.title,
      day: parseInt(formData.day),
      startTime: formData.startTime,
      endTime: formData.endTime,
      teacher: formData.teacher,
      location: formData.location,
      color: formData.color,
      description: formData.description
    }

    addEvent(eventData)
    addToast({
      title: 'Event Added Successfully',
      description: `"${formData.title}" has been added to your timetable.`,
      variant: 'success'
    })
    
    onOpenChange(false)
    
    // Reset form
    setFormData({
      title: '',
      day: '',
      startTime: '8:00 AM',
      endTime: '9:00 AM',
      teacher: '',
      location: '',
      color: 'bg-blue-500',
      description: ''
    })
  }

  // Auto-set end time when start time changes based on default duration (only if endTime not preset)
  useEffect(() => {
    if (formData.startTime && !formData.endTime && !presetData?.endTime) {
      const startMinutes = parseTimeString(formData.startTime)
      const durationMinutes = Math.round(settings.defaultEventDuration * 60)
      const endMinutes = startMinutes + durationMinutes
      
      // Format end time
      const hours = Math.floor(endMinutes / 60)
      const mins = endMinutes % 60
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
      const formattedEndTime = `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
      
      setFormData(prev => ({ ...prev, endTime: formattedEndTime }))
    }
  }, [formData.startTime, settings.defaultEventDuration, presetData])

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Event</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter event title"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Day</label>
            <select
              value={formData.day}
              onChange={(e) => handleInputChange('day', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                value={formData.startTime}
                onChange={(value) => handleInputChange('startTime', value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <TimePicker
                value={formData.endTime}
                onChange={(value) => handleInputChange('endTime', value)}
                minTime={formData.startTime}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teacher</label>
            <input
              type="text"
              value={formData.teacher}
              onChange={(e) => handleInputChange('teacher', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter teacher name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter description"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange('color', color.value)}
                  className={`w-8 h-8 rounded-full ${color.value} ${
                    formData.color === color.value ? 'ring-2 ring-offset-2 ring-ring' : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
