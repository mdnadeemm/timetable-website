# Backend Setup Instructions

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Environment File

Create a `.env` file in the `backend` directory with the following content:

```env
# Google AI API Key
# Get your API key from: https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY=your_actual_api_key_here

# Server Configuration
PORT=8000
HOST=0.0.0.0
```

**Important:** Replace `your_actual_api_key_here` with your actual Google AI API key.

### 3. Get Your API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Paste it in your `.env` file

### 4. Run the Server

**Option 1: Using Python directly**
```bash
python main.py
```

**Option 2: Using uvicorn**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Option 3: Using start script (Windows)**
```powershell
.\start.ps1
```

**Option 4: Using start script (Linux/Mac)**
```bash
chmod +x start.sh
./start.sh
```

### 5. Verify Installation

The server should start on `http://localhost:8000`

Open your browser and visit:
- `http://localhost:8000` - API status
- `http://localhost:8000/docs` - Interactive API documentation (Swagger UI)
- `http://localhost:8000/api/health` - Health check
- `http://localhost:8000/api/agent/status` - ADK agent status

## Testing the ADK Agent

Run the test suite to verify everything is working:

```bash
cd backend
python test_adk_agent.py
```

This will test:
- Environment configuration
- ADK imports
- Agent initialization
- All custom tools
- API integration

Expected output:
```
============================================================
ADK Agent Test Suite
============================================================

Testing environment configuration...
✓ Environment configured correctly
  - API Key: AIzaSyB...xyz

Testing imports...
✓ All imports successful

Testing agent initialization...
✓ Agent initialized
  - Name: timetable_learning_assistant
  - Model: gemini-2.0-flash-exp

...

============================================================
Test Summary
============================================================
✓ PASS: Environment
✓ PASS: Imports
✓ PASS: Agent Init
✓ PASS: Schedule Tool
✓ PASS: Progress Tool
✓ PASS: Learning Plan Tool
✓ PASS: Resources Tool
------------------------------------------------------------
Results: 7/7 tests passed (100.0%)
============================================================

🎉 All tests passed! The ADK agent is ready to use.
```

## Troubleshooting

### ImportError: No module named 'google.adk'

**Solution:**
```bash
pip install google-adk
```

If that fails, try:
```bash
pip install --upgrade pip
pip install google-adk
```

### API Key Not Found

**Error:** `GOOGLE_AI_API_KEY not found in environment variables`

**Solution:**
1. Ensure you have a `.env` file in the `backend` directory
2. Check the file contains: `GOOGLE_AI_API_KEY=your_key`
3. Restart the server after creating/modifying the `.env` file

### Port Already in Use

**Error:** `OSError: [Errno 48] Address already in use`

**Solution:**
Change the port in your `.env` file:
```env
PORT=8001
```

Or specify a different port when running:
```bash
uvicorn main:app --port 8001
```

### ADK Agent Not Available

If you see "ADK agent not available" messages:

1. **Check installation:**
   ```bash
   python -c "import google.adk; print('ADK installed successfully')"
   ```

2. **Reinstall if needed:**
   ```bash
   pip uninstall google-adk
   pip install google-adk
   ```

3. **Check Python version:**
   The ADK requires Python 3.10 or higher:
   ```bash
   python --version
   ```

### API Rate Limits

If you encounter rate limit errors:

1. The free tier has limits on API calls per minute
2. Wait a few minutes and try again
3. Consider upgrading your API key quota
4. Implement caching for repeated requests

## Development Tips

### Enable Debug Mode

For more verbose logging:

```bash
# Linux/Mac
export DEBUG=1
python main.py

# Windows PowerShell
$env:DEBUG=1
python main.py
```

### Hot Reload

Use uvicorn with `--reload` for automatic server restart on code changes:

```bash
uvicorn main:app --reload
```

### CORS Configuration

To allow additional origins, edit `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://yourdomain.com",  # Add your domain
    ],
    ...
)
```

### Using a Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Deactivate when done
deactivate
```

## Production Deployment

### Using Gunicorn (Linux/Mac)

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000
ENV HOST=0.0.0.0

CMD ["python", "main.py"]
```

Build and run:
```bash
docker build -t timetable-backend .
docker run -p 8000:8000 --env-file .env timetable-backend
```

### Environment Variables for Production

```env
GOOGLE_AI_API_KEY=your_production_key
PORT=8000
HOST=0.0.0.0
PYTHONUNBUFFERED=1
LOG_LEVEL=info
```

## API Documentation

Once the server is running, visit:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

These provide interactive documentation for all endpoints.

## Next Steps

1. ✅ Set up environment variables
2. ✅ Install dependencies
3. ✅ Run the server
4. ✅ Test with test script
5. 📝 Integrate with frontend
6. 🚀 Deploy to production

For detailed API documentation, see [ADK_AGENT_README.md](./ADK_AGENT_README.md)

## Support

- **Google AI Studio:** https://aistudio.google.com/
- **ADK Documentation:** https://github.com/google/adk-python
- **FastAPI Documentation:** https://fastapi.tiangolo.com/

