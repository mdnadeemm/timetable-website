import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { generateLearningPlanWithFallback, type LearningPlanRequest } from '../services/learningAgent'
import { useTimetable } from '../context/TimetableContext'
import { useToast } from './ui/toast'
import { Loader2, Sparkles } from 'lucide-react'

interface LearningPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const LearningPlanDialog: React.FC<LearningPlanDialogProps> = ({ open, onOpenChange }) => {
  const [skill, setSkill] = useState('')
  const [duration, setDuration] = useState<number>(4)
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10)
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [focusAreas, setFocusAreas] = useState('')
  const [loading, setLoading] = useState(false)
  const { addEvent, setDescription, setSelectedWeek } = useTimetable()
  const { addToast } = useToast()

  const handleGenerate = async () => {
    if (!skill.trim()) {
      addToast({
        title: 'Error',
        description: 'Please enter a skill to learn',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const request: LearningPlanRequest = {
        skill: skill.trim(),
        duration,
        hoursPerWeek,
        difficulty,
        focusAreas: focusAreas.split(',').map(area => area.trim()).filter(Boolean)
      }

      const plan = await generateLearningPlanWithFallback(request)
      
      // Add all events from the plan to the timetable
      const newEvents = plan.weeklyPlans.flatMap(weeklyPlan => 
        weeklyPlan.events.map(event => ({
          ...event,
          id: `learning-${weeklyPlan.week}-${Date.now()}-${Math.random()}`,
          week: weeklyPlan.week,
          // Ensure tasks have proper IDs and dates if they exist
          tasks: event.tasks?.map((task, index) => ({
            ...task,
            id: `task-${Date.now()}-${Math.random()}-${index}`,
            order: task.order ?? index,
            createdAt: task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt || Date.now())
          }))
        }))
      )

      // Add events to the timetable
      newEvents.forEach(event => {
        addEvent(event)
      })

      // Set the description
      setDescription(plan.description)

      // Set Week 1 as default selection after generating plan
      setSelectedWeek(1)

      addToast({
        title: 'Success!',
        description: `Generated ${plan.totalWeeks}-week learning plan for ${plan.skill}`,
        variant: 'success'
      })

      // Reset form
      setSkill('')
      setDuration(4)
      setHoursPerWeek(10)
      setDifficulty('intermediate')
      setFocusAreas('')
      onOpenChange(false)
    } catch (error: any) {
      addToast({
        title: 'Error',
        description: error.message || 'Failed to generate learning plan',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate Learning Plan
          </DialogTitle>
          <DialogDescription>
            Use AI to generate a personalized learning plan for any skill
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="skill">Skill to Learn</Label>
            <Input
              id="skill"
              placeholder="e.g., React, Python, Machine Learning"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Select
                value={duration.toString()}
                onValueChange={(value) => setDuration(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 week</SelectItem>
                  <SelectItem value="2">2 weeks</SelectItem>
                  <SelectItem value="3">3 weeks</SelectItem>
                  <SelectItem value="4">4 weeks</SelectItem>
                  <SelectItem value="6">6 weeks</SelectItem>
                  <SelectItem value="8">8 weeks</SelectItem>
                  <SelectItem value="12">12 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursPerWeek">Hours per Week</Label>
              <Select
                value={hoursPerWeek.toString()}
                onValueChange={(value) => setHoursPerWeek(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger id="hoursPerWeek">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 hours</SelectItem>
                  <SelectItem value="10">10 hours</SelectItem>
                  <SelectItem value="15">15 hours</SelectItem>
                  <SelectItem value="20">20 hours</SelectItem>
                  <SelectItem value="30">30 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={difficulty}
              onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setDifficulty(value)}
              disabled={loading}
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focusAreas">Focus Areas (comma-separated, optional)</Label>
            <Input
              id="focusAreas"
              placeholder="e.g., basics, advanced concepts, projects"
              value={focusAreas}
              onChange={(e) => setFocusAreas(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading || !skill.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Plan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

