# Task Management Enhancement for Timetable App

## Overview
Add comprehensive task management functionality to the timetable app where clicking on an event shows a task list instead of an edit dialog, with features to manage tasks, mark them done/undone, and drag to rearrange.

## Requirements Analysis
- **Task List on Event Click**: When clicking an event, show task list instead of edit dialog
- **Task Cards**: Display individual tasks for each event
- **Mark Done/Undone**: Toggle task completion status
- **Drag & Drop**: Allow rearranging tasks within event
- **Separate Event Editing**: Move event editing to separate interface

## Implementation Plan

### Phase 1: Core Infrastructure
- [x] Extend Event interface to include tasks array
- [x] Create Task interface with id, title, completed status, order
- [x] Update context to include task management functions
- [x] Add task persistence to localStorage

### Phase 2: Task Components
- [x] Create TaskCard component with drag functionality (integrated into TaskListDialog)
- [x] Create TaskListDialog component for displaying event tasks
- [x] Create AddTaskForm component for adding new tasks (integrated)
- [x] Implement drag-and-drop reordering for tasks

### Phase 3: Event Interaction Changes
- [x] Update TimetableGrid to show task list on click
- [x] Create separate EventEditDialog accessible via different action (right-click)
- [x] Remove immediate edit on event click

### Phase 4: UI/UX Enhancements
- [x] Add task count indicator on events
- [x] Visual completion status indicators
- [x] Smooth animations for drag operations
- [x] Responsive design for task lists

### Phase 5: Integration & Testing
- [x] Test all task management features
- [x] Verify drag-and-drop functionality
- [x] Test task persistence and state management
- [x] Ensure responsive behavior across devices
- [x] Fix TypeScript compilation errors
- [x] Successfully build application

## Technical Implementation Details

### Data Structure Changes
```typescript
interface Task {
  id: string
  title: string
  completed: boolean
  order: number
  createdAt: Date
  completedAt?: Date
}

interface Event {
  // existing properties...
  tasks: Task[]
}
```

### New Context Methods
- addTask(eventId: string, task: Omit<Task, 'id' | 'order'>)
- updateTask(eventId: string, taskId: string, updates: Partial<Task>)
- deleteTask(eventId: string, taskId: string)
- toggleTask(eventId: string, taskId: string)
- reorderTasks(eventId: string, taskIds: string[])

### Component Hierarchy
- TaskListDialog (replaces EditEventDialog on click)
  - TaskCard components (draggable)
    - Checkbox for completion
    - Task title (editable)
    - Delete button
  - Add new task form
- EditEventDialog (accessible via separate action)

## Success Criteria
1. ✅ Clicking events opens task list instead of edit dialog
2. ✅ Tasks can be marked as done/undone with visual feedback
3. ✅ Tasks can be reordered via drag and drop
4. ✅ Task changes persist across page reloads
5. ✅ Event editing remains accessible via separate interface (right-click)
6. ✅ Responsive design works on all screen sizes

## Features Implemented
- **Task Management**: Add, edit, delete, and toggle task completion
- **Drag & Drop**: Reorder tasks within events using drag and drop
- **Visual Indicators**: Task count badges showing completed/total tasks
- **Separate Interfaces**: Left-click for tasks, right-click for event editing
- **Persistence**: All task data is saved to localStorage
- **UI/UX**: Clean, intuitive interface with clear visual feedback
- **Responsive Design**: Works across different screen sizes
- **Toast Notifications**: User feedback for actions performed
- **TypeScript Support**: Full type safety with proper interfaces
- **Clean Architecture**: Modular component design with proper separation of concerns

## Usage Instructions
- **Left-click any event** to open the task management dialog
- **Right-click any event** to edit event details
- **Add tasks** using the input field and plus button
- **Mark tasks complete** by clicking the checkbox
- **Edit task titles** by clicking on the task text
- **Delete tasks** using the X button
- **Reorder tasks** by dragging and dropping them
- **View completion status** via the task count indicators on events

## Files Modified/Created
- `src/types/index.ts` - Extended interfaces for task management
- `src/context/TimetableContext.tsx` - Added task management functions
- `src/components/TaskListDialog.tsx` - New task management dialog
- `src/components/ui/dialog.tsx` - New dialog UI component
- `src/components/ui/checkbox.tsx` - New checkbox UI component
- `src/components/TimetableGrid.tsx` - Updated event interaction logic
- `todo.md` - This implementation plan and documentation
