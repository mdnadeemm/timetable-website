import React, { useState } from 'react'
import { Button } from './ui/button'
import { Calendar, Settings, Users, Clock, BookOpen, BarChart3, Download, Bell } from 'lucide-react'
import { ExportImport } from './ExportImport'
import { Settings as SettingsComponent } from './Settings'
import { TimeSlots } from './TimeSlots'
import { useTimetable } from '../context/TimetableContext'

export const Sidebar: React.FC = () => {
  const [activeView, setActiveView] = useState('timetable')
  const { events } = useTimetable()

  const menuItems = [
    { id: 'timetable', icon: Calendar, label: 'My Timetable', active: activeView === 'timetable' },
    { id: 'timeslots', icon: Clock, label: 'Quick Actions', active: activeView === 'timeslots' },
    { id: 'teachers', icon: Users, label: 'Teachers', active: activeView === 'teachers' },
    { id: 'subjects', icon: BookOpen, label: 'Subjects', active: activeView === 'subjects' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', active: activeView === 'analytics' },
    { id: 'settings', icon: Settings, label: 'Settings', active: activeView === 'settings' },
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'export':
        return <ExportImport />
      case 'timeslots':
        return <TimeSlots />
      case 'analytics':
        return (
          <div className="space-y-4 min-w-0">
            <div className="grid grid-cols-1 gap-3 min-w-0">
              <div className="p-3 bg-muted rounded-lg min-w-0">
                <h3 className="font-semibold text-sm mb-1 truncate">Total Events</h3>
                <p className="text-xl font-bold">{events.length}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg min-w-0">
                <h3 className="font-semibold text-sm mb-1 truncate">This Week</h3>
                <p className="text-xl font-bold">{events.filter(e => e.day >= 1 && e.day <= 5).length}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg min-w-0">
                <h3 className="font-semibold text-sm mb-1 truncate">Utilization</h3>
                <p className="text-xl font-bold">{Math.round((events.length / (12 * 7)) * 100)}%</p>
              </div>
              <div className="p-3 bg-muted rounded-lg min-w-0">
                <h3 className="font-semibold text-sm mb-1 truncate">Conflicts</h3>
                <p className="text-xl font-bold text-green-600">0</p>
              </div>
            </div>
          </div>
        )
      case 'teachers':
        return (
          <div className="space-y-3 min-w-0">
            <h2 className="text-base font-semibold truncate">Teachers</h2>
            <div className="space-y-2 min-w-0">
              {[...new Set(events.map(e => e.teacher).filter(Boolean))].map((teacher, index) => {
                const teacherEvents = events.filter(e => e.teacher === teacher)
                return (
                  <div key={index} className="p-3 bg-muted rounded-lg min-w-0">
                    <h3 className="font-semibold text-sm truncate">{teacher}</h3>
                    <p className="text-xs text-muted-foreground">{teacherEvents.length} classes</p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      case 'subjects':
        return (
          <div className="space-y-3 min-w-0">
            <h2 className="text-base font-semibold truncate">Subjects</h2>
            <div className="space-y-2 min-w-0">
              {[...new Set(events.map(e => e.title))].map((subject, index) => {
                const subjectEvents = events.filter(e => e.title === subject)
                return (
                  <div key={index} className="p-3 bg-muted rounded-lg min-w-0">
                    <h3 className="font-semibold text-sm truncate">{subject}</h3>
                    <p className="text-xs text-muted-foreground">{subjectEvents.length} sessions</p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      case 'settings':
        return <SettingsComponent />
      default:
        return (
          <div className="text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a view from the menu</p>
          </div>
        )
    }
  }

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar min-h-0">
        <nav className="p-6 space-y-2 flex-shrink-0">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={item.active ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveView(item.id)}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          ))}
          
          <Button
            variant={activeView === "export" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView('export')}
          >
            <Download className="w-4 h-4 mr-3" />
            Export/Import
          </Button>
        </nav>

        <div className="px-6 pb-6 pt-6 border-t border-border flex-shrink-0">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setActiveView('export')}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Bell className="w-4 h-4 mr-2" />
              Set Reminder
            </Button>
          </div>
        </div>

        {/* Dynamic Content Area - Scrollable */}
        {activeView !== 'timetable' && (
          <div className="px-4 pb-4 border-t border-border flex-shrink-0">
            {renderContent()}
          </div>
        )}
      </div>
    </aside>
  )
}
