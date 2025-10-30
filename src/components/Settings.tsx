import React, { useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Settings as SettingsIcon, Save, RotateCcw, Trash2 } from 'lucide-react'
import { useTimetable } from '../context/TimetableContext'
import { useSettings } from '../context/SettingsContext'
import { useToast } from './ui/toast'

export const Settings: React.FC = () => {
  const { events, setEvents } = useTimetable()
  const { settings, updateSetting, resetSettings, saveSettings } = useSettings()
  const { addToast } = useToast()
  const [hasChanges, setHasChanges] = React.useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track changes when settings update
  useEffect(() => {
    const savedSettings = localStorage.getItem('timetable-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        const currentStr = JSON.stringify(settings)
        const savedStr = JSON.stringify(parsed)
        setHasChanges(currentStr !== savedStr)
      } catch {
        setHasChanges(true)
      }
    } else {
      setHasChanges(true)
    }
  }, [settings])

  const handleSave = () => {
    saveSettings()
    addToast({
      title: 'Settings Saved',
      description: 'Your preferences have been saved successfully.',
      variant: 'success'
    })
  }

  const handleReset = () => {
    resetSettings()
    addToast({
      title: 'Settings Reset',
      description: 'Settings have been reset to default values.',
      variant: 'success'
    })
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all timetable data? This action cannot be undone.')) {
      setEvents([])
      localStorage.removeItem('timetable-events')
      localStorage.removeItem('timetable-settings')
      resetSettings()
      addToast({
        title: 'Data Cleared',
        description: 'All timetable data has been cleared successfully.',
        variant: 'success'
      })
    }
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'timetable-settings.json'
    link.click()
    URL.revokeObjectURL(url)
    
    addToast({
      title: 'Settings Exported',
      description: 'Settings have been exported to file.',
      variant: 'success'
    })
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedSettings = JSON.parse(content)
        
        // Import each setting
        Object.keys(importedSettings).forEach((key) => {
          if (key in settings) {
            updateSetting(key as keyof typeof settings, importedSettings[key])
          }
        })
        
        addToast({
          title: 'Settings Imported',
          description: 'Settings have been imported successfully.',
          variant: 'success'
        })
      } catch (error) {
        addToast({
          title: 'Import Failed',
          description: 'Error importing settings. Please check the file format.',
          variant: 'destructive'
        })
      }
    }
    reader.readAsText(file)
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4 min-w-0">
      <Card className="p-4 min-w-0">
        <div className="flex justify-between items-center mb-4 min-w-0">
          <h3 className="text-base font-semibold flex items-center min-w-0">
            <SettingsIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">Display Settings</span>
          </h3>
          {hasChanges && !settings.autoSave && (
            <Button onClick={handleSave} size="sm" className="flex-shrink-0">
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
          )}
        </div>
        
        <div className="space-y-3 min-w-0">
          <div className="space-y-2 min-w-0">
            <h4 className="font-medium text-xs">Show/Hide Elements</h4>
            
            <label className="flex items-center justify-between min-w-0">
              <span className="text-xs truncate">Show time slots</span>
              <input 
                type="checkbox" 
                checked={settings.showTimeSlots}
                onChange={(e) => updateSetting('showTimeSlots', e.target.checked)}
                className="rounded flex-shrink-0"
              />
            </label>
            
            <label className="flex items-center justify-between min-w-0">
              <span className="text-xs truncate">Show teacher names</span>
              <input 
                type="checkbox" 
                checked={settings.showTeacherNames}
                onChange={(e) => updateSetting('showTeacherNames', e.target.checked)}
                className="rounded flex-shrink-0"
              />
            </label>
            
            <label className="flex items-center justify-between min-w-0">
              <span className="text-xs truncate">Show locations</span>
              <input 
                type="checkbox" 
                checked={settings.showLocations}
                onChange={(e) => updateSetting('showLocations', e.target.checked)}
                className="rounded flex-shrink-0"
              />
            </label>
            
            <label className="flex items-center justify-between min-w-0">
              <span className="text-xs truncate">Show descriptions</span>
              <input 
                type="checkbox" 
                checked={settings.showDescriptions}
                onChange={(e) => updateSetting('showDescriptions', e.target.checked)}
                className="rounded flex-shrink-0"
              />
            </label>
          </div>
          
          <div className="space-y-2 min-w-0">
            <h4 className="font-medium text-xs">Grid & Layout</h4>
            
            <div className="min-w-0">
              <label className="block text-xs mb-1">Grid Density</label>
              <select 
                value={settings.gridDensity}
                onChange={(e) => updateSetting('gridDensity', e.target.value as 'compact' | 'comfortable' | 'spacious')}
                className="w-full min-w-0 px-2 py-1 border border-input rounded-md bg-background text-xs"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>
            
            <div className="min-w-0">
              <label className="block text-xs mb-1">Default Event Duration</label>
              <select 
                value={settings.defaultEventDuration}
                onChange={(e) => updateSetting('defaultEventDuration', parseFloat(e.target.value))}
                className="w-full min-w-0 px-2 py-1 border border-input rounded-md bg-background text-xs"
              >
                <option value={0.5}>30 minutes</option>
                <option value={1}>1 hour</option>
                <option value={1.5}>1.5 hours</option>
                <option value={2}>2 hours</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 min-w-0">
        <h3 className="text-base font-semibold mb-4 flex items-center min-w-0">
          <SettingsIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">Notifications & Alerts</span>
        </h3>
        
        <div className="space-y-2 min-w-0">
          <label className="flex items-center justify-between min-w-0">
            <span className="text-xs truncate">Enable notifications</span>
            <input 
              type="checkbox" 
              checked={settings.enableNotifications}
              onChange={(e) => updateSetting('enableNotifications', e.target.checked)}
              className="rounded flex-shrink-0"
            />
          </label>
          
          <label className="flex items-center justify-between min-w-0">
            <span className="text-xs truncate">Enable reminders</span>
            <input 
              type="checkbox" 
              checked={settings.enableReminders}
              onChange={(e) => updateSetting('enableReminders', e.target.checked)}
              className="rounded flex-shrink-0"
            />
          </label>
          
          <label className="flex items-center justify-between min-w-0">
            <span className="text-xs truncate">Show conflict warnings</span>
            <input 
              type="checkbox" 
              checked={settings.enableConflictWarnings}
              onChange={(e) => updateSetting('enableConflictWarnings', e.target.checked)}
              className="rounded flex-shrink-0"
            />
          </label>
          
          <label className="flex items-center justify-between min-w-0">
            <span className="text-xs truncate">Auto-save changes</span>
            <input 
              type="checkbox" 
              checked={settings.autoSave}
              onChange={(e) => updateSetting('autoSave', e.target.checked)}
              className="rounded flex-shrink-0"
            />
          </label>
        </div>
      </Card>

      <Card className="p-4 min-w-0">
        <h3 className="text-base font-semibold mb-4 flex items-center min-w-0">
          <SettingsIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">Data Management</span>
        </h3>
        
        <div className="space-y-3 min-w-0">
          <div className="space-y-2 min-w-0">
            <h4 className="font-medium text-xs">Export/Import Settings</h4>
            <div className="flex gap-2 min-w-0">
              <Button variant="outline" size="sm" onClick={exportSettings} className="flex-1 text-xs min-w-0">
                Export
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
                id="import-settings"
                ref={fileInputRef}
              />
              <Button variant="outline" size="sm" asChild className="flex-1 text-xs min-w-0">
                <label htmlFor="import-settings" className="cursor-pointer truncate">
                  Import
                </label>
              </Button>
            </div>
          </div>
          
          <div className="space-y-2 min-w-0">
            <h4 className="font-medium text-xs">Reset Options</h4>
            <div className="flex gap-2 min-w-0">
              <Button variant="outline" size="sm" onClick={handleReset} className="flex-1 text-xs min-w-0">
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
              <Button variant="destructive" size="sm" onClick={clearAllData} className="flex-1 text-xs min-w-0">
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 min-w-0">
        <h3 className="text-base font-semibold mb-2">App Info</h3>
        <div className="space-y-1 text-xs text-muted-foreground break-words">
          <p><strong>Total Events:</strong> {events.length}</p>
          <p><strong>Storage:</strong> Local</p>
          <p><strong>Version:</strong> 1.0.0</p>
        </div>
      </Card>
    </div>
  )
}
