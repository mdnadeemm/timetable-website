import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export interface AppSettings {
  showTimeSlots: boolean
  showTeacherNames: boolean
  showLocations: boolean
  showDescriptions: boolean
  enableNotifications: boolean
  enableReminders: boolean
  enableConflictWarnings: boolean
  autoSave: boolean
  timeFormat: '12h' | '24h'
  startOfWeek: 'sunday' | 'monday'
  defaultEventDuration: number
  gridDensity: 'compact' | 'comfortable' | 'spacious'
}

const defaultSettings: AppSettings = {
  showTimeSlots: true,
  showTeacherNames: true,
  showLocations: true,
  showDescriptions: true,
  enableNotifications: true,
  enableReminders: true,
  enableConflictWarnings: true,
  autoSave: true,
  timeFormat: '12h',
  startOfWeek: 'monday',
  defaultEventDuration: 1,
  gridDensity: 'comfortable'
}

interface SettingsContextType {
  settings: AppSettings
  updateSetting: <T extends keyof AppSettings>(key: T, value: AppSettings[T]) => void
  resetSettings: () => void
  saveSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('timetable-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading settings:', error)
      }
    }
  }, [])

  // Auto-save settings when they change (if autoSave is enabled)
  useEffect(() => {
    if (hasChanges && settings.autoSave) {
      localStorage.setItem('timetable-settings', JSON.stringify(settings))
      setHasChanges(false)
    }
  }, [settings, hasChanges])

  const updateSetting = <T extends keyof AppSettings>(key: T, value: AppSettings[T]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
    
    // If autoSave is enabled, save immediately
    if (settings.autoSave) {
      const newSettings = { ...settings, [key]: value }
      localStorage.setItem('timetable-settings', JSON.stringify(newSettings))
      setHasChanges(false)
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
    if (settings.autoSave) {
      localStorage.setItem('timetable-settings', JSON.stringify(defaultSettings))
      setHasChanges(false)
    }
  }

  const saveSettings = () => {
    localStorage.setItem('timetable-settings', JSON.stringify(settings))
    setHasChanges(false)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
