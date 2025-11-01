"""
Google ADK Agent for Timetable Learning Assistant
Provides advanced AI agent capabilities with tools and multi-turn conversations
"""

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from google.adk.agents import Agent
from google.adk.tools import Tool, Parameter
import google.generativeai as genai


# Custom tool for generating learning plans
def generate_learning_plan_tool(
    skill: str,
    duration_weeks: int,
    hours_per_week: int = 10,
    difficulty: str = "intermediate",
    focus_areas: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generate a comprehensive learning plan for a specific skill.
    
    Args:
        skill: The skill to learn
        duration_weeks: Number of weeks for the learning plan
        hours_per_week: Hours to dedicate per week (default: 10)
        difficulty: Difficulty level (beginner/intermediate/advanced)
        focus_areas: Specific areas to focus on (optional)
    
    Returns:
        A structured learning plan with weekly breakdown
    """
    try:
        # Initialize Gemini model for generation
        api_key = os.getenv('GOOGLE_AI_API_KEY')
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        focus_text = ""
        if focus_areas:
            focus_text = f"\n- Focus areas: {', '.join(focus_areas)}"
        
        prompt = f"""Generate a {duration_weeks}-week learning plan for: {skill}

Requirements:
- Duration: {duration_weeks} weeks
- Hours per week: {hours_per_week}
- Difficulty: {difficulty}{focus_text}

Create a detailed JSON structure with:
1. Overall plan description
2. Weekly breakdown with:
   - Week number and title
   - Description
   - Learning objectives (3-5 items)
   - Daily sessions with specific topics
   - Time slots (1-3 hours each)

Return as JSON with keys: skill, description, totalWeeks, weeklyPlans
Each weeklyPlan should have: week, title, description, learningObjectives, events
Each event needs: title, day (0-6), startTime, endTime, color, description, teacher, location, week

Use colors: bg-blue-500, bg-green-500, bg-purple-500, bg-orange-500, bg-pink-500
Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
Times: Use 12-hour format (e.g., "9:00 AM", "2:00 PM")

Return ONLY valid JSON, no markdown."""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean markdown formatting
        if text.startswith('```json'):
            text = text.replace('```json', '').replace('```', '').strip()
        elif text.startswith('```'):
            text = text.replace('```', '').strip()
        
        plan = json.loads(text)
        return {
            "success": True,
            "plan": plan,
            "message": f"Generated {duration_weeks}-week learning plan for {skill}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to generate learning plan"
        }


def suggest_study_schedule_tool(
    available_hours: int,
    preferred_days: List[str],
    time_preference: str = "morning"
) -> Dict[str, Any]:
    """
    Suggest an optimal study schedule based on available time and preferences.
    
    Args:
        available_hours: Total hours available per week
        preferred_days: List of preferred days (e.g., ["Monday", "Wednesday", "Friday"])
        time_preference: Preferred time of day (morning/afternoon/evening)
    
    Returns:
        Suggested schedule with time slots
    """
    day_mapping = {
        "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3,
        "Thursday": 4, "Friday": 5, "Saturday": 6
    }
    
    time_slots = {
        "morning": ["9:00 AM", "10:00 AM", "11:00 AM"],
        "afternoon": ["2:00 PM", "3:00 PM", "4:00 PM"],
        "evening": ["6:00 PM", "7:00 PM", "8:00 PM"]
    }
    
    sessions = []
    hours_per_session = 2
    num_sessions = available_hours // hours_per_session
    
    start_times = time_slots.get(time_preference, time_slots["morning"])
    
    for i in range(min(num_sessions, len(preferred_days))):
        day_name = preferred_days[i % len(preferred_days)]
        day_num = day_mapping.get(day_name, 1)
        start_time = start_times[i % len(start_times)]
        
        # Calculate end time
        start_hour = int(start_time.split(':')[0])
        am_pm = start_time.split(' ')[1]
        end_hour = start_hour + hours_per_session
        
        if end_hour > 12:
            end_hour = end_hour - 12
            end_am_pm = "PM" if am_pm == "AM" else "PM"
        else:
            end_am_pm = am_pm
        
        end_time = f"{end_hour}:00 {end_am_pm}"
        
        sessions.append({
            "day": day_num,
            "dayName": day_name,
            "startTime": start_time,
            "endTime": end_time,
            "duration": hours_per_session
        })
    
    return {
        "success": True,
        "totalHours": available_hours,
        "sessionsPerWeek": len(sessions),
        "schedule": sessions,
        "message": f"Created {len(sessions)} study sessions totaling {len(sessions) * hours_per_session} hours"
    }


def analyze_learning_progress_tool(
    completed_sessions: int,
    total_sessions: int,
    current_week: int,
    total_weeks: int
) -> Dict[str, Any]:
    """
    Analyze learning progress and provide insights.
    
    Args:
        completed_sessions: Number of completed sessions
        total_sessions: Total number of planned sessions
        current_week: Current week number
        total_weeks: Total weeks in the plan
    
    Returns:
        Progress analysis with recommendations
    """
    completion_rate = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
    week_progress = (current_week / total_weeks * 100) if total_weeks > 0 else 0
    
    # Determine if on track
    expected_completion = (current_week / total_weeks) * total_sessions
    on_track = completed_sessions >= expected_completion * 0.9  # 90% threshold
    
    # Generate recommendations
    recommendations = []
    if completion_rate < 70:
        recommendations.append("Consider reviewing your schedule to ensure you have enough time allocated")
    if not on_track:
        recommendations.append("You're slightly behind schedule. Try to catch up this week")
    if completion_rate > 90:
        recommendations.append("Excellent progress! Keep up the great work")
    if current_week > total_weeks / 2 and completion_rate < 50:
        recommendations.append("You're past the halfway point. Consider increasing study intensity")
    
    status = "Excellent" if completion_rate > 90 else "Good" if completion_rate > 70 else "Needs Attention"
    
    return {
        "success": True,
        "completionRate": round(completion_rate, 2),
        "weekProgress": round(week_progress, 2),
        "onTrack": on_track,
        "status": status,
        "completedSessions": completed_sessions,
        "totalSessions": total_sessions,
        "sessionsRemaining": total_sessions - completed_sessions,
        "recommendations": recommendations,
        "message": f"Progress: {completion_rate:.1f}% complete, Week {current_week}/{total_weeks}"
    }


def get_learning_resources_tool(
    skill: str,
    topic: str,
    resource_type: str = "all"
) -> Dict[str, Any]:
    """
    Get recommended learning resources for a specific topic.
    
    Args:
        skill: The overall skill being learned
        topic: Specific topic within the skill
        resource_type: Type of resource (video/article/book/practice/all)
    
    Returns:
        Curated list of learning resources
    """
    # This would typically integrate with external APIs
    # For now, we'll use the Gemini model to suggest resources
    try:
        api_key = os.getenv('GOOGLE_AI_API_KEY')
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""Suggest learning resources for:
Skill: {skill}
Topic: {topic}
Resource type: {resource_type}

Provide 5-7 high-quality resources including:
- Online courses (Coursera, Udemy, etc.)
- YouTube channels/videos
- Books
- Practice platforms
- Documentation/Tutorials

Return as JSON array with: title, type, description, url (use placeholder for real URLs), difficulty"""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        if text.startswith('```json'):
            text = text.replace('```json', '').replace('```', '').strip()
        elif text.startswith('```'):
            text = text.replace('```', '').strip()
        
        resources = json.loads(text)
        
        return {
            "success": True,
            "skill": skill,
            "topic": topic,
            "resources": resources,
            "count": len(resources) if isinstance(resources, list) else 0,
            "message": f"Found resources for {topic}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to fetch resources"
        }


# Define the tools for the ADK agent
learning_plan_tool = Tool(
    name="generate_learning_plan",
    description="Generate a comprehensive learning plan for a specific skill with weekly breakdown",
    function=generate_learning_plan_tool,
    parameters=[
        Parameter(name="skill", type="string", description="The skill to learn", required=True),
        Parameter(name="duration_weeks", type="integer", description="Number of weeks", required=True),
        Parameter(name="hours_per_week", type="integer", description="Hours per week (default: 10)", required=False),
        Parameter(name="difficulty", type="string", description="Difficulty level: beginner/intermediate/advanced", required=False),
        Parameter(name="focus_areas", type="array", description="List of specific focus areas", required=False),
    ]
)

schedule_tool = Tool(
    name="suggest_study_schedule",
    description="Suggest an optimal study schedule based on available time and preferences",
    function=suggest_study_schedule_tool,
    parameters=[
        Parameter(name="available_hours", type="integer", description="Total hours available per week", required=True),
        Parameter(name="preferred_days", type="array", description="List of preferred days", required=True),
        Parameter(name="time_preference", type="string", description="Preferred time: morning/afternoon/evening", required=False),
    ]
)

progress_tool = Tool(
    name="analyze_learning_progress",
    description="Analyze learning progress and provide insights and recommendations",
    function=analyze_learning_progress_tool,
    parameters=[
        Parameter(name="completed_sessions", type="integer", description="Number of completed sessions", required=True),
        Parameter(name="total_sessions", type="integer", description="Total planned sessions", required=True),
        Parameter(name="current_week", type="integer", description="Current week number", required=True),
        Parameter(name="total_weeks", type="integer", description="Total weeks in plan", required=True),
    ]
)

resources_tool = Tool(
    name="get_learning_resources",
    description="Get recommended learning resources for a specific topic",
    function=get_learning_resources_tool,
    parameters=[
        Parameter(name="skill", type="string", description="The overall skill", required=True),
        Parameter(name="topic", type="string", description="Specific topic", required=True),
        Parameter(name="resource_type", type="string", description="Type: video/article/book/practice/all", required=False),
    ]
)


# Create the ADK Agent
def create_timetable_agent() -> Agent:
    """
    Create and configure the Timetable Learning Assistant Agent
    """
    agent = Agent(
        name="timetable_learning_assistant",
        model="gemini-2.0-flash-exp",  # Using the latest Gemini model
        instruction="""You are an expert learning assistant specializing in creating personalized learning plans and study schedules.

Your capabilities:
1. Generate comprehensive learning plans for any skill with weekly breakdowns
2. Suggest optimal study schedules based on user availability
3. Analyze learning progress and provide actionable recommendations
4. Recommend high-quality learning resources

When helping users:
- Be encouraging and supportive
- Provide specific, actionable advice
- Use the available tools to generate structured plans
- Consider the user's constraints (time, difficulty level, preferences)
- Give realistic timelines and expectations
- Break down complex skills into manageable chunks

Always use the appropriate tools to provide structured, data-driven responses.
When generating learning plans, ensure they are practical, progressive, and achievable.""",
        description="An AI assistant that helps create personalized learning plans and study schedules for any skill",
        tools=[
            learning_plan_tool,
            schedule_tool,
            progress_tool,
            resources_tool
        ]
    )
    
    return agent


# Initialize the agent
timetable_agent = create_timetable_agent()


def chat_with_agent(message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Have a conversation with the agent
    
    Args:
        message: User's message
        conversation_history: Previous conversation history (optional)
    
    Returns:
        Agent's response with updated conversation history
    """
    try:
        # Build conversation context
        context = []
        if conversation_history:
            context = conversation_history
        
        # Add user message
        context.append({"role": "user", "content": message})
        
        # Get agent response
        # Note: The actual ADK API might differ slightly
        # This is based on typical agent patterns
        response = timetable_agent.run(message, context=context)
        
        # Add agent response to context
        context.append({"role": "assistant", "content": response})
        
        return {
            "success": True,
            "response": response,
            "conversation_history": context
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to get agent response"
        }

