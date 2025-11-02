import { Event, Task } from '../types'

export interface LearningPlanRequest {
  skill: string
  duration: number // in weeks
  hoursPerWeek?: number // optional hours per week
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  focusAreas?: string[]
}

export interface WeeklyPlan {
  week: number
  title: string
  description: string
  learningObjectives: string[]
  events: Omit<Event, 'id'>[]
}

export interface LearningPlan {
  skill: string
  description: string
  totalWeeks: number
  weeklyPlans: WeeklyPlan[]
}

// Backend API types
export type BackendLearningPlanRequest = LearningPlanRequest

// Backend API configuration (ADK API Server)
// In development, use proxy to avoid CORS issues
// In production, use direct backend URL
const getBackendUrl = () => {
  if (import.meta.env.DEV && !import.meta.env.VITE_BACKEND_API_URL) {
    // Use proxy in development mode
    return '/api'
  }
  return import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000'
}

const BACKEND_API_URL = getBackendUrl()
const BACKEND_TIMEOUT = 5000 // 5 seconds for health checks
const BACKEND_REQUEST_TIMEOUT = 120000 // 120 seconds (2 minutes) for learning plan generation
const AGENT_NAME = 'learning_plan_agent' // Based on folder name: backend/agents/learning_plan_agent/
const USER_ID = 'default_user' // Default user ID for sessions
const SESSION_ID = 'default_session' // Default session ID

/**
 * Check if the backend API is available by listing available agents
 * Uses ADK's /list-apps endpoint
 */
async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT)
    
    const response = await fetch(`${BACKEND_API_URL}/list-apps`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      return false
    }
    
    const apps: string[] = await response.json()
    return apps.includes(AGENT_NAME)
  } catch (error: any) {
    // Check if it's a CORS error
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.warn('CORS error detected. Make sure the ADK API server is running and configured to allow CORS, or use the Vite proxy.')
    }
    return false
  }
}

/**
 * Create or update a session for the agent
 * Uses ADK's session management endpoint
 * Checks if session exists first to avoid 409 errors
 */
async function ensureSession(): Promise<void> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT)
    
    // First, try to get the session to see if it exists
    const checkResponse = await fetch(`${BACKEND_API_URL}/apps/${AGENT_NAME}/users/${USER_ID}/sessions/${SESSION_ID}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    clearTimeout(timeoutId)
    
    // If session exists (200 OK), we're done
    if (checkResponse.ok) {
      return // Session exists, no need to create
    }
    
    // If session doesn't exist (404), create it
    if (checkResponse.status === 404) {
      const createController = new AbortController()
      const createTimeoutId = setTimeout(() => createController.abort(), BACKEND_TIMEOUT)
      
      const createResponse = await fetch(`${BACKEND_API_URL}/apps/${AGENT_NAME}/users/${USER_ID}/sessions/${SESSION_ID}`, {
        method: 'POST',
        signal: createController.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty state for new session
      })
      
      clearTimeout(createTimeoutId)
      
      if (!createResponse.ok && createResponse.status !== 409) {
        // Only log if it's not a 409 (which we handle below)
        if (import.meta.env.DEV) {
          console.warn(`Session creation returned status: ${createResponse.status}`)
        }
      }
      return
    }
    
    // Handle 409 if it somehow occurs (shouldn't with check-first approach)
    // This is a fallback
    if (checkResponse.status === 409) {
      return // Session exists, proceed
    }
  } catch (error) {
    // Session creation is optional, continue even if it fails
    // Don't log errors in production to avoid noise
    if (import.meta.env.DEV) {
      console.warn('Failed to ensure session:', error)
    }
  }
}

/**
 * Build the ADK API request body structure
 */
function buildADKRequestBody(messageText: string): string {
  return JSON.stringify({
    app_name: AGENT_NAME,
    user_id: USER_ID,
    session_id: SESSION_ID,
    new_message: {
      role: 'user',
      parts: [
        { text: messageText }
      ]
    },
    streaming: false
  })
}

/**
 * Generate a learning plan from the backend API using ADK
 * Uses ADK's /run endpoint to execute the agent
 */
async function generateLearningPlanFromBackend(request: BackendLearningPlanRequest): Promise<LearningPlan> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT) // 2 minutes timeout for plan generation
  
  // Ensure session exists before running agent
  await ensureSession()
  
  // Build a clean request message with only provided parameters
  // Format as JSON for easy parsing by the agent
  const requestData: Record<string, any> = {
    skill: request.skill,
    duration: request.duration,
    hoursPerWeek: request.hoursPerWeek ?? 10,
    difficulty: request.difficulty ?? 'intermediate'
  }
  
  // Only include focusAreas if provided and not empty
  if (request.focusAreas && request.focusAreas.length > 0) {
    requestData.focusAreas = request.focusAreas
  }
  
  const requestMessage = JSON.stringify(requestData, null, 2)

  try {
    // ADK API uses snake_case for request bodies
    const response = await fetch(`${BACKEND_API_URL}/run`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: buildADKRequestBody(requestMessage),
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
    }
    
    // ADK API returns an array of events directly
    const events = await response.json()
    
    // Extract the text response from the events
    // The response structure is: [{ content: { parts: [{ text: "..." }] } }, ...]
    // Each event has content.parts[].text
    let agentResponse = ''
    if (Array.isArray(events)) {
      for (const event of events) {
        if (event.content && event.content.parts) {
          for (const part of event.content.parts) {
            if (part.text) {
              agentResponse += part.text
            }
          }
        }
      }
    }
    
    if (!agentResponse) {
      throw new Error('No response text from agent')
    }
    
    // Clean the response text (remove markdown code blocks if present)
    let cleanedText = agentResponse.trim()
    
    // Remove markdown code blocks (handle ```json, ```, and any trailing ```)
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    // Also handle cases where code blocks might be at the end
    cleanedText = cleanedText.trim()
    
    // Extract JSON object from the response (handle cases where there's extra text after JSON)
    let jsonText = cleanedText.trim()
    
    // Try to find the first valid JSON object
    // Look for the first '{' and find the matching closing '}'
    const firstBraceIndex = jsonText.indexOf('{')
    if (firstBraceIndex !== -1) {
      let braceCount = 0
      let jsonEndIndex = -1
      
      for (let i = firstBraceIndex; i < jsonText.length; i++) {
        if (jsonText[i] === '{') {
          braceCount++
        } else if (jsonText[i] === '}') {
          braceCount--
          if (braceCount === 0) {
            jsonEndIndex = i + 1
            break
          }
        }
      }
      
      if (jsonEndIndex !== -1) {
        jsonText = jsonText.substring(firstBraceIndex, jsonEndIndex)
      }
    }
    
    // Parse the JSON response
    let plan: LearningPlan
    try {
      plan = JSON.parse(jsonText)
    } catch (parseError: any) {
      // If parsing fails, try to extract JSON from between first { and last }
      // Use cleanedText for the fallback since jsonText might have been modified
      const fallbackFirstBrace = cleanedText.indexOf('{')
      const lastBraceIndex = cleanedText.lastIndexOf('}')
      if (lastBraceIndex !== -1 && fallbackFirstBrace !== -1 && lastBraceIndex > fallbackFirstBrace) {
        jsonText = cleanedText.substring(fallbackFirstBrace, lastBraceIndex + 1)
        try {
          plan = JSON.parse(jsonText)
        } catch (secondParseError: any) {
          throw new Error(`Failed to parse JSON response: ${parseError.message}. Response preview: ${cleanedText.substring(0, 500)}...`)
        }
      } else {
        throw new Error(`Failed to parse JSON response: ${parseError.message}. Response preview: ${cleanedText.substring(0, 500)}...`)
      }
    }
    
    // Validate and ensure all required fields are present
    if (!plan.weeklyPlans || !Array.isArray(plan.weeklyPlans)) {
      throw new Error('Invalid response format: weeklyPlans not found')
    }
    
    // Ensure each event has required fields and properly formatted tasks
    plan.weeklyPlans = plan.weeklyPlans.map(weeklyPlan => ({
      ...weeklyPlan,
      events: weeklyPlan.events.map((event) => ({
        ...event,
        color: event.color || 'bg-blue-500',
        teacher: event.teacher || 'Self-paced',
        location: event.location || 'Online',
        description: event.description || `Learning session for ${plan.skill}`,
        // Ensure tasks are properly formatted
        tasks: event.tasks && Array.isArray(event.tasks) 
          ? event.tasks.map((task, taskIndex) => ({
              ...task,
              completed: task.completed ?? false,
              order: task.order ?? taskIndex,
              createdAt: task.createdAt ? new Date(task.createdAt) : new Date()
            }))
          : []
      }))
    }))
    
    return plan
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Backend API request timeout after ${BACKEND_REQUEST_TIMEOUT / 1000} seconds. The learning plan generation is taking longer than expected. Please try again or check if the ADK server is running properly.`)
    }
    if (error.message) {
      throw error
    }
    throw new Error(`Failed to generate learning plan: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Generate a learning plan using the ADK backend API
 * Falls back to basic structured plan if backend is unavailable
 */
export async function generateLearningPlan(request: LearningPlanRequest): Promise<LearningPlan> {
  // Try backend first
  const backendAvailable = await checkBackendHealth()
  
  if (backendAvailable) {
    try {
      console.log('Using ADK backend for learning plan generation')
      return await generateLearningPlanFromBackend(request)
    } catch (error: any) {
      console.warn('ADK backend failed, using fallback plan generator:', error)
      // If it's a timeout, provide more helpful error message
      if (error.message?.includes('timeout')) {
        console.error('Timeout error details:', {
          message: error.message,
          timeout: BACKEND_REQUEST_TIMEOUT / 1000,
          suggestion: 'Try generating a shorter plan or check ADK server performance'
        })
      }
      return generateFallbackPlan(request)
    }
  } else {
    console.log('ADK backend not available, using fallback plan generator')
    return generateFallbackPlan(request)
  }
}

/**
 * Generate a learning plan with backend and fallback support
 * Uses ADK backend API, falls back to basic structured plan if unavailable
 */
export async function generateLearningPlanWithFallback(request: LearningPlanRequest): Promise<LearningPlan> {
  return await generateLearningPlan(request)
}

/**
 * Interface for task content generation request
 */
export interface TaskContentRequest {
  event: {
    title: string
    day: number
    startTime: string
    endTime: string
    description?: string
    teacher?: string
    location?: string
    week?: number
  }
  task: {
    title: string
    description?: string
    order: number
  }
  topic: string
  context: {
    weekTitle?: string
    weekDescription?: string
    learningObjectives?: string[]
  }
}

/**
 * Generate detailed markdown content for a specific task
 */
export async function generateTaskContent(request: TaskContentRequest): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT)
  
  // Ensure session exists
  await ensureSession()
  
  // Build request message
  const requestMessage = JSON.stringify(request, null, 2)
  
  try {
    // Use the single_task_content_agent via ADK API
    // For now, we'll use the learning_plan_agent and pass the request in a way it can handle
    // The agent's sub-agent should handle single task content generation
    const agentName = AGENT_NAME
    
    const response = await fetch(`${BACKEND_API_URL}/run`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_name: agentName,
        user_id: USER_ID,
        session_id: SESSION_ID,
        new_message: {
          role: 'user',
          parts: [
            { text: `You are being asked to generate detailed content for a single task. Use the single_task_content_agent sub-agent to handle this request.\n\nRequest data:\n${requestMessage}` }
          ]
        },
        streaming: false
      }),
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`)
    }
    
    // Extract the text response from the events
    const events = await response.json()
    let agentResponse = ''
    
    if (Array.isArray(events)) {
      for (const event of events) {
        if (event.content && event.content.parts) {
          for (const part of event.content.parts) {
            if (part.text) {
              agentResponse += part.text
            }
          }
        }
      }
    }
    
    if (!agentResponse) {
      throw new Error('No response text from agent')
    }
    
    // Clean the response text (remove markdown code blocks if present)
    let cleanedText = agentResponse.trim()
    cleanedText = cleanedText.replace(/```markdown\n?/g, '').replace(/```\n?/g, '')
    cleanedText = cleanedText.trim()
    
    return cleanedText
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Backend API request timeout after ${BACKEND_REQUEST_TIMEOUT / 1000} seconds.`)
    }
    throw new Error(`Failed to generate task content: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Generate a basic fallback plan when API is unavailable
 */
function generateFallbackPlan(request: LearningPlanRequest): LearningPlan {
  const weeklyPlans: WeeklyPlan[] = []
  const hoursPerWeek = request.hoursPerWeek || 10
  const sessionsPerWeek = Math.ceil(hoursPerWeek / 2) // 2-hour sessions
  
  for (let week = 1; week <= request.duration; week++) {
    const events: Omit<Event, 'id'>[] = []
    const days = [1, 2, 3, 4, 5] // Monday to Friday
    const times = [
      { start: '9:00 AM', end: '11:00 AM' },
      { start: '2:00 PM', end: '4:00 PM' },
      { start: '6:00 PM', end: '8:00 PM' }
    ]
    
    for (let i = 0; i < sessionsPerWeek && i < days.length * times.length; i++) {
      const dayIndex = i % days.length
      const timeIndex = Math.floor(i / days.length) % times.length
      const day = days[dayIndex]
      const time = times[timeIndex]
      
      const eventTasks: Omit<Task, 'id'>[] = [
        {
          title: `Complete reading assignment for ${request.skill}`,
          description: 'Review the materials covered in this session',
          completed: false,
          order: 0,
          createdAt: new Date()
        },
        {
          title: `Practice exercises`,
          description: 'Work through the practice problems',
          completed: false,
          order: 1,
          createdAt: new Date()
        },
        {
          title: `Create a summary`,
          description: 'Summarize key concepts learned',
          completed: false,
          order: 2,
          createdAt: new Date()
        }
      ]
      
      events.push({
        title: `${request.skill} - Week ${week} Session ${i + 1}`,
        day: day,
        startTime: time.start,
        endTime: time.end,
        color: ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'][week % 5],
        description: `Learning session for ${request.skill} - Week ${week}`,
        teacher: 'Self-paced',
        location: 'Online',
        week: week,
        tasks: eventTasks as any // Tasks will get IDs when added to timetable
      })
    }
    
    weeklyPlans.push({
      week,
      title: `Week ${week}: Introduction to ${request.skill}`,
      description: `This week focuses on building foundational knowledge in ${request.skill}`,
      learningObjectives: [
        `Understand the basics of ${request.skill}`,
        `Learn key concepts and terminology`,
        `Practice fundamental skills`,
        `Complete hands-on exercises`
      ],
      events
    })
  }
  
  return {
    skill: request.skill,
    description: `A ${request.duration}-week learning plan for ${request.skill}`,
    totalWeeks: request.duration,
    weeklyPlans
  }
}

