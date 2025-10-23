# GitHub Copilot Instructions for Deeper Research Synthetic

## Project Overview

**Deeper Research Synthetic** ("Initiative IRONCLAD") is an AI-powered content generation framework transforming raw source material into three specialized formats using Google Gemini 2.0 Flash. Built as "THE FORGE" (Express.js backend, port 3001) and "THE LENS" (React 19 + Vite 7 frontend, port 5173), with a sophisticated framework-based prompt system.

**Current Status (Oct 21, 2025)**:

- ✅ Backend: Fully functional with SSE streaming, connection cleanup, project locking
- ⚠️ Frontend: Missing dev dependencies (`npm ci` required), React 19 compatibility verified
- ✅ CI/CD: 6 GitHub Actions workflows, multi-version Node.js testing (18.x, 20.x, 22.x)
- 🔴 Test Coverage: Placeholder tests exist, real coverage ~0%
- 📋 Planned: BYOK (Bring Your Own Key) with Venice.ai as privacy-first default

## Architecture Deep Dive

### Request Flow (Critical Path)

```
User Input →
  In-Memory Projects Store (intentional for dev) →
  acquireProjectLock() (prevents race conditions) →
  frameworkService.constructPrompt() (template + context + query) →
  gemini.generateWithStreaming() (SSE with 32k token limit) →
  Progress updates every 10 chunks →
  validationService.validateOutput() (ReDoS protected) →
  Save to project + cleanup connection
```

**Why In-Memory**: Development/demo simplicity. Production would add PostgreSQL/MongoDB layer. Projects lost on server restart.

### Framework System (Core Business Logic)

**Three Content Types** (`backend/services/frameworkService.js`):

1. **PROJECT_DEEPDIVE** (TOME output)

   - Template: `data/frameworks/research_frameworks/deeper_research_framework.txt`
   - Min 10,000 words, 5+ sections, 10+ subsections
   - Citations required `[number]`, no bullet points

2. **PROJECT_SYNTHETIC** (TRANSMISSION output)

   - Template: `data/frameworks/podcast_synthetics/podcast-synthetic-template.md`
   - Min 15,000 words, "Good morning" opener, "Data infusion complete" closer
   - 3+ "Key Implication" sections

3. **PROJECT_BENCHMARK** (SNAPSHOT output)
   - Template: `data/frameworks/benchmarks/human-condition-benchmark-framework.txt`
   - Min 5,000 words, DEFCON ratings, 10+ data tables

**Prompt Construction Pattern**:

```
[Framework Template from file]
--- SOURCE CONTEXT ---
[User's raw material]
--- END SOURCE CONTEXT ---
--- USER QUERY ---
[Generation instructions or default based on framework.description]
--- END USER QUERY ---
```

### Security Architecture (Production-Ready)

1. **Path Traversal Protection** (`frameworkService.js:38-82`):

   - Validates framework type against `FRAMEWORK_TYPES` whitelist
   - Checks for `..`, `\0`, absolute paths
   - Normalizes paths and ensures within `FRAMEWORKS_PATH`
   - Stats file before reading (ensures it's a file, not directory)

2. **ReDoS Protection** (`validationService.js:14-29`):

   - `safeMatch()` wraps all regex with 1-second timeout
   - Prevents catastrophic backtracking in validation rules
   - Used for citation checking, section headers, etc.

3. **Project Locking** (`server.js:34-58`):

   - `acquireProjectLock(projectId)` returns Promise<releaseLock>
   - Prevents concurrent PUT requests from corrupting data
   - Uses Map<projectId, lockPromise> for queue management

4. **SSE Connection Management** (`routes/generation.js:73-102`):
   - Cleanup handlers for `close`, `aborted` events
   - 30-minute timeout (prevents zombie connections)
   - `cleanupExecuted` flag prevents double-cleanup race

## Development Workflows

### Initial Setup (CRITICAL)

```bash
# Frontend missing dependencies - run first!
cd frontend && npm ci

# Backend ready to go
cd backend && npm ci

# Environment (required)
backend/.env:
  GEMINI_API_KEY=your_key_here
  PORT=3001
  NODE_ENV=development
  TEMPERATURE=0.7
  MAX_OUTPUT_TOKENS=32000
```

### Running Stack

```bash
# Terminal 1: Backend with nodemon auto-reload
cd backend && npm run dev

# Terminal 2: Frontend with Vite HMR
cd frontend && npm run dev

# Access:
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001/api/status
```

### Testing (Current State)

```bash
# Backend: Jest 30.2.0, --passWithNoTests flag
cd backend
npm test              # Runs placeholder tests
npm run test:watch    # Watch mode
npm run test:coverage # Shows ~0% coverage

# Frontend: Vitest 3.2.4 (after npm ci)
cd frontend
npm test              # Placeholder tests
npm run test:watch    # Interactive mode
```

**Test Files Present** (all placeholders):

- `backend/tests/setup.js` - Jest global mocks (Gemini API)
- `backend/tests/server.test.js` - Smoke tests
- `backend/tests/routes/generation.test.js` - Empty
- `backend/tests/services/performanceService.test.js` - Empty
- `backend/tests/services/validationService.test.js` - Empty
- `frontend/tests/setup.js` - Vitest config
- `frontend/tests/App.test.jsx` - Smoke test
- `frontend/tests/components/Workspace.test.jsx` - Empty

## Code Patterns & Conventions

### Backend Service Layer (Single Responsibility)

**frameworkService.js** - Framework management (167 lines):

- `loadFrameworkPrompt()` - Secure file loading with validation
- `constructPrompt()` - Template + context + query assembly
- `getFrameworkMetadata()` - Returns min words, output type
- `FRAMEWORK_TYPES` constant - Source of truth for frameworks

**generationService.js** - AI orchestration (139 lines):

- `generateContent()` - Main entry point, coordinates full flow
- `countWords()` - Simple whitespace split
- Progress callbacks every 10 chunks
- Validation on completion

**validationService.js** - Output validation (232 lines):

- `safeMatch()` - ReDoS protection wrapper
- `validateOutput()` - Dispatches to framework-specific validators
- `validateDeepdive()` - Checks sections, subsections, citations
- `validateSynthetic()` - Checks opener/closer phrases
- `validateBenchmark()` - Checks DEFCON ratings, tables

**performanceService.js** - Resource monitoring:

- Tracks memory (RSS, heap), active generations, errors
- Emits alerts when thresholds exceeded
- `generatePerformanceReport()` - JSON report

### SSE Streaming Implementation (CRITICAL)

**Backend** (`routes/generation.js:50-220`):

```javascript
// Setup headers
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");
res.flushHeaders();

// Cleanup with race protection
let cleanupExecuted = false;
const cleanupConnection = () => {
  if (cleanupExecuted) return;
  cleanupExecuted = true;
  activeGenerations.delete(projectId);
  clearTimeout(connectionTimeout);
};

// Handlers
req.on("close", cleanupConnection);
req.on("aborted", cleanupConnection);

// Stream generation
await generateContent(project, (update) => {
  res.write(`data: ${JSON.stringify(update)}\n\n`);
});

res.write("data: [DONE]\n\n");
res.end();
```

**Frontend** (`services/apiService.js:126-250`):

```javascript
const eventSource = new EventSource(url);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "progress") onProgress(data);
  if (data.type === "complete") {
    onComplete(data);
    eventSource.close();
  }
};
eventSource.onerror = () => onError("Stream failed");
```

### React Architecture

**State Management** (App.jsx holds all state):

```
App.jsx (root)
├── projects: Array<Project>
├── selectedProject: Project | null
├── isCreating: boolean
├── Callbacks:
│   ├── handleUpdateProjectContext(id, context)
│   ├── handleUpdateGeneratedContent(id, content, metadata)
│   └── handleDeleteProject(id)
└── <Workspace selectedProject={...} callbacks={...} />
    ├── DeepdiveLayout (PROJECT_DEEPDIVE)
    ├── SyntheticLayout (PROJECT_SYNTHETIC)
    └── BenchmarkLayout (PROJECT_BENCHMARK)
```

**Layout Components** (framework-specific):

- `ContextInputPanel` - Textarea for source material
- `GenerationControlPanel` - Start/stop, progress display
- `OutputDisplayPanel` - Markdown rendering with download

## Project Conventions (Strictly Enforced)

### Naming Patterns

- **System Codenames**: THE FORGE (backend), THE LENS (frontend)
- **Project Codenames**: Operation COGNITION, Initiative IRONCLAD
- **Framework Types**: UPPERCASE constants only (`PROJECT_DEEPDIVE`, never `project_deepdive`)
- **Output Types**: TOME, TRANSMISSION, SNAPSHOT

### File Organization

```
data/frameworks/
├── benchmarks/           # BENCHMARK templates
├── personas/             # AI persona definitions
├── podcast_synthetics/   # SYNTHETIC templates
├── profiles/             # User profiles
├── research_frameworks/  # DEEPDIVE templates
├── schema/               # JSON schemas
└── scratchpads/          # Working drafts
```

**Not committed to git**: Sensitive framework templates stay local

### API Patterns

- **RESTful**: `/api/projects` (CRUD), `/api/generate/:id` (SSE)
- **UUIDs**: `crypto.randomUUID()` for project IDs
- **Error Format**: `{ error: string, details?: object }`
- **Metadata**: All projects have `createdAt`, `updatedAt`, `status`

## Critical Issues (From Oct 2025 Audit)

### ✅ FIXED (Already Implemented)

1. **SSE Memory Leaks**: Cleanup handlers added (`routes/generation.js:73-90`)
2. **Project Lock Races**: `acquireProjectLock()` implemented (`server.js:34-58`)
3. **Path Traversal**: Full validation in `loadFrameworkPrompt()`

### ⚠️ PARTIALLY ADDRESSED

1. **Test Coverage**: Infrastructure exists, tests are placeholders
2. **Frontend Dependencies**: package.json correct, needs `npm ci`

### 🔴 REMAINING TECHNICAL DEBT

1. **Zero Real Test Coverage**: All tests are smoke/placeholder
2. **Hardcoded API URL**: `frontend/src/App.jsx:17` uses `localhost:3001`
3. **No .env.example**: Backend needs example file for onboarding
4. **BYOK Not Implemented**: Venice.ai integration planned but not started
5. **No Input Sanitization**: Some endpoints trust user input

## Common Tasks

### Adding a New Framework

1. **Create template file**: `data/frameworks/[category]/my-framework.txt`
2. **Update service** (`backend/services/frameworkService.js`):
   ```javascript
   const FRAMEWORK_TYPES = {
     // ... existing
     PROJECT_MYTYPE: {
       name: "PROJECT_MYTYPE",
       outputType: "MYOUTPUT",
       promptFile: "[category]/my-framework.txt",
       minWords: 8000,
       description: "My custom framework",
     },
   };
   ```
3. **Add validation** (`backend/services/validationService.js`):
   ```javascript
   async function validateOutput(content, frameworkType) {
     // ... existing code
     switch (frameworkType) {
       case "PROJECT_MYTYPE":
         await validateMyType(content, errors, warnings);
         break;
     }
   }
   ```
4. **Create layout**: `frontend/src/components/layouts/MyTypeLayout.jsx`
5. **Add route** (`frontend/src/components/Workspace.jsx`):
   ```javascript
   if (selectedProject.framework === 'PROJECT_MYTYPE') {
     return <MyTypeLayout ... />;
   }
   ```

### Debugging Generation

1. **Check SSE connection**: DevTools → Network → Filter by "EventStream"
2. **Log prompt construction**:
   ```javascript
   // In generationService.js
   const prompt = await constructPrompt(framework, sourceContext);
   console.log("PROMPT LENGTH:", prompt.length);
   console.log("FIRST 500 CHARS:", prompt.substring(0, 500));
   ```
3. **Test validation separately**:
   ```javascript
   const validation = await validateOutput(content, framework);
   console.log("VALIDATION:", validation);
   ```
4. **Monitor Gemini API errors**: Check backend terminal for stack traces

### Performance Monitoring

`performanceService.js` automatically tracks:

- Memory: RSS, heap used/total, external
- Active generations count
- Request counts and error rates
- Peak memory usage

Access via `/api/status` endpoint for JSON report.

## Key Files Reference

### Must Read First

- `backend/server.js` (348 lines) - Main API, project CRUD, locking
- `backend/services/frameworkService.js` (167 lines) - Template system
- `backend/routes/generation.js` (253 lines) - SSE implementation
- `frontend/src/App.jsx` (356 lines) - Root component, state management

### Configuration

- `backend/config/gemini.js` - Model: gemini-2.0-flash-exp, temp: 0.7, tokens: 32k
- `backend/package.json` - Express 5.1.0, Jest 30.2.0, nodemon 3.1.10
- `frontend/package.json` - React 19.1.0, Vite 7.0.4, Vitest 3.2.4

### Documentation

- `README.md` - User-facing overview
- `docs/API_DOCS.md` - Complete endpoint reference
- `docs/TESTING_GUIDE.md` - Test patterns (aspirational)
- `docs/agent-logs/` - Historical context from previous AI agents

## Next Steps for New Contributors

1. **Fix Frontend Dependencies**: `cd frontend && npm ci`
2. **Create `.env.example`**: Document required environment variables
3. **Write Real Tests**: Replace placeholders with actual test coverage
4. **Environment-Based API URL**: Use `import.meta.env.VITE_API_URL`
5. **Implement BYOK**: Venice.ai integration (see `docs/agent-logs/` for specs)
