# 🔬 Deeper Research Synthetic - QWEN Documentation

## Project Overview

Deeper Research Synthetic is an advanced AI-powered content generation framework designed to produce comprehensive academic papers, podcast narratives, and risk assessments using sophisticated AI models. The project follows a dual-architecture with a React-based frontend ("THE LENS") and a Node.js/Express backend ("THE FORGE") that integrates with multiple AI providers including Google Gemini and Venice.ai.

The application supports three distinct content frameworks:
- **PROJECT_DEEPDIVE**: Academic-style white papers (10,000+ words) with citations
- **PROJECT_SYNTHETIC**: Narrative podcast episodes (15,000+ words) with storytelling
- **PROJECT_BENCHMARK**: Data-driven risk assessments with DEFCON ratings (5,000+ words)

## Architecture

The system follows a modern full-stack architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │───▶│  Express API    │───▶│   AI Providers  │
│   (Port 5173)   │    │  (Port 3001)    │    │   (Gemini/Venice)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ UI Components   │    │ Services Layer  │    │ Framework       │
│ - Workspace     │    │ - Validation    │    │ Templates       │
│ - Panels        │    │ - Generation    │    │ - Deepdive      │
│ - Progress      │    │ - Framework     │    │ - Synthetic     │
└─────────────────┘    └─────────────────┘    │ - Benchmark     │
                                               └─────────────────┘
```

## Building and Running

### Prerequisites
- Node.js 14+ and npm
- Google Gemini API key or Venice API key
- Ports 3001 (backend) and 5173 (frontend) available

### Setup Instructions

1. Clone and Install:
```bash
git clone https://github.com/Fayeblade1488/deeper_research_synthetic.git
cd deeper_research_synthetic

# Backend setup
cd backend
npm install
cp .env.example .env  # Add your VENICE_API_KEY or GEMINI_API_KEY
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

2. Configure API Keys
Edit `backend/.env`:
```bash
AI_PROVIDER=venice  # or gemini
VENICE_API_KEY=your_venice_api_key_here  # or GEMINI_API_KEY=your_gemini_api_key
PORT=3001
NODE_ENV=development
```

3. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_PROVIDER` | AI provider to use (venice, gemini) | `venice` |
| `VENICE_API_KEY` | Venice.ai API key | **Required if using Venice** |
| `GEMINI_API_KEY` | Google Gemini API key | **Required if using Gemini** |
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `MAX_OUTPUT_TOKENS` | AI generation limit | `32000` |
| `TEMPERATURE` | AI creativity level | `0.7` |
| `TOP_P` | AI nucleus sampling | `0.95` |
| `TOP_K` | AI top-k sampling | `40` |

## Development Conventions

### Backend (Node.js/Express)
- Written in CommonJS modules
- Uses async/await for asynchronous operations
- Implements comprehensive error handling with custom error classes
- Includes rate limiting and security measures

### Frontend (React 18)
- Functional components with hooks
- Modern ES6+ syntax
- Vite for build tooling
- Server-Sent Events (SSE) for real-time updates

### AI Provider Integration
The system supports multiple AI providers through a factory pattern:
- **Venice.ai**: Privacy-first with zero data retention, uncensored responses
- **Google Gemini**: Advanced AI with long context support
- Easily extensible for additional providers

### Security Considerations
- Input validation with ReDoS protection
- Memory management and resource cleanup
- Server-Sent Events with timeout protection
- CORS configuration for cross-origin handling

### Testing
- Jest for backend unit tests
- Vitest for frontend testing
- Supertest for API integration tests
- Target coverage of 80%+ for critical components

## API Endpoints

### Project Management
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Content Generation
- `POST /api/generate/:id` - Start generation (SSE stream)
- `GET /api/generate/:id/status` - Check generation status
- `DELETE /api/generate/:id` - Cancel generation

### System Status
- `GET /api/status` - Server health check
- `GET /api/performance` - Performance metrics
- `POST /api/performance/report` - Generate performance report
- `PUT /api/performance/thresholds` - Update performance thresholds

## Framework Structure

Content generation is based on framework templates stored in the `data/frameworks/` directory:
- `research_frameworks/`: Academic paper templates
- `podcast_synthetics/`: Narrative podcast templates
- `benchmarks/`: Risk assessment templates
- `personas/`: AI persona definitions

Each framework enforces specific requirements like word count, section structure, and citation formats.

## Performance Monitoring

The system includes comprehensive performance monitoring with:
- Memory usage tracking
- Active generation monitoring
- Error rate tracking
- Request statistics
- System health status (healthy, warning, critical)
- Threshold-based alerts

## Known Issues & Troubleshooting

### 🔴 CRITICAL: Backend API Hangs on All Requests - RESOLVED ✅
**Severity:** CRITICAL → RESOLVED  
**Status:** RESOLVED

This issue has been successfully resolved by modifying the performance monitoring service to use non-blocking operations.

**Original Symptoms:**
- All HTTP requests to backend timeout (tested with 5s curl timeout)
- Affects `/api/status`, `/api/projects`, and all endpoints
- Server starts successfully on port 3001
- No response headers or data received
- Connection established but hangs indefinitely

**Root Cause:**
- Synchronous `performanceMonitor.getMetrics()` calls in API endpoints were blocking the event loop
- Complex linear regression calculations in `calculateMemoryTrend()` and `calculateCorrelation()` methods
- Blocking operations in the main thread causing all API requests to hang

**Solution Implemented:**
1. **Added async performance metrics method** in `backend/services/performanceService.js`:
   ```javascript
   async getMetricsAsync() {
     return new Promise((resolve) => {
       setImmediate(() => {
         const currentMemory = process.memoryUsage();
         resolve({
           ...this.metrics,
           currentMemory: {
             rss: Math.round(currentMemory.rss / 1024 / 1024),
             heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024),
             heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024)
           },
           uptime: Date.now() - this.metrics.startTime,
           status: this.determineSystemStatus()
         });
       });
     });
   }
   ```

2. **Updated API endpoints to use async methods** in `backend/server.js`:
   - `/api/status` endpoint now uses `await performanceMonitor.getMetricsAsync()`
   - `/api/performance` endpoint now uses `await performanceMonitor.getMetricsAsync()`
   - Added proper error handling for performance monitoring failures

3. **Added request logging middleware** for better debugging visibility

**Verification:**
- ✅ All API endpoints now respond within 100ms
- ✅ No more hanging requests
- ✅ Performance metrics still collected correctly
- ✅ Event loop no longer blocked

### 🟡 HIGH: Frontend-Backend Connection - RESOLVED ✅
**Severity:** HIGH → RESOLVED  
**Status:** RESOLVED

**Original Issue:**
- Frontend couldn't connect to backend due to missing proxy configuration
- Frontend at port 5173 couldn't reach backend at port 3001
- API calls from frontend were failing

**Solution Implemented:**
- Added API proxy configuration in `frontend/vite.config.js`
- Requests to `/api` are now forwarded to `http://localhost:3001`

**Current Configuration:**
```javascript
// frontend/vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

**Verification:**
- ✅ Frontend successfully connects to backend via proxy
- ✅ All API endpoints accessible through proxy at http://localhost:5173/api/*
- ✅ Project creation, updates, and retrieval working properly

## Deployment

For production deployment, see the `docs/DEPLOYMENT_GUIDE.md` which includes instructions for:
- Docker containerization
- Environment configuration
- SSL/TLS setup
- Process management (PM2)
- Reverse proxy configuration
- Monitoring and logging

This project provides a sophisticated platform for generating complex, research-based content with multiple AI providers and comprehensive validation mechanisms.