import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { X, Trash2, Edit } from 'lucide-react'
import { useTimetable } from '../context/TimetableContext'
import { TimePicker } from './TimePicker'
import { parseTimeString } from '../utils/timeUtils'

interface EditEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
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

export const EditEventDialog: React.FC<EditEventDialogProps> = ({ open, onOpenChange, eventId }) => {
  const { events, updateEvent, deleteEvent } = useTimetable()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    day: '',
    startTime: '',
    endTime: '',
    teacher: '',
    location: '',
    color: 'bg-blue-500',
    description: ''
  })

  const currentEvent = eventId ? events.find(e => e.id === eventId) : null

  useEffect(() => {
    if (currentEvent) {
      // Handle both old format (numbers) and new format (strings)
      const startTime = typeof currentEvent.startTime === 'string' 
        ? currentEvent.startTime 
        : typeof currentEvent.startTime === 'number' 
          ? '8:00 AM' // fallback for migration
          : '8:00 AM'
      
      const endTime = typeof currentEvent.endTime === 'string'
        ? currentEvent.endTime
        : typeof currentEvent.endTime === 'number'
          ? '9:00 AM' // fallback for migration
          : '9:00 AM'
      
      setFormData({
        title: currentEvent.title,
        day: currentEvent.day.toString(),
        startTime: startTime,
        endTime: endTime,
        teacher: currentEvent.teacher || '',
        location: currentEvent.location || '',
        color: currentEvent.color,
        description: currentEvent.description || ''
      })
    }
  }, [currentEvent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentEvent) return

    // Validate times
    const startMinutes = parseTimeString(formData.startTime)
    const endMinutes = parseTimeString(formData.endTime)
    
    if (startMinutes >= endMinutes) {
      alert('End time must be after start time')
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

    updateEvent(currentEvent.id, eventData)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!currentEvent) return
    
    deleteEvent(currentEvent.id)
    setShowDeleteConfirm(false)
    onOpenChange(false)
  }

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!open || !currentEvent) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Edit className="w-5 h-5 mr-2" />
            Edit Event
          </h2>
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
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
            <Card className="w-full max-w-sm p-6 m-4">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete "{currentEvent.title}"? This action cannot be undone.
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
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  )
}
