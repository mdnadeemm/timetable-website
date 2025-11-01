# Google ADK Agent Implementation

This backend now includes an advanced AI agent built with Google's Agent Development Kit (ADK), providing enhanced learning assistance capabilities.

## Overview

The ADK agent extends the basic timetable functionality with:
- **Multi-turn conversations** with context awareness
- **Tool-calling capabilities** for structured operations
- **Advanced reasoning** for personalized learning plans
- **Progress tracking and analysis**
- **Resource recommendations**

## Installation

### Install Google ADK

```bash
cd backend
pip install google-adk
```

Or install all dependencies:

```bash
pip install -r requirements.txt
```

### Environment Setup

Ensure your `.env` file (in the backend directory) contains:

```
GOOGLE_AI_API_KEY=your_api_key_here
PORT=8000
HOST=0.0.0.0
```

Get your API key from: https://aistudio.google.com/app/apikey

## Architecture

### Files Structure

```
backend/
├── main.py              # FastAPI app with ADK endpoints
├── adk_agent.py         # ADK agent configuration and tools
├── requirements.txt     # Python dependencies
└── .env                 # Environment variables
```

### Agent Components

#### 1. **Timetable Learning Assistant Agent**
The main agent (`timetable_agent`) is configured with:
- Model: `gemini-2.0-flash-exp` (latest Gemini model)
- Instructions: Expert learning planner persona
- Tools: 4 specialized tools for learning assistance

#### 2. **Custom Tools**

| Tool | Purpose | Parameters |
|------|---------|------------|
| `generate_learning_plan` | Create comprehensive learning plans | skill, duration_weeks, hours_per_week, difficulty, focus_areas |
| `suggest_study_schedule` | Generate optimal study schedules | available_hours, preferred_days, time_preference |
| `analyze_learning_progress` | Track and analyze learning progress | completed_sessions, total_sessions, current_week, total_weeks |
| `get_learning_resources` | Recommend learning resources | skill, topic, resource_type |

## API Endpoints

### Agent Status

**GET** `/api/agent/status`

Check if the ADK agent is available and get agent information.

**Response:**
```json
{
  "available": true,
  "agent_name": "timetable_learning_assistant",
  "model": "gemini-2.0-flash-exp",
  "tools_available": [
    "generate_learning_plan",
    "suggest_study_schedule",
    "analyze_learning_progress",
    "get_learning_resources"
  ],
  "message": "ADK agent is ready"
}
```

### Chat with Agent

**POST** `/api/agent/chat`

Have a multi-turn conversation with the agent. The agent can use any of its tools automatically.

**Request:**
```json
{
  "message": "I want to learn Python in 4 weeks with 10 hours per week",
  "conversation_history": []
}
```

**Response:**
```json
{
  "success": true,
  "response": "I'll help you create a Python learning plan...",
  "conversation_history": [
    {"role": "user", "content": "I want to learn Python..."},
    {"role": "assistant", "content": "I'll help you..."}
  ]
}
```

### Generate Learning Plan (Enhanced)

**POST** `/api/agent/generate-plan`

Generate a learning plan using the ADK agent's tool. Falls back to standard generation if ADK is unavailable.

**Request:**
```json
{
  "skill": "Python Programming",
  "duration": 4,
  "hoursPerWeek": 10,
  "difficulty": "beginner",
  "focusAreas": ["web development", "data analysis"]
}
```

### Suggest Study Schedule

**POST** `/api/agent/suggest-schedule`

Get personalized schedule suggestions.

**Request:**
```json
{
  "available_hours": 10,
  "preferred_days": ["Monday", "Wednesday", "Friday"],
  "time_preference": "evening"
}
```

**Response:**
```json
{
  "success": true,
  "totalHours": 10,
  "sessionsPerWeek": 3,
  "schedule": [
    {
      "day": 1,
      "dayName": "Monday",
      "startTime": "6:00 PM",
      "endTime": "8:00 PM",
      "duration": 2
    }
  ]
}
```

### Analyze Progress

**POST** `/api/agent/analyze-progress`

Get detailed progress analysis with recommendations.

**Request:**
```json
{
  "completed_sessions": 15,
  "total_sessions": 40,
  "current_week": 2,
  "total_weeks": 8
}
```

**Response:**
```json
{
  "success": true,
  "completionRate": 37.5,
  "weekProgress": 25.0,
  "onTrack": true,
  "status": "Good",
  "recommendations": [
    "Excellent progress! Keep up the great work"
  ]
}
```

### Get Learning Resources

**POST** `/api/agent/get-resources`

Get curated learning resources for specific topics.

**Request:**
```json
{
  "skill": "Python Programming",
  "topic": "Object-Oriented Programming",
  "resource_type": "all"
}
```

## Usage Examples

### Python Client Example

```python
import requests

BASE_URL = "http://localhost:8000"

# Check agent status
response = requests.get(f"{BASE_URL}/api/agent/status")
print(response.json())

# Chat with agent
chat_data = {
    "message": "Create a 3-week plan to learn React"
}
response = requests.post(f"{BASE_URL}/api/agent/chat", json=chat_data)
print(response.json()["response"])

# Suggest schedule
schedule_data = {
    "available_hours": 12,
    "preferred_days": ["Monday", "Wednesday", "Friday", "Saturday"],
    "time_preference": "morning"
}
response = requests.post(f"{BASE_URL}/api/agent/suggest-schedule", json=schedule_data)
print(response.json())
```

### JavaScript/TypeScript Client Example

```typescript
// Check agent availability
const checkAgent = async () => {
  const response = await fetch('http://localhost:8000/api/agent/status');
  const data = await response.json();
  console.log('Agent status:', data);
};

// Chat with agent
const chatWithAgent = async (message: string) => {
  const response = await fetch('http://localhost:8000/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_history: []
    })
  });
  const data = await response.json();
  return data;
};

// Use it
chatWithAgent("I need help planning my learning schedule")
  .then(result => console.log(result.response));
```

### cURL Examples

```bash
# Check status
curl http://localhost:8000/api/agent/status

# Chat with agent
curl -X POST http://localhost:8000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a 4-week learning plan for JavaScript"
  }'

# Get schedule suggestions
curl -X POST http://localhost:8000/api/agent/suggest-schedule \
  -H "Content-Type: application/json" \
  -d '{
    "available_hours": 15,
    "preferred_days": ["Monday", "Wednesday", "Friday"],
    "time_preference": "evening"
  }'
```

## Testing the Backend ADK Agent

Before deploying or using the agent, you should test it to ensure everything is working correctly.

### Run the Test Suite

```bash
cd backend
python test_adk_agent.py
```

This will test:
- Environment configuration
- Module imports
- Agent initialization
- All tool functions (learning plan, schedule, progress, resources)

The test suite will provide detailed output and indicate any issues that need to be resolved.

## Running the Server

### Development Mode

```bash
cd backend
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using the Start Scripts

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Linux/Mac:**
```bash
./start.sh
```

## Running ADK API Server

For local development and testing, you can run the ADK agent directly using the ADK CLI:

```bash
cd backend/agents
adk api_server
```

This will start the ADK API server locally, allowing you to interact with the `learning_plan_agent` directly through the ADK interface.

**Note:** Make sure you have the ADK CLI installed:
```bash
pip install google-adk[cli]
```

## Deploying to Cloud Run

To deploy the learning plan agent to Google Cloud Run:

```bash
cd backend/agents
adk deploy cloud_run learning_plan_agent
```

This command will:
1. Package the agent
2. Build a container image
3. Deploy to Google Cloud Run
4. Provide you with the deployment URL

**Prerequisites:**
- Google Cloud SDK installed and configured
- Appropriate permissions for Cloud Run deployment
- Project billing enabled (if required)

**After deployment:**
- The agent will be accessible via the provided Cloud Run URL
- You can integrate this URL into your frontend application
- The agent will automatically scale based on traffic

## Features & Benefits

### 1. **Conversational Interface**
- Natural language interaction
- Context-aware responses
- Multi-turn conversations with memory

### 2. **Intelligent Tool Selection**
- Agent automatically chooses the right tool for the task
- Combines multiple tools when needed
- Provides structured, actionable outputs

### 3. **Personalized Learning**
- Adapts to user's skill level and preferences
- Considers time constraints and goals
- Provides realistic, achievable plans

### 4. **Progress Tracking**
- Monitors learning progress
- Identifies when users fall behind
- Provides actionable recommendations

### 5. **Resource Discovery**
- Curates high-quality learning materials
- Recommends appropriate resources for skill level
- Covers multiple learning modalities

## Fallback Behavior

The system is designed with graceful degradation:

1. **ADK Agent Available**: Uses advanced agent with tool-calling
2. **ADK Not Available**: Falls back to standard Gemini API
3. **All API Fails**: Uses local fallback generation

This ensures the system always works, even with partial failures.

## Troubleshooting

### ADK Not Available

If you see "ADK not available" errors:

```bash
# Reinstall google-adk
pip uninstall google-adk
pip install google-adk

# Verify installation
python -c "import google.adk; print('ADK installed')"
```

### API Key Issues

Ensure your `.env` file is in the `backend` directory and contains a valid API key:

```
GOOGLE_AI_API_KEY=AIza...your-key-here
```

### Import Errors

If you get import errors:

```bash
# Ensure all dependencies are installed
pip install -r requirements.txt

# Check Python version (3.10+ recommended)
python --version
```

### Port Already in Use

If port 8000 is busy:

```bash
# Change port in .env file
PORT=8001

# Or specify when running
uvicorn main:app --port 8001
```

## Advanced Configuration

### Custom Agent Instructions

Edit `adk_agent.py` to customize the agent's behavior:

```python
agent = Agent(
    name="your_custom_agent",
    model="gemini-2.0-flash-exp",
    instruction="Your custom instructions here...",
    tools=[your_custom_tools]
)
```

### Adding New Tools

Create new tools in `adk_agent.py`:

```python
def my_custom_tool(param1: str, param2: int) -> Dict[str, Any]:
    """
    Description of what your tool does
    """
    # Your implementation
    return {"success": True, "result": "..."}

# Register the tool
custom_tool = Tool(
    name="my_custom_tool",
    description="Tool description",
    function=my_custom_tool,
    parameters=[...]
)

# Add to agent
agent = Agent(
    ...
    tools=[..., custom_tool]
)
```

## Integration with Frontend

To integrate with your React frontend:

1. Check agent availability on app load
2. Use the chat endpoint for conversational UI
3. Use specialized endpoints for specific features
4. Maintain conversation history for context

See the existing `backendApi.ts` file for examples.

## Resources

- [Google ADK Documentation](https://github.com/google/adk-python)
- [ADK Samples](https://github.com/google/adk-samples)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## License

Same as the parent project.


