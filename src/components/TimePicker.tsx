import React from 'react'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  minTime?: string
  maxTime?: string
  className?: string
}

export const TimePicker: React.FC<TimePickerProps> = ({ 
  value, 
  onChange, 
  className = ''
}) => {
  // Parse time string to hours and minutes
  const parseTime = (timeStr: string): { hours: number; minutes: number; period: 'AM' | 'PM' } => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!match) {
      // Default to 8:00 AM
      return { hours: 8, minutes: 0, period: 'AM' }
    }
    
    let hours = parseInt(match[1])
    const minutes = parseInt(match[2])
    const period = match[3].toUpperCase() as 'AM' | 'PM'
    
    return { hours, minutes, period }
  }

  // Format time components to string
  const formatTime = (hours: number, minutes: number, period: 'AM' | 'PM'): string => {
    return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const { hours, minutes, period } = parseTime(value || '8:00 AM')

  const handleHoursChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let newHours = parseInt(e.target.value) || 1
    newHours = Math.max(1, Math.min(12, newHours))
    onChange(formatTime(newHours, minutes, period))
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let newMinutes = parseInt(e.target.value) || 0
    newMinutes = Math.max(0, Math.min(59, newMinutes))
    // Round to nearest 5 minutes
    newMinutes = Math.round(newMinutes / 5) * 5
    onChange(formatTime(hours, newMinutes, period))
  }

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(formatTime(hours, minutes, e.target.value as 'AM' | 'PM'))
  }

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  
  // Generate minute options (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5)

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <select
        value={hours}
        onChange={handleHoursChange}
        className="px-2 py-1 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {hourOptions.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      
      <span className="text-lg font-semibold">:</span>
      
      <select
        value={minutes}
        onChange={handleMinutesChange}
        className="px-2 py-1 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {minuteOptions.map(m => (
          <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
        ))}
      </select>
      
      <select
        value={period}
        onChange={handlePeriodChange}
        className="px-2 py-1 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}
