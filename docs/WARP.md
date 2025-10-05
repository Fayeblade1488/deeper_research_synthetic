# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quickstart

### Prerequisites

- Node.js 14+ and npm
- Google Gemini API key
- Port 3001 (backend) and 5173 (frontend) available

### Running the Application

```bash
# Backend (Terminal 1)
cd backend
npm install
cp .env.example .env  # Add your GEMINI_API_KEY
npm run dev

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

Access at: http://localhost:5173

## Build, Lint, and Test Commands

### Backend Commands

```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start with hot-reload (nodemon)
npm start            # Production start
npm test             # Run tests (not configured yet)
```

### Frontend Commands

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Configuration

### Environment Variables (backend/.env)

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (with defaults)
PORT=3001
NODE_ENV=development
MAX_OUTPUT_TOKENS=32000
TEMPERATURE=0.7
TOP_P=0.95
TOP_K=40
FRAMEWORKS_PATH=../data/frameworks
```

## Architecture

### System Overview

```
Frontend (React/Vite) ←→ Backend (Express/Node.js) ←→ Gemini AI
    ↓                          ↓
  UI Components           Services Layer
                              ↓
                      Framework Prompts (filesystem)
```

### Core Backend Services

1. **frameworkService.js** - Manages framework prompts and constructs generation prompts
2. **generationService.js** - Orchestrates AI content generation via Gemini API
3. **validationService.js** - Validates output against framework requirements

### Data Flow

1. User creates project → selects framework type
2. User adds source context → triggers generation
3. Backend loads framework prompt → combines with source context
4. Gemini API generates content → streams via SSE
5. Validation service checks output → returns to frontend
6. Frontend displays results in grid layout

## Content Generation Frameworks

The system supports three distinct content generation frameworks:

### 1. PROJECT_DEEPDIVE

- **Purpose**: Academic-style white papers
- **Min Words**: 10,000
- **Requirements**: 
  - At least 5 main sections (## headers)
  - Citations required ([1], [2], etc.)
  - No bullet points
  - At least 10 subsections
- **Prompt Location**: `data/frameworks/deepdive/`

### 2. PROJECT_SYNTHETIC  

- **Purpose**: Narrative-driven podcast episodes
- **Min Words**: 15,000
- **Requirements**:
  - "Good morning" opener
  - "data infusion complete" closer
  - At least 3 Key Implication sections
- **Prompt Location**: `data/frameworks/synthetic/`

### 3. PROJECT_BENCHMARK

- **Purpose**: Data-driven dashboards with risk assessment
- **Min Words**: 5,000
- **Requirements**:
  - DEFCON assessment included
  - At least 10 data tables
  - Citations required
- **Prompt Location**: `data/frameworks/benchmark/`

## Key API Endpoints

### Projects

```bash
# Get all projects
curl http://localhost:3001/api/projects

# Create project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"My Analysis","framework":"PROJECT_DEEPDIVE"}'

# Get specific project
curl http://localhost:3001/api/projects/{id}

# Update project source context
curl -X PUT http://localhost:3001/api/projects/{id} \
  -H "Content-Type: application/json" \
  -d '{"sourceContext":"Your source material here..."}'

# Delete project
curl -X DELETE http://localhost:3001/api/projects/{id}
```

### Content Generation (SSE)

```bash
# Start generation (returns SSE stream)
curl -X POST http://localhost:3001/api/generate/{projectId} \
  -H "Content-Type: application/json" \
  -d '{"project":{"id":"...","framework":"...","sourceContext":"..."}}'

# Check generation status
curl http://localhost:3001/api/generate/{projectId}/status

# Cancel generation
curl -X DELETE http://localhost:3001/api/generate/{projectId}
```

### Server Status

```bash
curl http://localhost:3001/api/status
```

## Common Development Tasks

### Adding a New Framework

1. Define framework in `backend/services/frameworkService.js`:
```javascript
const FRAMEWORK_TYPES = {
  // ... existing frameworks
  PROJECT_NEWTYPE: {
    name: 'New Framework',
    outputType: 'new-type',
    minWords: 8000
  }
};
```

2. Add prompt file: `data/frameworks/newtype/newtype-template.txt`

3. Add validation in `backend/services/validationService.js`

4. Update frontend to support new framework type

### Running a Single Test

```bash
# Backend (when configured)
cd backend
npm test -- --testNamePattern="specific test name"

# Frontend (when configured)
cd frontend
npm test -- --testNamePattern="ComponentName"
```

### Debugging

1. **Backend**: Uses console logging, check terminal output
2. **Frontend**: Use browser DevTools, React DevTools
3. **API Issues**: Check network tab for failed requests
4. **Generation Issues**: Monitor SSE stream in Network tab

### Common Issues

- **Port 3001 in use**: Kill existing process or change PORT in .env
- **CORS errors**: Ensure backend is running on port 3001
- **Generation fails**: Check GEMINI_API_KEY is valid
- **Validation errors**: Review framework requirements in validationService.js
- **Apple Silicon**: No special configuration needed for this Node.js app

## Project Structure

```
.
├── backend/
│   ├── config/              # Configuration files
│   ├── routes/              # API route handlers
│   ├── services/            # Business logic
│   ├── server.js            # Express server entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
├── data/
│   ├── frameworks/          # Framework prompt templates
│   └── reports/             # Generated content examples
└── docs/                    # Documentation
```

## Production Deployment

See `docs/DEPLOYMENT_GUIDE.md` for detailed deployment instructions. Key points:

- Set NODE_ENV=production
- Use proper process manager (PM2, systemd)
- Configure reverse proxy (Nginx, Caddy)
- Set up SSL/TLS certificates
- Implement rate limiting
- Add authentication (not currently implemented)

## Testing Strategy

- **Unit Tests**: Test services in isolation (frameworkService, validationService)
- **Integration Tests**: Test API endpoints with mocked Gemini
- **E2E Tests**: Test critical user flows (create project → generate → validate)

Current test coverage goals:
- Framework Service: 80%+
- Generation Service: 75%+
- Validation Service: 90%+
- API Routes: 100%

## Notes

- Project uses in-memory storage (no database currently)
- SSE (Server-Sent Events) for real-time generation updates
- No authentication/authorization implemented yet
- Validation is synchronous post-generation
- Framework prompts loaded from filesystem on each request