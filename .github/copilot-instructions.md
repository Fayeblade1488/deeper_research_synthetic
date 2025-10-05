# Copilot Instructions for Deeper Research Synthetic

## 🚀 Quick Start for New Agents

**First Time Here?** Read these files in order:
1. This file (overview and patterns)
2. `.agent-logs/context.txt` (5-minute read: core project understanding)
3. `.agent-logs/_Deeper Research Synthetic - Complete Fix Checklist.md` (comprehensive task list)
4. `.agent-logs/2025-10-04_deeper_research_repo_analysis.md` (deep dive when needed)
5. `.agent-logs/.warp/WARP.md` (all CLI commands)

**Current Priority**: Fix CI/CD blockers first (see Bug Fix Priority Diagram below)

## Project Overview
AI-powered content generation framework transforming raw source material into three output types: academic papers (PROJECT_DEEPDIVE), podcast scripts (PROJECT_SYNTHETIC), and risk assessments (PROJECT_BENCHMARK). Codenamed "THE FORGE" (backend) and "THE LENS" (frontend).

**Development Status** (as of 2025-10-04):
- 🟢 Backend: Functional with Gemini API integration
- 🟡 Frontend: React 19 + Vite 7 (build working, needs expanded tests)
- 🟢 CI/CD: Basic test infrastructure in place
- 🔴 BYOK Feature: Not yet implemented (Venice.ai integration planned)

## Architecture & Data Flow

### Core System Components
- **Backend (Port 3001)**: Express.js API with in-memory project storage, SSE streaming for real-time generation
- **Frontend (Port 5173)**: React 18 + Vite SPA with framework-specific layouts
- **AI Generation**: Google Gemini 2.0 Flash with 32k token output limit, streaming responses
- **Framework System**: Template-based prompts loaded from `data/frameworks/` directory structure

### Request Flow
1. User creates project → in-memory store with unique UUID
2. User adds source context → PUT `/api/projects/:id`
3. Generation triggered → POST `/api/generate/:id` opens SSE stream
4. `generationService.generateContent()` → `frameworkService.constructPrompt()` → `gemini.generateWithStreaming()`
5. Progress updates stream via SSE every 10 chunks
6. Completed content validated via `validationService.validateOutput()`
7. Results saved back to project via PUT `/api/projects/:id`

### Critical: Concurrency & Resource Management
- **Project Update Locks**: `acquireProjectLock()` prevents race conditions on concurrent PUT requests (see `server.js:34-53`)
- **Active Generation Tracking**: `activeGenerations` Map tracks SSE connections with cleanup handlers
- **Connection Lifecycle**: SSE endpoints have 30-minute timeout, cleanup on client disconnect/abort
- **Performance Monitoring**: `performanceService.js` tracks memory, active generations, error rates

## Framework System

### Framework Types (defined in `backend/services/frameworkService.js`)
```javascript
PROJECT_DEEPDIVE   → research_frameworks/deeper_research_framework.txt     (10k+ words, citations, sections)
PROJECT_SYNTHETIC  → podcast_synthetics/podcast-synthetic-template.md      (15k+ words, narrative, "Good morning" opener)
PROJECT_BENCHMARK  → benchmarks/human-condition-benchmark-framework.txt    (5k+ words, DEFCON ratings, data tables)
```

### Prompt Construction Pattern
Prompts combine three sections:
1. Framework template from file (loaded via secure path validation)
2. `--- SOURCE CONTEXT ---` block with user input
3. `--- USER QUERY ---` block with generation instructions

**Security Note**: `loadFrameworkPrompt()` validates paths to prevent traversal attacks—never use user input directly in file paths.

## Development Workflows

### Running the Stack
```bash
# Terminal 1 - Backend (with auto-reload)
cd backend && npm run dev

# Terminal 2 - Frontend (Vite HMR)
cd frontend && npm run dev

# Environment setup
backend/.env requires: GEMINI_API_KEY, PORT, NODE_ENV
```

### Testing
```bash
# Backend: Jest with 70% coverage thresholds
cd backend && npm test              # Single run
npm run test:watch                  # Watch mode
npm run test:coverage               # With coverage report

# Frontend: Vitest + Testing Library
cd frontend && npm test             # Single run
npm run test:watch                  # Interactive mode
```

**Test Pattern**: Services use mocks for Gemini API. Routes use `supertest` for integration tests. See `backend/tests/setup.js` for global mocks.

**Critical Untested Code Paths** (priority order):
1. Framework service (loading, validation, prompt construction)
2. Generation service (orchestration, progress tracking, streaming)
3. Validation service (framework rules, word counts, error reporting)
4. API endpoints (CRUD, SSE streaming, error handling)
5. React components (rendering, events, state management)

**Coverage Goals** (from agent logs):
- Framework Service: 80%+
- Generation Service: 75%+
- Validation Service: 90%+
- API Routes: 100%

### Key Commands
- `npm run lint` - ESLint (frontend only, backend placeholder)
- `npm run build` - Production build (frontend only)
- `npm start` - Production mode (no auto-reload)

## Code Patterns & Conventions

### Backend Service Architecture
Services follow single-responsibility pattern:
- `frameworkService.js`: Template loading, prompt construction, metadata
- `generationService.js`: AI orchestration, streaming, word counting
- `validationService.js`: Framework-specific output validation with ReDoS protection
- `performanceService.js`: Metrics tracking, threshold alerts

### Security Patterns
1. **ReDoS Protection**: `safeMatch()` in `validationService.js` wraps regex with 1s timeout
2. **Path Validation**: All file paths normalized and checked against base directory
3. **Input Sanitization**: No user input directly in file operations or regex
4. **Resource Limits**: SSE connections have 30-minute max, cleanup on disconnect

### React Component Structure
```
App.jsx                           # Project list, modal, API client
└── Workspace.jsx                 # Framework router
    ├── DeepdiveLayout.jsx        # Academic paper UI
    ├── SyntheticLayout.jsx       # Podcast script UI
    └── BenchmarkLayout.jsx       # Risk assessment UI
```

Each layout contains:
- `ContextInputPanel`: Source material editor
- `GenerationControlPanel`: Start/stop generation
- `GenerationProgress`: Real-time word count, validation status
- `OutputDisplayPanel`: Rendered markdown with download

### State Management Pattern
App.jsx holds all project state; updates flow through callback props:
```javascript
onUpdateContext(projectId, newContext)           // Updates source material
onUpdateGeneratedContent(projectId, content, metadata)  // Saves generation results
onDeleteProject(projectId)                       // Removes project
```

## Common Tasks

### Adding a New Framework
1. Create prompt file in `data/frameworks/[category]/`
2. Add entry to `FRAMEWORK_TYPES` in `backend/services/frameworkService.js`
3. Implement validation function in `backend/services/validationService.js`
4. Create layout component in `frontend/src/components/layouts/`
5. Add case to `Workspace.jsx` router

**Example**: See `docs/ADDING_NEW_FRAMEWORKS.md` for detailed guide

### Debugging Generation Issues
1. Check backend logs for Gemini API errors
2. Verify prompt construction: log output from `constructPrompt()`
3. Test validation: run `validateOutput()` on sample content
4. Monitor SSE stream: browser DevTools → Network → EventStream

### Modifying AI Parameters
Edit `backend/config/gemini.js`:
- `temperature`: 0.7 (creativity vs. consistency)
- `topP`: 0.95 (nucleus sampling)
- `maxOutputTokens`: 32000 (hard limit)

**Note**: Changes require backend restart (`npm run dev` auto-reloads)

## Project-Specific Details

### Why In-Memory Storage?
Intentional design choice for development/demo simplicity. Projects reset on server restart. Production would add database layer.

### Framework Template Location
Templates live in `data/frameworks/` with specific subdirectories per type. Frontend cannot access directly—backend serves as gatekeeper with path validation.

### "THE FORGE" / "THE LENS" Naming
Project uses military-style codenames throughout:
- THE FORGE: Backend server (forging content)
- THE LENS: Frontend UI (viewing results)
- Operation COGNITION: Current development phase
- Initiative IRONCLAD: Overall project name

### Citation Pattern Specifics
Validation looks for `[number]` at sentence ends: `sentence.[123]` or `sentence! [456]`
Avoids false positives from code/arrays: `method(); [1, 2, 3]` won't match

## Troubleshooting

### "Generation Already in Progress" (409 Error)
SSE connection still tracked in `activeGenerations` Map. Wait for timeout or restart backend.

### Validation Timeout Warnings
Content contains regex patterns causing excessive backtracking. `safeMatch()` aborts after 1 second. Review content for nested quantifiers.

### Memory Issues During Generation
Performance monitor tracks heap usage. If exceeding thresholds, check for:
- Unclosed SSE connections (zombie processes)
- Large source context (>100k chars)
- Concurrent generations (only one active per project enforced)

### Frontend Build Errors
Vite requires explicit environment variables. Backend URLs hardcoded to `localhost:3001`. For production, update `API_URL` in `App.jsx`.

### CI/CD Pipeline Issues
**Common Problem**: Missing test files causing `npm test` failures.
**Solution**: Tests use `--passWithNoTests` flag. If adding new test files, ensure proper Jest/Vitest setup in respective directories.

### React 19 Compatibility
Using React 19.1.0 with Vite 7. If experiencing issues with third-party libraries:
- Check `react-grid-layout` compatibility (currently 1.4.4)
- Consider downgrading to React 18.3.1 if incompatibilities arise
- Monitor console for deprecation warnings

## Known Issues & Documented Bugs

### Active Bug Tracking
See `.agent-logs/_Deeper Research Synthetic - Complete Fix Checklist.md` for comprehensive bug list documented during 2025-10-03 session:

**Major Bugs (from 2025-10-03 analysis)**:
1. **BUG-M1**: Memory leak in SSE stream management (`routes/generation.js:25-66`)
   - Impact: Memory leaks, potential DoS, server crashes under load
   - Fix: Add connection cleanup handlers, timeout mechanism, heartbeat monitoring

2. **BUG-M2**: Race condition in project updates (`server.js:58-73`)
   - Impact: Data corruption during concurrent updates, lost changes
   - Fix: Implement project-level locking, optimistic locking with versions

3. **BUG-M3**: Framework path traversal vulnerability (`frameworkService.js:38-54`)
   - Impact: Arbitrary file system access, information disclosure
   - Fix: Strict input validation, allowlist of valid paths, path sanitization

4. **BUG-M4**: Infinite loop in word count estimation (`generationService.js:114-121`)
   - Impact: Server hangs, UI freezes with "NaN minutes remaining"
   - Fix: Zero-value checks, fallback estimation logic

5. **BUG-M5**: Uncaught promise rejection in API service (`apiService.js:70-102`)
   - Impact: Frontend crashes, lost user work
   - Fix: Comprehensive error handling, exponential backoff retry

**Minor Bugs**:
1. Inconsistent error messages (`validationService.js:24-29`)
2. Memory leak in React component (`App.jsx:46-49`)
3. Hardcoded API URL (`apiService.js:1`)
4. Missing input sanitization (`server.js:27-31`)
5. Inconsistent port configuration (`server.js:7,99`)

**Testing Coverage**: Currently 0% across backend/frontend. See `.agent-logs/changes/2025-10-03-bug-analysis.md` for detailed analysis.

### Bug Fix Priority Diagram

```
Priority Pyramid (Bottom-Up Approach)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

           📚 Phase 5: Documentation
          ╱                          ╲
         ╱     Update README, guides   ╲
        ╱________________________________╲

       🐛 Phase 4: Minor Bug Fixes (2-3h)
      ╱                                  ╲
     ╱  Standardize errors, React cleanup ╲
    ╱______________________________________╲

   🔑 Phase 3: BYOK Implementation (6-8h)
  ╱                                        ╲
 ╱  Venice.ai, Settings UI, API abstraction ╲
╱____________________________________________╲

  🎨 Phase 2: Vite Configuration (2-3h)
 ╱                                     ╲
╱  Build fixes, React 19, ESLint setup  ╲
╱_______________________________________╲

🚨 Phase 1: CI/CD Fixes (4-6h) ← START HERE
╱                                          ╲
╱  BUG-M1: Memory leaks in SSE              ╲
│  BUG-M2: Race conditions in updates       │
│  BUG-M3: Path traversal vulnerability     │
│  BUG-M4: Word count infinite loops        │
│  BUG-M5: Uncaught promise rejections      │
╲__________________________________________╱

Legend:
🚨 Critical (blocks everything)
🎨 High (enables development)
🔑 Medium (new features)
🐛 Low (polish)
📚 Final (user-facing)
```

### Bug Fix Implementation Order

**Do First** (Critical Path):
1. BUG-M1: Fix SSE cleanup → Add `req.on('close')` handlers
2. BUG-M2: Add project locks → Implement `acquireProjectLock()`
3. BUG-M3: Path validation → Whitelist framework paths
4. BUG-M4: Time estimation → Add zero checks
5. BUG-M5: Promise handling → Add `.catch()` handlers

**Do Second** (Quality):
- Minor bugs (error messages, hardcoded URLs, sanitization)
- Add test coverage for all fixes
- Update documentation with fix details

### Bug Fix Pattern
When fixing bugs, follow this workflow:
1. Check if bug is documented in `.agent-logs/` or `docs/BUG_REPORT.md`
2. Add unit test reproducing the bug
3. Implement fix with code comments referencing bug ID
4. Update documentation with fix details
5. Verify related code paths aren't affected

**Example Fix Implementation**:
```javascript
// BUG-M1 FIX: Add SSE connection cleanup to prevent memory leaks
// See: .agent-logs/changes/2025-10-03-bug-analysis.md
router.post('/:projectId', async (req, res) => {
  // ... existing code ...

  // NEW: Add cleanup handler for client disconnect
  req.on('close', () => {
    console.log(`Client disconnected for project ${projectId}`);
    cleanupConnection();
  });

  // NEW: Add abort handler
  req.on('aborted', () => {
    console.log(`Request aborted for project ${projectId}`);
    cleanupConnection();
  });

  // ... rest of implementation ...
});
```

## Planned Features

### BYOK (Bring Your Own Key) Implementation
**Status**: Architecture defined, implementation pending

**Planned Architecture**:
```javascript
// backend/services/apiClient.js - Unified API abstraction
class APIClient {
  constructor(provider, apiKey) { /* venice, openai, gemini, anthropic */ }
  async generateContent(prompt, options) { /* unified interface */ }
  async validateKey() { /* test connection */ }
}
```

**Frontend Component**:
- Settings panel with provider dropdown
- Venice.ai featured as 🔒 Privacy-First default
- Masked API key input with localStorage fallback
- "Test Connection" button calling `/api/validate-key`

**Venice.ai Priority**: Selected as privacy-first default due to:
- OpenAI-compatible API (drop-in replacement)
- No data retention for training
- Transparent logging policies
- See `.agent-logs/` for Venice.ai documentation references

### Venice.ai API Specification

**Base URL**: `https://api.venice.ai/api/v1`

**Authentication**: Bearer token in Authorization header
```bash
Authorization: Bearer your_venice_api_key_here
```

**OpenAI-Compatible Endpoints**:

1. **Chat Completions** (Primary endpoint):
```bash
POST /chat/completions
Content-Type: application/json

{
  "model": "llama-3.3-70b",  // or other Venice models
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Generate content..."}
  ],
  "temperature": 0.7,
  "max_tokens": 32000,
  "stream": true  // SSE streaming support
}
```

2. **Available Models** (as of 2025-10):
- `llama-3.3-70b` - Recommended for long-form content
- `llama-3.1-405b` - Highest quality, slower
- `dolphin-2.9.2-qwen2-72b` - Uncensored variant
- OpenAI models via Venice proxy (gpt-4, gpt-3.5-turbo)

3. **Response Format** (OpenAI-compatible):
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "llama-3.3-70b",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Generated content here..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 500,
    "total_tokens": 600
  }
}
```

4. **Streaming Response** (SSE):
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

**Implementation Notes**:
- Drop-in replacement for OpenAI client code
- No changes needed to prompts or message structure
- Supports same parameters (temperature, top_p, max_tokens)
- Rate limits similar to OpenAI (check current plan)

**Privacy Features**:
- ✅ Zero data retention for model training
- ✅ No logging of prompts/completions by default
- ✅ GDPR compliant infrastructure
- ✅ SOC 2 Type II certified
- ✅ Optional audit logs (user-controlled)

**Reference Documentation**:
- Official API Docs: https://docs.venice.ai/api-reference/api-spec
- Swagger Spec: https://github.com/Fayeblade1488/venice-API-reference
- Rate Limits: https://docs.venice.ai/api-reference/rate-limits
- Model Comparison: https://docs.venice.ai/models

## Troubleshooting

## Files to Reference

**Critical Architecture**:
- `backend/server.js`: Main API routes, project CRUD, locking mechanism
- `backend/routes/generation.js`: SSE streaming, connection lifecycle
- `backend/services/generationService.js`: Core AI orchestration

**Framework System**:
- `backend/services/frameworkService.js`: Template loading, prompt construction
- `backend/services/validationService.js`: Output validation, ReDoS protection
- `data/frameworks/`: All framework templates (not in git if sensitive)

**Frontend Entry Points**:
- `frontend/src/App.jsx`: Root component, project management
- `frontend/src/components/Workspace.jsx`: Framework-specific routing

**Documentation**:
- `HOW_TO_USE.md`: User guide with step-by-step tutorials
- `docs/API_DOCS.md`: Complete endpoint documentation
- `docs/TESTING_GUIDE.md`: Test patterns and coverage requirements

**Agent Logs & Context**:
- `.agent-logs/2025-10-04_deeper_research_repo_analysis.md`: Complete repository analysis (719 lines)
- `.agent-logs/_Deeper Research Synthetic - Complete Fix Checklist.md`: Bug inventory and fix plan (8 sections)
- `.agent-logs/Completed Tasks.md`: Task tracking and phase progress
- `.agent-logs/context.txt`: Session context and preferences
- `.agent-logs/changes/2025-10-03-bug-analysis.md`: Detailed bug report with fix strategies
- `.agent-logs/daily/chat_summary_2025-10-04.md`: Session outcomes and learnings
- `.agent-logs/.gemini/GEMINI.md`: Gemini-specific context and conventions
- `.agent-logs/.warp/WARP.md`: WARP terminal integration guide (includes all CLI commands)

## Development Philosophy

### Bottom-Up Approach
Per agent logs, this project follows a "foundation first" methodology:
1. **Phase 1**: CI/CD and test infrastructure (blocking issues)
2. **Phase 2**: Configuration and build system
3. **Phase 3**: Feature implementation (BYOK)
4. **Phase 4**: Bug fixes with tests
5. **Phase 5**: Documentation updates

### Agent Collaboration Patterns
Previous agents have established these conventions (from `.agent-logs/`):
- **Transparent reasoning**: Document decision-making in logs
- **Scratchpad methodology**: Expose logic before implementation
- **Agentic workflows**: Support user calibration and feedback
- **Context preservation**: Maintain `.agent-logs/` for continuity
- **Meta-transparency**: Always explain "why" behind architectural choices

### User Preferences (from logs)
- Prefers comprehensive logging and documentation
- Values privacy-first solutions (Venice.ai preference)
- Appreciates detailed technical analysis before changes
- Uses bottom-up problem-solving (fix blockers first)
- Maintains high code quality standards (70% test coverage threshold)
- Uses macOS 26 Developer Beta
- Prefers WARP terminal with custom configuration
- Requires explicit, correct tool usage (no syntax errors)

### Agent Operational Guidelines (from incident logs)
**Critical Lessons** (from `.agent-logs/daily/chat_summary_2025-10-04.md`):
- Execute tool calls with correct syntax on first attempt
- Learn from previous execution failures within session
- Verify command structure before submission
- Maintain consistent quality across repeated operations
- Document failures for future agent continuity

## Quick Reference Commands

### Development
```bash
# Start development servers
cd backend && npm run dev      # Backend with auto-reload (port 3001)
cd frontend && npm run dev     # Frontend with HMR (port 5173)

# Testing
cd backend && npm test         # Run Jest tests
cd frontend && npm test        # Run Vitest tests
npm run test:watch            # Watch mode
npm run test:coverage         # With coverage

# Linting & Building
cd frontend && npm run lint    # ESLint check
cd frontend && npm run build   # Production build
```

### API Testing
```bash
# Health check
curl http://localhost:3001/api/status

# Create project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","framework":"PROJECT_DEEPDIVE"}'

# List projects
curl http://localhost:3001/api/projects
```

### Debugging
- Backend logs: Check terminal output from `npm run dev`
- Frontend errors: Browser DevTools → Console
- SSE streams: DevTools → Network → EventStream
- API failures: DevTools → Network → Response tab

For complete command reference, see `.agent-logs/.warp/WARP.md`
