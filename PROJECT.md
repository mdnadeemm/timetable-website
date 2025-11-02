## Inspiration

As students and lifelong learners, we often struggle with creating structured, personalized learning plans that adapt to our schedules and learning styles. Traditional timetable apps are rigid and don't consider our individual learning goals or progress. We were inspired to build **AI TimeTable**—an intelligent timetable management system that combines the visual clarity of a weekly schedule with AI-powered learning plan generation.

The idea came from our own experiences juggling multiple learning goals, where we needed a tool that could:

- Generate personalized learning schedules based on our available time and skill level

- Break down complex learning goals into manageable weekly plans with specific tasks

- **Automatically generate detailed, context-aware content for each task** - transforming simple task titles into comprehensive learning guides

- Track our progress and adapt recommendations accordingly

- Provide a beautiful, intuitive interface that makes planning enjoyable rather than tedious

We wanted to leverage cutting-edge AI technology (Google's Gemini model via ADK) to create something that feels like having a personal learning coach available 24/7, helping us stay organized and motivated.

## What it does

**AI TimeTable** is an intelligent timetable management web application that transforms how you plan and track your learning journey. The application provides:

- **Interactive Timetable Grid**: A visual weekly schedule where you can see all your learning sessions, events, and commitments at a glance. Color-coded events make it easy to distinguish between different subjects or activities.

- **AI-Powered Learning Plan Generator**: Simply input what skill you want to learn, your available time, difficulty level, and focus areas. The AI generates a comprehensive, week-by-week learning plan with structured weekly objectives, pre-scheduled learning sessions optimized for your availability, task lists attached to each session, and learning objectives for each week.

- **Advanced Task Management**: Each event in your timetable can have associated tasks with drag-and-drop reordering, completion tracking, document attachments (PDF, Word, images), link attachments for external resources, and rich descriptions and metadata.

- **AI-Powered Task Content Generation**: A revolutionary feature that transforms simple task titles into comprehensive learning guides. Each task has a "Generate Content" button (✨ icon) that instantly creates detailed markdown content. The AI understands the task's relationship to the event, learning topic, week objectives, and overall learning plan. Generated content includes task overview and goals, prerequisites and required knowledge, context connecting to the learning plan, step-by-step instructions, curated resources and references, acceptance criteria (checklist format), deliverables specification, and optional extension activities. Generated markdown files are automatically attached to tasks, just like manual file uploads, and each generated guide is tailored specifically to that task, not generic templates.

- **Smart Features**: Week-based filtering to focus on specific time periods, search functionality to quickly find events, export/import capabilities for backup and sharing, dark mode support for comfortable viewing, and responsive design that works on desktop and mobile.

- **Intelligent Backend**: Powered by Google's Agent Development Kit (ADK), the backend provides multi-turn conversations with context awareness, tool-calling capabilities for structured operations, specialized sub-agents for different content generation needs (root agent for learning plan generation, single task content agent for detailed task guides, task content generator for batch processing), progress tracking and analysis, resource recommendations, and graceful fallback when the AI backend is unavailable.

## How we built it

### Frontend Architecture

We built the frontend using modern web technologies: React 18 with TypeScript for type-safe, component-based UI development, Vite for fast development and optimized production builds, Tailwind CSS for rapid, responsive styling with a custom design system, Radix UI components for accessible, customizable UI primitives, Context API for state management (TimetableContext, SettingsContext), @dnd-kit for smooth drag-and-drop interactions, and localStorage for persistent data storage.

### Backend Architecture

The backend is built with Python and integrates cutting-edge AI: FastAPI for high-performance, async API endpoints, Google ADK (Agent Development Kit) for intelligent agent capabilities, Gemini 2.5 Flash model for learning plan and content generation, custom tools implemented as ADK functions (generate_learning_plan, suggest_study_schedule, analyze_learning_progress, get_learning_resources), and a sub-agent architecture with root agent handling learning plan generation (returns JSON), single task content agent for generating detailed markdown content for individual tasks, and task content generator agent for generating content for all tasks in a learning plan (batch processing).

### Key Implementation Details

**Learning Plan Generation Flow**: User inputs learning parameters in the frontend, request sent to ADK backend via `/run` endpoint, root agent processes request using custom tools, response parsed and formatted into timetable events, and events automatically added to the schedule with tasks.

**Task Content Generation Flow**: User clicks "Generate Content" button on any task, frontend collects task, event, topic, and context information, request sent to ADK backend with explicit delegation instructions, root agent routes request to `single_task_content_agent` sub-agent, sub-agent generates detailed markdown content specific to that task, markdown converted to `TaskDocument` format, automatically attached to the task as a downloadable file, and user can view, download, or edit the generated content.

**Agent Routing Logic**: Root agent intelligently distinguishes between two request types - TYPE 1: Learning plan requests (contains "skill" and "duration") → Handles directly, returns JSON; TYPE 2: Single task content requests (contains "event" and "task") → Delegates to sub-agent, returns markdown. This prevents accidental delegation to ensure correct response formats.

**Task Management System**: Tasks stored within events with proper ordering, drag-and-drop reordering using `@dnd-kit`, file uploads handled via base64 encoding, documents and links stored with metadata, and generated markdown files treated as first-class documents.

**State Management**: Centralized context providers for timetable and settings, optimistic updates for better UX, automatic persistence to localStorage, event filtering and search capabilities, and loading states for async operations (content generation).

**UI/UX Enhancements**: Side panel for task management and event editing, tab navigation for different views, toast notifications for user feedback, loading indicators for AI operations, responsive breakpoints for mobile support, and one-click content generation with visual feedback.

## Challenges we ran into

1. **AI Response Parsing**: The biggest challenge was parsing structured JSON responses from the AI agent, which sometimes included markdown code blocks or extra text. We implemented robust JSON extraction logic that handles various response formats and edge cases.

2. **Agent Routing and Delegation**: Implementing the dual-agent system (root agent + sub-agents) required careful instruction design to prevent incorrect delegation. The root agent sometimes tried to delegate learning plan requests to content generation agents, causing markdown responses instead of JSON. We solved this with explicit TYPE 1 vs TYPE 2 request classification and strict routing rules.

3. **Backend Integration**: Integrating Google ADK required understanding the agent development paradigm, tool definitions, session management, and sub-agent delegation. We had to implement proper health checks, graceful fallback mechanisms when the backend is unavailable, and handle both JSON and markdown responses appropriately.

4. **Task Content Generation**: Converting AI-generated markdown into the application's document format required proper file type detection (text/markdown), base64 encoding for storage, filename generation from task titles, and ensuring generated content is contextually relevant to the specific task.

5. **State Synchronization**: Managing complex state between timetable events, tasks, and UI components while maintaining performance was challenging. We solved this with careful context design and optimized re-renders.

6. **Drag-and-Drop Implementation**: Implementing smooth drag-and-drop for tasks while maintaining order and state consistency required careful handling of the `@dnd-kit` library and state updates.

7. **File Upload Handling**: Supporting multiple file types (PDF, Word, images, markdown) with proper preview, base64 encoding, and storage in localStorage required careful memory management and UI considerations.

8. **TypeScript Type Safety**: Maintaining type safety across the entire application, especially with complex nested data structures (events → tasks → documents/links), required careful interface design and type guards.

9. **CORS and API Configuration**: Setting up proper CORS handling between frontend and backend, with environment-based configuration for development vs production, required careful API URL management.

10. **Week-Based Filtering**: Implementing efficient week filtering that works with both manually added events and AI-generated learning plans required careful state management and event organization.

11. **Response Format Handling**: Handling both JSON (learning plans) and markdown (task content) responses from the same API endpoint required careful response parsing and type checking.

## Accomplishments that we're proud of

1. **Seamless AI Integration**: Successfully integrated Google's ADK with custom tools and sub-agents, creating a powerful learning assistant that can generate personalized, structured learning plans with just a few inputs.

2. **Intelligent Task Content Generation**: Built a revolutionary feature that transforms simple task titles into comprehensive, context-aware learning guides. This feature demonstrates advanced AI agent orchestration and intelligent content generation.

3. **Multi-Agent Architecture**: Successfully implemented a sophisticated agent architecture with root agent for learning plan generation, specialized sub-agents for different content types, intelligent routing and delegation logic, and proper separation of concerns.

4. **Comprehensive Task Management**: Built a fully-featured task system with drag-and-drop, file attachments, link management, and AI-generated content—all within a clean, intuitive interface.

5. **Robust Fallback System**: Implemented a three-tier fallback system (ADK → Direct API → Local generation) ensuring the app always works, even when backend services are unavailable.

6. **Beautiful, Modern UI**: Created a polished, responsive interface using Tailwind CSS and Radix UI that rivals commercial applications, with smooth animations and excellent UX.

7. **Type Safety**: Maintained strong TypeScript typing throughout the codebase, catching errors at compile time and making the codebase more maintainable.

8. **Performance Optimization**: Implemented efficient state management and rendering strategies, ensuring smooth performance even with many events and tasks.

9. **Documentation**: Created comprehensive documentation including setup guides, API documentation, implementation notes, and architecture diagrams for future developers.

10. **Cross-Platform Compatibility**: Ensured the application works seamlessly across different browsers and devices, with responsive design that adapts to various screen sizes.

11. **User Experience**: Created intuitive one-click content generation with visual feedback (loading states, success/error notifications) that makes AI features feel magical and accessible.

## What we learned

1. **Agent Development**: We gained deep understanding of Google ADK, including how to structure agents, define tools, manage sessions, handle multi-turn conversations, and implement sub-agent delegation. This knowledge extends to modern AI agent architectures and orchestration patterns.

2. **Multi-Agent Systems**: We learned how to design and implement multi-agent systems where different agents handle different tasks, with proper routing and delegation logic. This includes understanding when to delegate vs when to handle requests directly.

3. **Content Generation**: We learned how to generate context-aware, structured content using AI agents, ensuring outputs are specific, relevant, and actionable rather than generic templates.

4. **Modern React Patterns**: We learned advanced React patterns including context composition, custom hooks, optimistic updates, proper component abstraction for maintainability, and handling async operations with loading states.

5. **API Design**: We learned how to design RESTful APIs with FastAPI, handle async operations, manage CORS, create robust error handling and fallback mechanisms, and handle different response formats (JSON vs markdown).

6. **State Management**: We learned to balance between local state, context state, and persistence, understanding when to use each approach for optimal performance and developer experience.

7. **TypeScript Advanced Types**: We explored advanced TypeScript features including discriminated unions, conditional types, proper type inference patterns, and handling complex nested data structures.

8. **File Handling**: We learned how to handle file uploads in the browser, encode files for storage, create preview interfaces for various file types, and integrate generated content seamlessly with manual uploads.

9. **UX Design Principles**: We learned the importance of loading states, error handling, user feedback (toasts), graceful degradation, and making AI features feel accessible and magical rather than intimidating.

10. **Development Workflow**: We learned to structure a full-stack project with proper separation of concerns, environment configuration, deployment considerations, and documentation practices.

11. **AI Response Handling**: We learned sophisticated techniques for parsing and handling different AI response formats, including JSON extraction, markdown processing, and error recovery.

## What's next for AI TimeTable

1. **Enhanced AI Features**: Real-time progress tracking with AI-powered insights, adaptive learning plan adjustments based on completion rates, personalized resource recommendations based on learning style, natural language queries for schedule modifications, batch task content generation for all tasks in an event or week at once, content refinement to edit and improve generated task content with AI assistance, and multi-language support to generate task content in different languages.

2. **Collaboration Features**: Share learning plans with friends and study groups, collaborative task management, social learning challenges and competitions, community-driven learning resource library, and shared task templates to share and discover task content templates.

3. **Analytics & Insights**: Learning analytics dashboard, time tracking and productivity metrics, goal achievement visualization, pattern recognition in learning habits, and content engagement tracking to see which generated content is most useful.

4. **Integration**: Calendar sync (Google Calendar, Outlook), integration with learning platforms (Coursera, Udemy, etc.), Notion/Notion API integration, mobile apps (iOS and Android), and export generated content to PDF, Word, or other formats.

5. **Advanced Features**: Recurring events and patterns, time zone support for global users, multi-language support, advanced export formats (iCal, PDF reports), AI-powered study reminders and motivation, content versioning to track changes to generated task content over time, and content templates to save and reuse task content templates.

6. **Performance & Scale**: Cloud backend deployment, database integration for larger datasets, caching strategies for faster AI responses, Progressive Web App (PWA) capabilities, and content caching to cache generated content to reduce API calls.

7. **Accessibility**: Full keyboard navigation support, screen reader optimization, high contrast mode, customizable font sizes, and audio content generation to generate audio versions of task content.

8. **Monetization** (Optional): Free tier with basic features, premium tier with advanced AI features and unlimited content generation, and educational institution licenses.

