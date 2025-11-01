# Complete Setup Guide

This guide will walk you through setting up both the frontend and backend of the Timetable application.

## Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download](https://www.python.org/) (Optional, for AI features)
- **Google AI API Key** - [Get one here](https://aistudio.google.com/app/apikey)

## Quick Start

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
echo "VITE_GOOGLE_AI_API_KEY=your_api_key_here" > .env

# Start dev server
npm run dev
```

### 2. Backend Setup (Optional - for AI Learning Plans)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# The .env file is already copied from frontend

# Start server
python main.py
```

## Detailed Setup

### Frontend (React + TypeScript)

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd timetable-website
   npm install
   ```

2. **Environment Variables**
   
   Create a `.env` file in the project root:
   ```env
   VITE_GOOGLE_AI_API_KEY=your_actual_api_key_here
   VITE_BACKEND_URL=http://localhost:8000
   ```

   - `VITE_GOOGLE_AI_API_KEY`: Your Google AI API key
   - `VITE_BACKEND_URL`: Backend server URL (optional, defaults to http://localhost:8000)

3. **Get Google AI API Key**
   - Visit https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key to your `.env` file

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The app will open at `http://localhost:5173`

### Backend (Python + FastAPI)

1. **Navigate to Backend Directory**
   ```bash
   cd backend
   ```

2. **Create Virtual Environment**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   
   Create `backend/.env` file:
   ```env
   GOOGLE_AI_API_KEY=your_api_key_here
   PORT=8000
   HOST=0.0.0.0
   ```

   Or copy from the frontend:
   ```bash
   # Windows
   Copy-Item ..\.env .env
   
   # macOS/Linux
   cp ../.env .env
   ```

5. **Start Backend Server**
   ```bash
   # Using the start script
   # Windows
   .\start.ps1
   
   # macOS/Linux
   chmod +x start.sh
   ./start.sh

   # Or manually
   python main.py
   
   # Or with uvicorn
   uvicorn main:app --reload --port 8000
   ```

6. **Verify Backend is Running**
   - Open http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/health

## How It Works

### Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│  React Frontend │────────▶│  Python Backend  │────────▶│  Google AI API │
│  (Port 5173)    │         │  (Port 8000)     │         │                │
└─────────────────┘         └──────────────────┘         └────────────────┘
        │                            │
        │                            │
        └────────────────────────────┘
         (Fallback: Direct API Call)
```

### Learning Plan Generation Priority

1. **Python Backend** (Preferred)
   - More secure (API key on server)
   - Uses official Google Python SDK
   - Better error handling
   - Rate limiting support

2. **Direct API Call** (Fallback)
   - Works without backend
   - API key in browser
   - Simpler setup

3. **Static Fallback** (Last Resort)
   - No API needed
   - Basic template-based plans

## Running in Production

### Frontend

```bash
# Build
npm run build

# Preview
npm run preview

# Or deploy to Vercel, Netlify, etc.
```

### Backend

```bash
# Install production dependencies
pip install -r requirements.txt

# Run with Gunicorn (recommended)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or use uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Troubleshooting

### Frontend Issues

**Issue**: Environment variables not loading
- **Solution**: Restart dev server after creating/modifying `.env`

**Issue**: API key error
- **Solution**: Check `.env` file is in project root and has correct format

### Backend Issues

**Issue**: Port 8000 already in use
- **Solution**: Change PORT in `backend/.env` or stop other processes

**Issue**: Module not found
- **Solution**: Activate virtual environment and run `pip install -r requirements.txt`

**Issue**: CORS errors
- **Solution**: Check that frontend URL is in CORS allowed origins in `main.py`

### Common Issues

**Issue**: Learning plans not generating
1. Check backend is running: http://localhost:8000/api/health
2. Check API key is valid
3. Check browser console for errors

**Issue**: Backend not detected by frontend
- **Solution**: Ensure backend is running on port 8000 and CORS is configured

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **API Testing**: Use http://localhost:8000/docs for interactive API testing
3. **Logs**: Check terminal for both frontend and backend logs
4. **Environment**: Always restart servers after changing `.env` files

## Support

For issues or questions:
1. Check browser console for frontend errors
2. Check terminal for backend errors
3. Verify API key is valid
4. Ensure both servers are running

