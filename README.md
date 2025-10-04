# 🔬 Deeper Research Synthetic

<div align="center">

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-%5E18.0.0-blue.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security](https://img.shields.io/badge/security-hardened-green.svg)](./SECURITY.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./docs/CONTRIBUTING.md)

**🚀 AI-Powered Content Generation Framework with Multi-Modal Research Synthesis**

*Transform raw data into comprehensive academic papers, podcast narratives, and risk assessments using advanced AI frameworks*

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [⚡ Quick Start](#-quick-start)
- [🎯 Content Frameworks](#-content-frameworks)
- [🔧 Configuration](#-configuration)
- [📚 Documentation](#-documentation)
- [🛡️ Security](#️-security)
- [🤝 Contributing](#-contributing)

## ✨ Features

### 🎓 **Multi-Framework Content Generation**
- **PROJECT_DEEPDIVE**: Academic white papers with citations and research depth
- **PROJECT_SYNTHETIC**: Narrative-driven podcast episodes with engaging storytelling
- **PROJECT_BENCHMARK**: Data-driven risk assessments with DEFCON ratings

### 🧠 **Advanced AI Integration**
- Powered by Google Gemini AI for sophisticated content generation
- Real-time streaming generation with Server-Sent Events (SSE)
- Intelligent validation and quality assurance
- Memory management and performance optimization

### 🔒 **Production-Ready Security**
- Comprehensive input validation and sanitization
- ReDoS (Regular Expression Denial of Service) protection
- Rate limiting and resource management
- Secure API key handling

### 🎨 **Modern Tech Stack**
- **Backend**: Node.js, Express.js, Jest Testing
- **Frontend**: React 18, Vite, Modern ES6+
- **AI**: Google Gemini Pro API
- **Testing**: Comprehensive unit and integration tests

## 🏗️ Architecture

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

## 📁 Project Structure

```
deeper-research-synthetic/
├── 📁 backend/                    # Express.js API server
│   ├── 📁 config/                # Configuration files
│   ├── 📁 routes/                # API route handlers
│   ├── 📁 services/              # Business logic
│   │   ├── frameworkService.js   # Framework management
│   │   ├── generationService.js  # AI generation
│   │   ├── validationService.js  # Content validation
│   │   └── performanceService.js # Performance monitoring
│   ├── 📁 tests/                 # Backend tests
│   ├── server.js                 # Express server entry
│   └── package.json              # Dependencies
├── 📁 frontend/                   # React application
│   ├── 📁 src/
│   │   ├── 📁 components/        # React components
│   │   ├── 📁 services/          # API client
│   │   └── App.jsx               # Main application
│   ├── 📁 templates/             # UI templates
│   ├── 📁 tests/                 # Frontend tests
│   └── package.json              # Dependencies
├── 📁 data/                       # Framework data
│   ├── 📁 frameworks/            # Generation templates
│   │   ├── 📁 personas/          # AI personas
│   │   ├── 📁 podcast_synthetics/# Podcast frameworks
│   │   ├── 📁 research_frameworks/# Research templates
│   │   ├── 📁 benchmarks/        # Risk assessment
│   │   └── 📁 scratchpads/       # Working drafts
│   └── 📁 reports/               # Generated content
├── 📁 docs/                       # Documentation
│   ├── API_DOCS.md               # API documentation
│   ├── DEPLOYMENT_GUIDE.md       # Deployment instructions
│   ├── SECURITY_GUIDE.md         # Security practices
│   └── TESTING_GUIDE.md          # Testing procedures
├── 📁 scripts/                    # Utility scripts
├── .gitignore                     # Git ignore patterns
├── CODEOWNERS                     # Code ownership
├── SECURITY.md                    # Security policy
├── HOW_TO_USE.md                  # Beginner guide
└── WARP.md                        # WARP.dev guidance
```

## 👥 Code Ownership

This project follows the standard GitHub CODEOWNERS pattern for managing code ownership and review requirements. Key maintainers include:

- **Primary Maintainer**: Fayeblade1488 (current project owner)
- **Original Author**: Paradroid AI (original creator and source repository owner: para-droid-ai)

See the [CODEOWNERS](./CODEOWNERS) file for specific path-based ownership assignments.

## ⚡ Quick Start

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

## 🎯 Content Frameworks

### 📚 PROJECT_DEEPDIVE
**Academic White Papers**
- Minimum 10,000 words
- At least 5 main sections
- Citation requirements
- No bullet points (flowing paragraphs)
- 10+ subsections for detail

### 🎙️ PROJECT_SYNTHETIC  
**Narrative Podcast Episodes**
- Minimum 15,000 words
- "Good morning" opener
- "Data infusion complete" closer
- 3+ Key Implication sections
- Engaging storytelling format

### 📊 PROJECT_BENCHMARK
**Risk Assessment Reports**
- Minimum 5,000 words
- DEFCON crisis ratings
- 10+ data tables required
- Citations and sourcing
- Quantitative analysis

## 🔧 Configuration

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

### API Endpoints

#### Projects Management
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Content Generation
- `POST /api/generate/:id` - Start generation (SSE stream)
- `GET /api/generate/:id/status` - Check generation status
- `DELETE /api/generate/:id` - Cancel generation

#### System Status
- `GET /api/status` - Server health check

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [HOW_TO_USE.md](./HOW_TO_USE.md) | Beginner-friendly usage guide |
| [SECURITY.md](./SECURITY.md) | Security policies and reporting |
| [docs/API_DOCS.md](./docs/API_DOCS.md) | Complete API documentation |
| [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Production deployment |
| [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) | Testing procedures |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Contribution guidelines |
| [WARP.md](./WARP.md) | WARP.dev integration guide |

## 🛡️ Security

This project implements enterprise-grade security measures:

- ✅ **Input Validation**: Comprehensive request sanitization
- ✅ **ReDoS Protection**: Regex timeout protection
- ✅ **Rate Limiting**: Prevents API abuse
- ✅ **Memory Management**: Resource cleanup and monitoring
- ✅ **CORS Configuration**: Secure cross-origin handling
- ✅ **Environment Security**: Secure secret management

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Run specific test suites
npm test -- --testNamePattern="ValidationService"
npm test -- --testNamePattern="Generation Routes"
```

## 🚀 Production Deployment

See [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions including:

- Docker containerization
- Environment configuration
- SSL/TLS setup
- Process management (PM2)
- Reverse proxy configuration
- Monitoring and logging

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

### Development Workflow
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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**🌟 Star this repository if you find it helpful!**

[Report Bug](https://github.com/Fayeblade1488/deeper_research_synthetic/issues) · 
[Request Feature](https://github.com/Fayeblade1488/deeper_research_synthetic/issues) · 
[Documentation](./docs/) · 
[Security](./SECURITY.md)

Made with ❤️ by the Deeper Research Team

</div>