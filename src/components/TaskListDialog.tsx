import React, { useState, useRef } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { useTimetable } from '../context/TimetableContext'
import { Task } from '../types'
import { useToast } from './ui/toast'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Checkbox } from './ui/checkbox'
import { Plus, X, GripVertical, Check, Edit3 } from 'lucide-react'

interface TaskListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
}

export const TaskListDialog: React.FC<TaskListDialogProps> = ({ 
  open, 
  onOpenChange, 
  eventId 
}) => {
  const { events, addTask, updateTask, deleteTask, toggleTask, reorderTasks } = useTimetable()
  const { addToast } = useToast()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const dragCounter = useRef(0)

  const event = events.find(e => e.id === eventId)
  const tasks = event?.tasks?.sort((a, b) => a.order - b.order) || []

  const completedTasks = tasks.filter(task => task.completed)
  const pendingTasks = tasks.filter(task => !task.completed)

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !eventId) return

    addTask(eventId, {
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date()
    })

    setNewTaskTitle('')
    addToast({
      title: 'Task Added',
      description: 'New task has been added to this event.',
      variant: 'success'
    })
  }

  const handleToggleTask = (taskId: string) => {
    if (!eventId) return
    toggleTask(eventId, taskId)
  }

  const handleDeleteTask = (taskId: string) => {
    if (!eventId) return
    deleteTask(eventId, taskId)
    addToast({
      title: 'Task Deleted',
      description: 'Task has been removed from this event.',
      variant: 'success'
    })
  }

  const handleEditStart = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  const handleEditSave = () => {
    if (!editingTaskId || !eventId || !editingTitle.trim()) return

    updateTask(eventId, editingTaskId, {
      title: editingTitle.trim()
    })

    setEditingTaskId(null)
    setEditingTitle('')
    addToast({
      title: 'Task Updated',
      description: 'Task has been updated successfully.',
      variant: 'success'
    })
  }

  const handleEditCancel = () => {
    setEditingTaskId(null)
    setEditingTitle('')
  }

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
  }

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      e.currentTarget.classList.remove('border-2', 'border-blue-400', 'bg-blue-50')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropTaskId: string) => {
    e.preventDefault()
    dragCounter.current = 0
    
    if (!draggedTaskId || !eventId || draggedTaskId === dropTaskId) return

    const newOrder = tasks
      .filter(task => task.id !== draggedTaskId)
      .reduce((acc, task) => {
        if (task.id === dropTaskId) {
          acc.push(draggedTaskId)
        }
        acc.push(task.id)
        return acc
      }, [] as string[])

    reorderTasks(eventId, newOrder)
    e.currentTarget.classList.remove('border-2', 'border-blue-400', 'bg-blue-50')
    
    addToast({
      title: 'Task Reordered',
      description: 'Tasks have been reordered successfully.',
      variant: 'success'
    })
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    dragCounter.current = 0
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>📋</span>
            Tasks for {event.title}
          </DialogTitle>
          <DialogDescription>
            Manage your event tasks. Add, edit, complete, and reorder as needed.
          </DialogDescription>
        </DialogHeader>

        {/* Add new task form */}
        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {/* Task statistics */}
        <div className="text-sm text-gray-600 mb-4 flex gap-4">
          <span>Total: {tasks.length}</span>
          <span>Completed: {completedTasks.length}</span>
          <span>Pending: {pendingTasks.length}</span>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {/* Pending tasks */}
          {pendingTasks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">📝 Pending Tasks</h4>
              {pendingTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`p-3 cursor-move transition-all hover:shadow-md ${
                    draggedTaskId === task.id ? 'opacity-50' : ''
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, task.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                    />
                    {editingTaskId === task.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleEditSave()}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleEditSave}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleEditCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleEditStart(task)}
                        >
                          {task.title}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStart(task)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">✅ Completed Tasks</h4>
              {completedTasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-3 cursor-move transition-all hover:shadow-md opacity-75"
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, task.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                    />
                    {editingTaskId === task.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 line-through"
                          onKeyPress={(e) => e.key === 'Enter' && handleEditSave()}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleEditSave}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleEditCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span 
                          className="flex-1 cursor-pointer line-through"
                          onClick={() => handleEditStart(task)}
                        >
                          {task.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStart(task)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>No tasks yet. Add one above to get started!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
