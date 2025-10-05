# QWEN.md for Deeper Research Synthetic

## Project Overview

The Deeper Research Synthetic project is an AI-powered content generation framework that transforms raw data into comprehensive academic papers, podcast narratives, and risk assessments. It leverages Google Gemini AI for sophisticated content generation, featuring real-time streaming generation with Server-Sent Events (SSE) and intelligent validation.

### Key Features:
- **Multi-Framework Content Generation**:
  - PROJECT_DEEPDIVE: Academic white papers with citations and research depth
  - PROJECT_SYNTHETIC: Narrative-driven podcast episodes with engaging storytelling
  - PROJECT_BENCHMARK: Data-driven risk assessments with DEFCON ratings
- **Advanced AI Integration**: Powered by Google Gemini AI for sophisticated content generation
- **Production-Ready Security**: Comprehensive input validation, ReDoS protection, rate limiting
- **Modern Tech Stack**: Node.js/Express.js backend with React 18 frontend

## Architecture

The project follows a three-tier architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │───▶│  Express API    │───▶│   Gemini AI     │
│   (Port 5173)   │    │  (Port 3001)    │    │   Generation    │
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

## Project Structure

```
deeper-research-synthetic/
├── backend/                    # Express.js API server
│   ├── config/                # Configuration files
│   ├── routes/                # API route handlers
│   ├── services/              # Business logic
│   │   ├── frameworkService.js   # Framework management
│   │   ├── generationService.js  # AI generation
│   │   ├── validationService.js  # Content validation
│   │   └── performanceService.js # Performance monitoring
│   ├── tests/                 # Backend tests
│   ├── server.js              # Express server entry
│   └── package.json           # Dependencies
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API client
│   │   └── App.jsx            # Main application
│   ├── templates/             # UI templates
│   ├── tests/                 # Frontend tests
│   └── package.json           # Dependencies
├── data/                       # Framework data
│   ├── frameworks/            # Generation templates
│   │   ├── personas/          # AI personas
│   │   ├── podcast_synthetics/ # Podcast frameworks
│   │   ├── research_frameworks/ # Research templates
│   │   ├── benchmarks/        # Risk assessment
│   │   └── scratchpads/       # Working drafts
│   └── reports/               # Generated content
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── .gitignore                  # Git ignore patterns
├── CODEOWNERS                  # Code ownership
├── SECURITY.md                 # Security policy
├── HOW_TO_USE.md               # Beginner guide
└── README.md                   # Main documentation
```

## Building and Running

### Prerequisites
- Node.js 14+ and npm
- Google Gemini API key
- Ports 3001 (backend) and 5173 (frontend) available

### 1. Clone and Install
```bash
git clone https://github.com/Fayeblade1488/deeper_research_synthetic.git
cd deeper_research_synthetic

# Backend setup
cd backend
npm install
cp .env.example .env  # Add your GEMINI_API_KEY
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

### 2. Configure API Key
Edit `backend/.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
```

### 3. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Endpoints

### Projects Management
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Content Generation
- `POST /api/generate/:id` - Start generation (SSE stream)
- `GET /api/generate/:id/status` - Check generation status
- `DELETE /api/generate/:id` - Cancel generation

### System Information
- `GET /api/status` - Server health check
- `GET /api/performance` - Detailed performance metrics
- `POST /api/performance/report` - Generate performance report

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | **Required** |
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `MAX_OUTPUT_TOKENS` | AI generation limit | `32000` |
| `TEMPERATURE` | AI creativity level | `0.7` |
| `TOP_P` | AI nucleus sampling | `0.95` |
| `TOP_K` | AI top-k sampling | `40` |

## Content Frameworks

### Academic Papers (PROJECT_DEEPDIVE)
- Minimum 10,000 words
- At least 5 main sections
- Citation requirements
- No bullet points (flowing paragraphs)
- 10+ subsections for detail

### Podcast Scripts (PROJECT_SYNTHETIC)
- Minimum 15,000 words
- "Good morning" opener
- "Data infusion complete" closer
- 3+ Key Implication sections
- Engaging storytelling format

### Risk Assessments (PROJECT_BENCHMARK)
- Minimum 5,000 words
- DEFCON crisis ratings
- 10+ data tables required
- Citations and sourcing
- Quantitative analysis

## Development Conventions

### Backend Services Architecture
The backend services follow a modular approach:
- **frameworkService.js**: Handles framework-specific logic and prompt construction
- **generationService.js**: Manages AI content generation with streaming
- **validationService.js**: Ensures generated content meets quality standards
- **performanceService.js**: Monitors system performance and resource usage

### Security Best Practices
- Input validation and sanitization on all endpoints
- ReDoS (Regular Expression Denial of Service) protection
- Rate limiting and resource management
- Secure API key handling
- CORS configuration with security in mind

### Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Run specific test suites
npm test -- --testNamePattern="ValidationService"
npm test -- --testNamePattern="Generation Routes"
```

## Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- ESLint configuration for JavaScript
- React best practices
- Node.js conventions
- Comprehensive testing required

## Security Measures

The project implements enterprise-grade security measures:
- ✅ **Input Validation**: Comprehensive request sanitization
- ✅ **ReDoS Protection**: Regex timeout protection
- ✅ **Rate Limiting**: Prevents API abuse
- ✅ **Memory Management**: Resource cleanup and monitoring
- ✅ **CORS Configuration**: Secure cross-origin handling
- ✅ **Environment Security**: Secure secret management

## Deployment

See [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions including:
- Docker containerization
- Environment configuration
- SSL/TLS setup
- Process management (PM2)
- Reverse proxy configuration
- Monitoring and logging

## Dependencies

### Backend
- `@google/generative-ai`: For Gemini API integration
- `cors`: For handling cross-origin requests
- `dotenv`: For environment variable management
- `express`: For the web server framework

### Frontend
- `react`: The core UI library
- `react-dom`: React package for DOM-specific methods
- `react-grid-layout`: For flexible dashboard layouts
- `vite`: Build tool and development server

## Troubleshooting

### Common Issues & Solutions

#### "Generation failed" error
**Possible causes:**
- Invalid API key
- No internet connection
- API rate limits exceeded

**Solutions:**
1. Check your API key in `backend/.env`
2. Verify internet connection
3. Wait a few minutes and try again
4. Check console for detailed error messages

#### Frontend won't start
**Error:** `npm run dev` fails

**Solutions:**
1. Make sure you're in the `frontend` folder
2. Run `npm install` again
3. Check Node.js version (`node --version`)
4. Clear npm cache: `npm cache clean --force`

#### Backend connection refused
**Error:** Cannot connect to backend

**Solutions:**
1. Verify backend is running on port 3001
2. Check for port conflicts
3. Restart the backend server
4. Review backend logs for errors