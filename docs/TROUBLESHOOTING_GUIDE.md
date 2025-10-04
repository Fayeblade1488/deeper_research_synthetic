# Troubleshooting Guide for Deeper Research Synthetic

## Overview

This guide provides comprehensive troubleshooting instructions for common issues that may arise when using, developing, or deploying the Deeper Research Synthetic application. It covers backend issues, frontend issues, API connectivity problems, and deployment challenges.

## Table of Contents

1. [General Troubleshooting Approach](#general-troubleshooting-approach)
2. [Backend Issues](#backend-issues)
   - [Server Won't Start](#server-wont-start)
   - [API Endpoints Not Responding](#api-endpoints-not-responding)
   - [Gemini API Integration Problems](#gemini-api-integration-problems)
   - [Database Connection Issues](#database-connection-issues)
   - [Performance Problems](#performance-problems)
3. [Frontend Issues](#frontend-issues)
   - [Application Won't Load](#application-wont-load)
   - [UI Rendering Problems](#ui-rendering-problems)
   - [Generation Controls Not Working](#generation-controls-not-working)
   - [Real-Time Updates Not Working](#real-time-updates-not-working)
4. [API Connectivity Issues](#api-connectivity-issues)
   - [CORS Errors](#cors-errors)
   - [Network Timeout Errors](#network-timeout-errors)
   - [Authentication Issues](#authentication-issues)
5. [Deployment Issues](#deployment-issues)
   - [Environment Variable Problems](#environment-variable-problems)
   - [Docker Deployment Issues](#docker-deployment-issues)
   - [Kubernetes Deployment Issues](#kubernetes-deployment-issues)
   - [Cloud Provider Issues](#cloud-provider-issues)
6. [Gemini API Specific Issues](#gemini-api-specific-issues)
   - [Rate Limiting](#rate-limiting)
   - [Quota Exceeded](#quota-exceeded)
   - [Model Unavailable](#model-unavailable)
   - [Content Filtering](#content-filtering)
7. [Security Issues](#security-issues)
   - [Authentication Failures](#authentication-failures)
   - [Authorization Problems](#authorization-problems)
   - [Security Alerts](#security-alerts)
8. [Performance Troubleshooting](#performance-troubleshooting)
   - [Slow API Responses](#slow-api-responses)
   - [High Memory Usage](#high-memory-usage)
   - [CPU Bottlenecks](#cpu-bottlenecks)
9. [Logging and Monitoring](#logging-and-monitoring)
   - [Log Analysis](#log-analysis)
   - [Monitoring Dashboard Issues](#monitoring-dashboard-issues)
10. [Advanced Debugging Techniques](#advanced-debugging-techniques)
    - [Debugging with Node.js Inspector](#debugging-with-nodejs-inspector)
    - [Network Traffic Analysis](#network-traffic-analysis)
    - [Memory Leak Detection](#memory-leak-detection)

## General Troubleshooting Approach

When troubleshooting issues with the Deeper Research Synthetic application, follow this systematic approach:

1. **Identify the Problem**: Clearly define what is not working as expected
2. **Check Recent Changes**: Review recent code changes, configuration updates, or environmental changes
3. **Review Logs**: Examine application logs, system logs, and error messages
4. **Reproduce the Issue**: Try to reproduce the problem in a controlled environment
5. **Isolate the Component**: Determine which component (frontend, backend, database, API) is causing the issue
6. **Check Dependencies**: Verify that all required services and dependencies are functioning
7. **Test Connectivity**: Confirm network connectivity between components
8. **Apply Fixes**: Implement appropriate fixes based on the root cause
9. **Verify Resolution**: Confirm that the issue is resolved and hasn't introduced new problems
10. **Document the Solution**: Record the problem and solution for future reference

## Backend Issues

### Server Won't Start

#### Symptoms
- Server fails to start with error messages
- Port is already in use
- Missing dependencies
- Configuration errors

#### Diagnosis
1. Check the console output for error messages:
   ```bash
   cd backend
   npm start
   ```

2. Verify that the required port is available:
   ```bash
   lsof -i :3001
   ```

3. Check for missing dependencies:
   ```bash
   npm ls
   ```

4. Verify environment variables:
   ```bash
   cat .env
   ```

#### Solutions
1. **Port Already in Use**:
   ```bash
   # Kill the process using the port
   lsof -ti:3001 | xargs kill -9
   
   # Or change the port in .env
   echo "PORT=3002" >> .env
   ```

2. **Missing Dependencies**:
   ```bash
   npm install
   ```

3. **Configuration Errors**:
   ```bash
   # Check .env file format
   cat .env.example
   # Ensure your .env matches the example
   ```

4. **Permission Issues**:
   ```bash
   # Check file permissions
   ls -la server.js
   # Fix permissions if needed
   chmod +x server.js
   ```

### API Endpoints Not Responding

#### Symptoms
- API endpoints return 404, 500, or timeout errors
- CORS errors when accessing endpoints
- Unexpected response formats

#### Diagnosis
1. Check server status:
   ```bash
   curl http://localhost:3001/api/status
   ```

2. Verify route definitions in `backend/routes/`:
   ```bash
   # Check if routes are properly defined
   cat backend/routes/generation.js
   ```

3. Review middleware configuration:
   ```bash
   # Check middleware in server.js
   cat backend/server.js
   ```

#### Solutions
1. **Route Not Found (404)**:
   ```javascript
   // Ensure routes are properly mounted in server.js
   const generationRoutes = require('./routes/generation');
   app.use('/api/generate', generationRoutes);
   ```

2. **Internal Server Error (500)**:
   ```bash
   # Check application logs for detailed error messages
   tail -f backend/logs/error.log
   ```

3. **Timeout Errors**:
   ```bash
   # Increase timeout settings
   # In server.js
   app.use(express.json({ limit: '10mb', timeout: 300000 }));
   ```

### Gemini API Integration Problems

#### Symptoms
- Generation fails with Gemini API errors
- Invalid API key errors
- Model not found errors
- Rate limiting errors

#### Diagnosis
1. Verify API key configuration:
   ```bash
   echo $GEMINI_API_KEY
   ```

2. Test API connectivity:
   ```bash
   curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GEMINI_API_KEY \
     -H 'Content-Type: application/json' \
     -d '{"contents":[{"parts":[{"text":"Hello world!"}]}]}'
   ```

3. Check Gemini API status:
   ```bash
   curl https://status.cloud.google.com/api/v1/incidents?service=geminiv1
   ```

#### Solutions
1. **Invalid API Key**:
   ```bash
   # Verify API key in .env file
   cat backend/.env | grep GEMINI_API_KEY
   
   # Regenerate API key in Google Cloud Console if needed
   ```

2. **Model Not Found**:
   ```javascript
   // Verify model name in config/gemini.js
   const modelConfig = {
     model: 'gemini-pro', // Ensure this is a valid model
     // ...
   };
   ```

3. **Rate Limiting**:
   ```javascript
   // Implement exponential backoff in generationService.js
   async function generateWithRetry(prompt, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await generateContent(prompt);
       } catch (error) {
         if (error.message.includes('rate limit') && i < maxRetries - 1) {
           const delay = Math.pow(2, i) * 1000; // Exponential backoff
           await new Promise(resolve => setTimeout(resolve, delay));
           continue;
         }
         throw error;
       }
     }
   }
   ```

### Database Connection Issues

#### Symptoms
- Database connection timeouts
- Unable to save or retrieve data
- Authentication failures
- Slow database operations

#### Diagnosis
1. Check database connectivity:
   ```bash
   # For MongoDB
   mongosh mongodb://localhost:27017/ironclad
   ```

2. Verify database configuration:
   ```bash
   echo $DATABASE_URL
   ```

3. Check database logs:
   ```bash
   tail -f /var/log/mongodb/mongod.log
   ```

#### Solutions
1. **Connection Timeout**:
   ```javascript
   // Increase connection timeout in database configuration
   const mongoose = require('mongoose');
   
   mongoose.connect(process.env.DATABASE_URL, {
     serverSelectionTimeoutMS: 30000, // 30 seconds
     socketTimeoutMS: 45000, // 45 seconds
   });
   ```

2. **Authentication Failure**:
   ```bash
   # Verify database credentials
   # Update DATABASE_URL in .env
   echo "DATABASE_URL=mongodb://username:password@localhost:27017/ironclad" > .env
   ```

3. **Slow Operations**:
   ```javascript
   // Add database indexing for frequently queried fields
   const projectSchema = new mongoose.Schema({
     name: { type: String, index: true },
     framework: { type: String, index: true },
     createdAt: { type: Date, index: true }
   });
   ```

### Performance Problems

#### Symptoms
- Slow API responses
- High memory usage
- CPU spikes
- Generation taking too long

#### Diagnosis
1. Monitor system resources:
   ```bash
   # Monitor CPU and memory usage
   top
   
   # Monitor disk I/O
   iostat -x 1
   
   # Monitor network usage
   iftop
   ```

2. Profile Node.js application:
   ```bash
   # Run with profiling enabled
   node --prof server.js
   
   # Analyze profile
   node --prof-process isolate-*.log > profile.txt
   ```

3. Check for memory leaks:
   ```bash
   # Monitor heap usage
   node --inspect server.js
   # Then connect with Chrome DevTools
   ```

#### Solutions
1. **Slow API Responses**:
   ```javascript
   // Add caching for frequently accessed data
   const redis = require('redis');
   const client = redis.createClient();
   
   app.get('/api/projects', async (req, res) => {
     const cacheKey = 'projects';
     const cached = await client.get(cacheKey);
     
     if (cached) {
       return res.json(JSON.parse(cached));
     }
     
     const projects = await Project.find();
     await client.setex(cacheKey, 300, JSON.stringify(projects)); // Cache for 5 minutes
     res.json(projects);
   });
   ```

2. **High Memory Usage**:
   ```javascript
   // Implement streaming for large data transfers
   app.get('/api/projects/:id/content', async (req, res) => {
     const project = await Project.findById(req.params.id);
     
     // Stream content instead of loading everything into memory
     const stream = require('stream');
     const contentStream = new stream.Readable();
     contentStream.push(project.generatedContent);
     contentStream.push(null); // End of stream
     
     res.setHeader('Content-Type', 'text/plain');
     contentStream.pipe(res);
   });
   ```

3. **CPU Spikes**:
   ```javascript
   // Offload heavy computation to worker threads
   const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
   
   if (isMainThread) {
     // Main thread
     const worker = new Worker(__filename, {
       workerData: { data: largeDataSet }
     });
     
     worker.on('message', (result) => {
       // Handle result
     });
   } else {
     // Worker thread
     const result = performHeavyComputation(workerData.data);
     parentPort.postMessage(result);
   }
   ```

## Frontend Issues

### Application Won't Load

#### Symptoms
- Blank page when accessing frontend
- Failed to load resources errors
- JavaScript errors in console
- Infinite loading spinner

#### Diagnosis
1. Check browser console for errors:
   ```javascript
   // Open browser developer tools (F12)
   // Look for error messages in Console tab
   ```

2. Verify build status:
   ```bash
   cd frontend
   npm run build
   ```

3. Check network requests:
   ```javascript
   // In browser developer tools
   // Network tab -> Look for failed requests (404, 500 errors)
   ```

#### Solutions
1. **Missing Build Files**:
   ```bash
   # Rebuild frontend
   cd frontend
   npm run build
   
   # Verify build output
   ls -la dist/
   ```

2. **JavaScript Errors**:
   ```bash
   # Check for syntax errors
   npm run lint
   
   # Fix reported issues
   npm run lint -- --fix
   ```

3. **Resource Loading Issues**:
   ```bash
   # Check vite.config.js for correct base path
   cat frontend/vite.config.js
   
   # Ensure assets are correctly referenced
   # In index.html or component files
   ```

### UI Rendering Problems

#### Symptoms
- Components not rendering correctly
- Layout issues
- Styling problems
- Missing elements

#### Diagnosis
1. Inspect elements with browser developer tools:
   ```javascript
   // Right-click on problematic element -> Inspect
   // Check computed styles and element properties
   ```

2. Verify component imports:
   ```bash
   # Check import paths in component files
   grep -r "import.*from" frontend/src/
   ```

3. Review CSS files:
   ```bash
   # Check for conflicting styles
   cat frontend/src/App.css
   ```

#### Solutions
1. **Component Import Issues**:
   ```javascript
   // Verify correct import paths
   import GenerationControlPanel from '../components/GenerationControlPanel';
   
   // Check file extensions
   import GenerationControlPanel from '../components/GenerationControlPanel.jsx';
   ```

2. **CSS Conflicts**:
   ```css
   /* Use specific selectors to avoid conflicts */
   .generation-control-panel .progress-bar {
     /* Specific styles for this component */
   }
   
   /* Use CSS modules for component-scoped styles */
   /* GenerationControlPanel.module.css */
   .progressBar {
     /* Scoped styles */
   }
   ```

3. **Responsive Layout Issues**:
   ```jsx
   // Use responsive design techniques
   import { useMediaQuery } from 'react-responsive';
   
   const GenerationControlPanel = () => {
     const isMobile = useMediaQuery({ maxWidth: 768 });
     
     return (
       <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
         {/* Conditional rendering based on screen size */}
       </div>
     );
   };
   ```

### Generation Controls Not Working

#### Symptoms
- Generate button doesn't respond
- Progress indicators not updating
- Generation completes without output
- Cancel button not working

#### Diagnosis
1. Check event handlers:
   ```jsx
   // Verify onClick handlers are properly attached
   <button onClick={handleStartGeneration}>Generate</button>
   ```

2. Review API service implementation:
   ```bash
   cat frontend/src/services/apiService.js
   ```

3. Check console for JavaScript errors:
   ```javascript
   // Open browser console and look for errors when clicking buttons
   ```

#### Solutions
1. **Event Handler Issues**:
   ```jsx
   const GenerationControlPanel = ({ project }) => {
     const [isGenerating, setIsGenerating] = useState(false);
     
     const handleStartGeneration = async () => {
       if (!project) return;
       
       try {
         setIsGenerating(true);
         
         // Call API service
         await startGeneration(
           project,
           // onProgress callback
           (progress) => {
             console.log('Progress:', progress);
             // Update UI with progress
           },
           // onComplete callback
           (result) => {
             console.log('Complete:', result);
             setIsGenerating(false);
             // Update UI with result
           },
           // onError callback
           (error) => {
             console.error('Error:', error);
             setIsGenerating(false);
             // Show error to user
           }
         );
       } catch (error) {
         console.error('Generation failed:', error);
         setIsGenerating(false);
       }
     };
     
     return (
       <button 
         onClick={handleStartGeneration}
         disabled={isGenerating || !project}
       >
         {isGenerating ? 'Generating...' : 'Generate'}
       </button>
     );
   };
   ```

2. **API Service Issues**:
   ```javascript
   // frontend/src/services/apiService.js
   export async function startGeneration(project, onProgress, onComplete, onError) {
     try {
       const response = await fetch(`${API_URL}/generate/${project.id}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ project }),
       });
       
       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       // Handle streaming response
       const reader = response.body.getReader();
       const decoder = new TextDecoder();
       
       while (true) {
         const { done, value } = await reader.read();
         
         if (done) {
           break;
         }
         
         const chunk = decoder.decode(value);
         const lines = chunk.split('\n\n');
         
         for (const line of lines) {
           if (line.startsWith('data: ')) {
             try {
               const data = JSON.parse(line.slice(6));
               
               switch (data.type) {
                 case 'progress':
                   onProgress(data);
                   break;
                 case 'complete':
                   onComplete(data);
                   break;
                 case 'error':
                   onError(data.error);
                   break;
               }
             } catch (parseError) {
               console.error('Failed to parse SSE data:', parseError);
             }
           }
         }
       }
     } catch (error) {
       onError(error.message);
     }
   }
   ```

### Real-Time Updates Not Working

#### Symptoms
- Progress bars not updating
- Content not streaming in real-time
- SSE connection failures
- UI not reflecting backend changes

#### Diagnosis
1. Check SSE implementation:
   ```bash
   cat backend/routes/generation.js
   cat frontend/src/services/apiService.js
   ```

2. Monitor network requests:
   ```javascript
   // In browser Network tab, look for SSE connections
   // Check EventSource connections
   ```

3. Verify backend streaming:
   ```bash
   # Test SSE endpoint with curl
   curl -H "Accept:text/event-stream" http://localhost:3001/api/generate/test-project-id
   ```

#### Solutions
1. **SSE Connection Issues**:
   ```javascript
   // backend/routes/generation.js
   router.post('/:projectId', async (req, res) => {
     // Set SSE headers
     res.setHeader('Content-Type', 'text/event-stream');
     res.setHeader('Cache-Control', 'no-cache');
     res.setHeader('Connection', 'keep-alive');
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.flushHeaders();
     
     // Send periodic keep-alive messages
     const keepAliveInterval = setInterval(() => {
       res.write(': keep-alive\n\n');
     }, 30000);
     
     try {
       // Generation logic with progress updates
       await generateContent(project, (progress) => {
         res.write(`data: ${JSON.stringify(progress)}\n\n`);
       });
       
       res.write('data: {"type": "complete"}\n\n');
       res.end();
     } catch (error) {
       res.write(`data: {"type": "error", "error": "${error.message}"}\n\n`);
       res.end();
     } finally {
       clearInterval(keepAliveInterval);
     }
   });
   ```

2. **Frontend SSE Issues**:
   ```javascript
   // frontend/src/services/apiService.js
   export function startGeneration(project, onProgress, onComplete, onError) {
     const eventSource = new EventSource(`${API_URL}/generate/${project.id}`);
     
     eventSource.onmessage = (event) => {
       try {
         const data = JSON.parse(event.data);
         
         switch (data.type) {
           case 'progress':
             onProgress(data);
             break;
           case 'complete':
             onComplete(data);
             eventSource.close();
             break;
           case 'error':
             onError(data.error);
             eventSource.close();
             break;
         }
       } catch (error) {
         console.error('Failed to parse SSE message:', error);
       }
     };
     
     eventSource.onerror = (error) => {
       console.error('SSE error:', error);
       onError('Connection to server lost');
       eventSource.close();
     };
     
     // Return eventSource for cleanup
     return eventSource;
   }
   ```

3. **UI Update Issues**:
   ```jsx
   // frontend/src/components/GenerationControlPanel.jsx
   const GenerationControlPanel = ({ project }) => {
     const [progress, setProgress] = useState(null);
     
     useEffect(() => {
       let eventSource;
       
       if (project && project.id) {
         eventSource = startGeneration(
           project,
           // onProgress
           (progressData) => {
             // Ensure state update triggers re-render
             setProgress(prev => ({ ...prev, ...progressData }));
           },
           // onComplete
           (completeData) => {
             setProgress({ type: 'complete', ...completeData });
           },
           // onError
           (error) => {
             setProgress({ type: 'error', error });
           }
         );
       }
       
       // Cleanup function
       return () => {
         if (eventSource) {
           eventSource.close();
         }
       };
     }, [project]);
     
     // Ensure component re-renders when progress changes
     return (
       <div>
         {progress && (
           <div className="progress-info">
             {progress.type === 'progress' && (
               <span>Words: {progress.wordCount}</span>
             )}
             {progress.type === 'complete' && (
               <span>Generation complete!</span>
             )}
             {progress.type === 'error' && (
               <span>Error: {progress.error}</span>
             )}
           </div>
         )}
       </div>
     );
   };
   ```

## API Connectivity Issues

### CORS Errors

#### Symptoms
- Browser console shows CORS errors
- API requests fail with CORS policy violations
- Preflight requests failing

#### Diagnosis
1. Check browser console for CORS errors:
   ```
   Access to fetch at 'http://localhost:3001/api/projects' from origin 'http://localhost:5173' 
   has been blocked by CORS policy
   ```

2. Verify CORS configuration in backend:
   ```bash
   cat backend/server.js | grep cors
   ```

#### Solutions
1. **CORS Configuration**:
   ```javascript
   // backend/server.js
   const cors = require('cors');
   
   const corsOptions = {
     origin: [
       'http://localhost:5173',
       'http://localhost:3000',
       'https://yourdomain.com'
     ],
     credentials: true,
     optionsSuccessStatus: 200
   };
   
   app.use(cors(corsOptions));
   ```

2. **Preflight Request Issues**:
   ```javascript
   // Handle preflight requests explicitly
   app.options('*', cors(corsOptions));
   
   // Or allow all origins for development
   if (process.env.NODE_ENV === 'development') {
     app.use(cors());
   }
   ```

### Network Timeout Errors

#### Symptoms
- Requests timing out
- "NetworkError when attempting to fetch resource"
- "Timeout" errors in console

#### Diagnosis
1. Check network connectivity:
   ```bash
   ping localhost
   ```

2. Verify backend is running:
   ```bash
   curl http://localhost:3001/api/status
   ```

3. Check firewall settings:
   ```bash
   # Linux
   iptables -L
   
   # macOS
   pfctl -sr
   ```

#### Solutions
1. **Increase Timeout Settings**:
   ```javascript
   // frontend/src/services/apiService.js
   const API_TIMEOUT = 300000; // 5 minutes
   
   export async function fetchWithTimeout(url, options = {}) {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
     
     try {
       const response = await fetch(url, {
         ...options,
         signal: controller.signal
       });
       clearTimeout(timeoutId);
       return response;
     } catch (error) {
       clearTimeout(timeoutId);
       throw error;
     }
   }
   ```

2. **Backend Timeout Configuration**:
   ```javascript
   // backend/server.js
   app.use(express.json({ 
     limit: '10mb',
     type: 'application/json',
     verify: (req, res, buf, encoding) => {
       // Verify request body
     }
   }));
   
   // Increase server timeout
   app.use((req, res, next) => {
     req.setTimeout(300000); // 5 minutes
     res.setTimeout(300000); // 5 minutes
     next();
   });
   ```

### Authentication Issues

#### Symptoms
- 401 Unauthorized errors
- Login failures
- Session expiration
- Token validation errors

#### Diagnosis
1. Check authentication headers:
   ```javascript
   // In browser Network tab, check request headers
   // Look for Authorization header
   ```

2. Verify token validity:
   ```bash
   # Decode JWT token
   echo "your-jwt-token" | jq -R 'split(".") | .[1] | @base64d | fromjson'
   ```

3. Check session storage:
   ```javascript
   // In browser console
   localStorage.getItem('authToken');
   sessionStorage.getItem('authToken');
   ```

#### Solutions
1. **Token Refresh**:
   ```javascript
   // frontend/src/services/authService.js
   class AuthService {
     async refreshToken() {
       try {
         const refreshToken = localStorage.getItem('refreshToken');
         const response = await fetch('/api/auth/refresh', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ refreshToken })
         });
         
         if (!response.ok) {
           throw new Error('Failed to refresh token');
         }
         
         const { accessToken, refreshToken: newRefreshToken } = await response.json();
         localStorage.setItem('authToken', accessToken);
         localStorage.setItem('refreshToken', newRefreshToken);
         
         return accessToken;
       } catch (error) {
         // Redirect to login page
         window.location.href = '/login';
         throw error;
       }
     }
     
     async authenticatedFetch(url, options = {}) {
       let token = localStorage.getItem('authToken');
       
       const response = await fetch(url, {
         ...options,
         headers: {
           ...options.headers,
           'Authorization': `Bearer ${token}`
         }
       });
       
       if (response.status === 401) {
         // Try to refresh token
         token = await this.refreshToken();
         
         // Retry request with new token
         return fetch(url, {
           ...options,
           headers: {
             ...options.headers,
             'Authorization': `Bearer ${token}`
           }
         });
       }
       
       return response;
     }
   }
   ```

2. **Session Management**:
   ```javascript
   // frontend/src/hooks/useAuth.js
   import { useState, useEffect } from 'react';
   
   export function useAuth() {
     const [isAuthenticated, setIsAuthenticated] = useState(false);
     const [user, setUser] = useState(null);
     
     useEffect(() => {
       // Check for existing session
       const token = localStorage.getItem('authToken');
       if (token) {
         try {
           const payload = JSON.parse(atob(token.split('.')[1]));
           if (payload.exp * 1000 > Date.now()) {
             setIsAuthenticated(true);
             setUser(payload.user);
           } else {
             // Token expired
             localStorage.removeItem('authToken');
             setIsAuthenticated(false);
             setUser(null);
           }
         } catch (error) {
           // Invalid token
           localStorage.removeItem('authToken');
           setIsAuthenticated(false);
           setUser(null);
         }
       }
     }, []);
     
     return { isAuthenticated, user };
   }
   ```

## Deployment Issues

### Environment Variable Problems

#### Symptoms
- Application fails to start in production
- Missing API keys
- Incorrect configuration values
- Database connection failures

#### Diagnosis
1. Check environment variables:
   ```bash
   # On deployment server
   printenv | grep APP_NAME
   ```

2. Verify .env file:
   ```bash
   cat .env.production
   ```

3. Check deployment configuration:
   ```bash
   # For Docker
   cat docker-compose.yml
   
   # For Kubernetes
   cat deployment.yaml
   ```

#### Solutions
1. **Environment Variable Configuration**:
   ```bash
   # Create proper environment file
   cat > .env.production << EOF
   NODE_ENV=production
   PORT=3001
   GEMINI_API_KEY=your_production_api_key
   DATABASE_URL=mongodb://localhost:27017/ironclad
   JWT_SECRET=your_secure_jwt_secret
   ALLOWED_ORIGINS=https://yourdomain.com
   LOG_LEVEL=info
   EOF
   ```

2. **Docker Environment Variables**:
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     backend:
       build: ./backend
       environment:
         - NODE_ENV=production
         - GEMINI_API_KEY=${GEMINI_API_KEY}
         - DATABASE_URL=${DATABASE_URL}
         - JWT_SECRET=${JWT_SECRET}
       env_file:
         - .env.production
   ```

3. **Kubernetes Secrets**:
   ```yaml
   # secrets.yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: ironclad-secrets
   type: Opaque
   data:
     gemini-api-key: <base64-encoded-api-key>
     jwt-secret: <base64-encoded-jwt-secret>
     database-url: <base64-encoded-database-url>
   
   # deployment.yaml
   spec:
     containers:
     - name: backend
       env:
       - name: GEMINI_API_KEY
         valueFrom:
           secretKeyRef:
             name: ironclad-secrets
             key: gemini-api-key
       - name: JWT_SECRET
         valueFrom:
           secretKeyRef:
             name: ironclad-secrets
             key: jwt-secret
   ```

### Docker Deployment Issues

#### Symptoms
- Containers failing to start
- Build failures
- Port conflicts
- Volume mounting issues

#### Diagnosis
1. Check Docker logs:
   ```bash
   docker-compose logs backend
   ```

2. Verify Dockerfile:
   ```bash
   cat backend/Dockerfile
   ```

3. Check container status:
   ```bash
   docker-compose ps
   ```

#### Solutions
1. **Dockerfile Issues**:
   ```dockerfile
   # backend/Dockerfile
   FROM node:16-alpine
   
   # Create app directory
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   
   # Install dependencies
   RUN npm ci --only=production
   
   # Copy source code
   COPY . .
   
   # Expose port
   EXPOSE 3001
   
   # Create non-root user
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nextjs -u 1001
   
   # Change ownership of app files
   RUN chown -R nextjs:nodejs /app
   USER nextjs
   
   # Start app
   CMD ["node", "server.js"]
   ```

2. **Volume Mounting Issues**:
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     backend:
       build: ./backend
       volumes:
         # Mount logs directory
         - ./backend/logs:/app/logs
         # Mount uploads directory (if needed)
         - ./backend/uploads:/app/uploads
       environment:
         - NODE_ENV=production
   ```

3. **Port Conflicts**:
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     backend:
       build: ./backend
       ports:
         # Map container port to host port
         - "3001:3001"
       # Or let Docker assign a random port
       # ports:
       #   - "3001"
   ```

### Kubernetes Deployment Issues

#### Symptoms
- Pods failing to start
- Services not accessible
- Resource limits exceeded
- Configuration errors

#### Diagnosis
1. Check pod status:
   ```bash
   kubectl get pods
   ```

2. View pod logs:
   ```bash
   kubectl logs <pod-name>
   ```

3. Describe pod for detailed info:
   ```bash
   kubectl describe pod <pod-name>
   ```

#### Solutions
1. **Pod Configuration Issues**:
   ```yaml
   # deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: ironclad-backend
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: ironclad-backend
     template:
       metadata:
         labels:
           app: ironclad-backend
       spec:
         containers:
         - name: backend
           image: your-registry/ironclad-backend:latest
           ports:
           - containerPort: 3001
           env:
           - name: NODE_ENV
             value: "production"
           - name: GEMINI_API_KEY
             valueFrom:
               secretKeyRef:
                 name: ironclad-secrets
                 key: gemini-api-key
           resources:
             requests:
               memory: "256Mi"
               cpu: "250m"
             limits:
               memory: "512Mi"
               cpu: "500m"
           livenessProbe:
             httpGet:
               path: /api/status
               port: 3001
             initialDelaySeconds: 30
             periodSeconds: 10
           readinessProbe:
             httpGet:
               path: /api/status
               port: 3001
             initialDelaySeconds: 5
             periodSeconds: 5
   ```

2. **Service Configuration Issues**:
   ```yaml
   # service.yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: ironclad-backend-service
   spec:
     selector:
       app: ironclad-backend
     ports:
     - protocol: TCP
       port: 80
       targetPort: 3001
     type: ClusterIP
   ```

3. **Resource Limits**:
   ```yaml
   # Add resource limits to prevent resource exhaustion
   resources:
     requests:
       memory: "256Mi"
       cpu: "250m"
     limits:
       memory: "512Mi"
       cpu: "500m"
   ```

### Cloud Provider Issues

#### Symptoms
- Deployment failures
- Performance degradation
- Cost overruns
- Service interruptions

#### Diagnosis
1. Check cloud provider status pages:
   - AWS: https://status.aws.amazon.com/
   - Google Cloud: https://status.cloud.google.com/
   - Azure: https://status.azure.com/

2. Review cloud provider logs:
   ```bash
   # AWS CloudWatch logs
   aws logs describe-log-groups
   
   # Google Cloud Logging
   gcloud logging read "resource.type=gce_instance"
   ```

3. Monitor resource usage:
   ```bash
   # AWS CloudWatch metrics
   aws cloudwatch list-metrics
   
   # Google Cloud Monitoring
   gcloud monitoring metric-descriptors list
   ```

#### Solutions
1. **Auto-scaling Configuration**:
   ```yaml
   # Kubernetes Horizontal Pod Autoscaler
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: ironclad-backend-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: ironclad-backend
     minReplicas: 2
     maxReplicas: 10
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
     - type: Resource
       resource:
         name: memory
         target:
           type: Utilization
           averageUtilization: 80
   ```

2. **Load Balancer Configuration**:
   ```yaml
   # Kubernetes Service with LoadBalancer
   apiVersion: v1
   kind: Service
   metadata:
     name: ironclad-frontend-service
   spec:
     selector:
       app: ironclad-frontend
     ports:
     - protocol: TCP
       port: 80
       targetPort: 80
     type: LoadBalancer
     loadBalancerSourceRanges:
     # Restrict access to specific IP ranges
     - "10.0.0.0/8"
     - "172.16.0.0/12"
     - "192.168.0.0/16"
   ```

3. **Cost Optimization**:
   ```yaml
   # Use spot instances for development environments
   spec:
     template:
       spec:
         nodeSelector:
           cloud.google.com/gke-spot: "true"
         tolerations:
         - key: "cloud.google.com/gke-spot"
           operator: "Exists"
   ```

## Gemini API Specific Issues

### Rate Limiting

#### Symptoms
- "429 Too Many Requests" errors
- Generation requests failing intermittently
- Quota exceeded messages

#### Diagnosis
1. Check Gemini API quotas:
   ```bash
   # Visit Google Cloud Console
   # Navigate to APIs & Services > Quotas
   # Check Gemini API quotas
   ```

2. Monitor API usage:
   ```bash
   # In Google Cloud Console
   # Navigate to APIs & Services > Dashboard
   # View Gemini API usage metrics
   ```

#### Solutions
1. **Implement Rate Limiting**:
   ```javascript
   // backend/services/generationService.js
   const rateLimit = require('express-rate-limit');
   
   const geminiRateLimiter = rateLimit({
     windowMs: 60 * 1000, // 1 minute
     max: 60, // limit each IP to 60 requests per windowMs
     message: {
       error: 'Too many requests to Gemini API, please try again later.'
     },
     standardHeaders: true,
     legacyHeaders: false,
   });
   
   router.use('/generate', geminiRateLimiter);
   ```

2. **Exponential Backoff**:
   ```javascript
   // backend/services/geminiService.js
   async function generateWithRetry(prompt, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await generateContent(prompt);
       } catch (error) {
         if (error.status === 429 && i < maxRetries - 1) {
           // Wait before retrying (exponential backoff)
           const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
           await new Promise(resolve => setTimeout(resolve, delay));
           continue;
         }
         throw error;
       }
     }
   }
   ```

3. **Request Queuing**:
   ```javascript
   // backend/services/generationQueue.js
   class GenerationQueue {
     constructor() {
       this.queue = [];
       this.processing = false;
       this.maxConcurrent = 5; // Limit concurrent requests
     }
     
     async addToQueue(generationTask) {
       return new Promise((resolve, reject) => {
         this.queue.push({
           task: generationTask,
           resolve,
           reject
         });
         
         if (!this.processing) {
           this.processQueue();
         }
       });
     }
     
     async processQueue() {
       this.processing = true;
       
       while (this.queue.length > 0) {
         // Process up to maxConcurrent tasks
         const batch = this.queue.splice(0, this.maxConcurrent);
         
         const promises = batch.map(async (item) => {
           try {
             const result = await item.task();
             item.resolve(result);
           } catch (error) {
             item.reject(error);
           }
         });
         
         await Promise.all(promises);
         
         // Small delay between batches
         await new Promise(resolve => setTimeout(resolve, 1000));
       }
       
       this.processing = false;
     }
   }
   
   module.exports = new GenerationQueue();
   ```

### Quota Exceeded

#### Symptoms
- "Quota exceeded" errors
- API key rate limiting
- Service unavailable messages

#### Diagnosis
1. Check Google Cloud billing:
   ```bash
   # Visit Google Cloud Console
   # Navigate to Billing
   # Check quota usage and billing alerts
   ```

2. Review API key restrictions:
   ```bash
   # In Google Cloud Console
   # Navigate to APIs & Services > Credentials
   # Check API key restrictions and quotas
   ```

#### Solutions
1. **Upgrade Quota**:
   ```markdown
   # Steps to increase Gemini API quota:
   1. Visit Google Cloud Console
   2. Navigate to "IAM & Admin" > "Quotas"
   3. Search for "Gemini API"
   4. Select the quota you need to increase
   5. Click "Edit Quotas"
   6. Fill in the request form with justification
   7. Submit the request
   ```

2. **Use Multiple API Keys**:
   ```javascript
   // backend/config/gemini.js
   const API_KEYS = [
     process.env.GEMINI_API_KEY_1,
     process.env.GEMINI_API_KEY_2,
     process.env.GEMINI_API_KEY_3
   ];
   
   let currentKeyIndex = 0;
   
   function getNextApiKey() {
     const key = API_KEYS[currentKeyIndex];
     currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
     return key;
   }
   
   function getModel() {
     const apiKey = getNextApiKey();
     const genAI = new GoogleGenerativeAI(apiKey);
     return genAI.getGenerativeModel(modelConfig);
   }
   ```

3. **Implement Caching**:
   ```javascript
   // backend/services/cacheService.js
   const redis = require('redis');
   const client = redis.createClient();
   
   class CacheService {
     async getCachedGeneration(prompt, framework) {
       const cacheKey = `generation:${framework}:${this.hashPrompt(prompt)}`;
       const cached = await client.get(cacheKey);
       
       if (cached) {
         return JSON.parse(cached);
       }
       
       return null;
     }
     
     async setCachedGeneration(prompt, framework, result) {
       const cacheKey = `generation:${framework}:${this.hashPrompt(prompt)}`;
       await client.setex(cacheKey, 3600, JSON.stringify(result)); // Cache for 1 hour
     }
     
     hashPrompt(prompt) {
       // Simple hash function for cache key
       return require('crypto').createHash('md5').update(prompt).digest('hex');
     }
   }
   
   module.exports = new CacheService();
   ```

### Model Unavailable

#### Symptoms
- "Model not found" errors
- "Service unavailable" messages
- Generation failures with model-related errors

#### Diagnosis
1. Check available models:
   ```bash
   # List available Gemini models
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
   ```

2. Verify model name in configuration:
   ```bash
   cat backend/config/gemini.js | grep model
   ```

#### Solutions
1. **Model Fallback**:
   ```javascript
   // backend/config/gemini.js
   const AVAILABLE_MODELS = [
     'gemini-2.0-flash-exp',
     'gemini-1.5-pro',
     'gemini-1.5-flash'
   ];
   
   let currentModelIndex = 0;
   
   function getModel() {
     const model = AVAILABLE_MODELS[currentModelIndex];
     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
     
     try {
       return genAI.getGenerativeModel({ model, ...modelConfig });
     } catch (error) {
       // Try next model if current one is unavailable
       if (currentModelIndex < AVAILABLE_MODELS.length - 1) {
         currentModelIndex++;
         return getModel();
       } else {
         throw error; // All models unavailable
       }
     }
   }
   ```

2. **Model Health Check**:
   ```javascript
   // backend/services/modelHealthService.js
   class ModelHealthService {
     async checkModelAvailability(modelName) {
       try {
         const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
         const model = genAI.getGenerativeModel({ model: modelName });
         
         // Test with a simple prompt
         const result = await model.generateContent('Hello');
         return result.response.text() !== '';
       } catch (error) {
         console.error(`Model ${modelName} is unavailable:`, error.message);
         return false;
       }
     }
     
     async getAvailableModel() {
       for (const model of AVAILABLE_MODELS) {
         if (await this.checkModelAvailability(model)) {
           return model;
         }
       }
       
       throw new Error('No available models found');
     }
   }
   
   module.exports = new ModelHealthService();
   ```

### Content Filtering

#### Symptoms
- Generation blocked by content filters
- "Blocked by safety settings" errors
- Incomplete or censored responses

#### Diagnosis
1. Check safety settings configuration:
   ```bash
   cat backend/config/gemini.js | grep -A 20 safetySettings
   ```

2. Review Gemini API safety documentation:
   - https://ai.google.dev/gemini-api/docs/safety-settings

#### Solutions
1. **Adjust Safety Settings**:
   ```javascript
   // backend/config/gemini.js
   const safetySettings = [
     {
       category: 'HARM_CATEGORY_HARASSMENT',
       threshold: 'BLOCK_MEDIUM_AND_ABOVE', // Less restrictive
     },
     {
       category: 'HARM_CATEGORY_HATE_SPEECH',
       threshold: 'BLOCK_MEDIUM_AND_ABOVE',
     },
     {
       category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
       threshold: 'BLOCK_MEDIUM_AND_ABOVE',
     },
     {
       category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
       threshold: 'BLOCK_MEDIUM_AND_ABOVE',
     },
   ];
   ```

2. **Handle Blocked Content**:
   ```javascript
   // backend/services/generationService.js
   async function generateContent(prompt) {
     try {
       const result = await model.generateContent(prompt);
       return result.response.text();
     } catch (error) {
       if (error.message.includes('blocked by safety settings')) {
         // Log the blocked content for review
         console.warn('Content blocked by safety settings:', {
           prompt: prompt.substring(0, 100) + '...',
           error: error.message
         });
         
         // Return a user-friendly error message
         throw new Error('The content was blocked by safety filters. Please try rephrasing your request.');
       }
       
       throw error;
     }
   }
   ```

3. **Implement Content Review**:
   ```javascript
   // backend/services/contentModerationService.js
   class ContentModerationService {
     async preModerateContent(content) {
       // Check for potentially problematic content before sending to Gemini
       const flaggedTerms = ['explicit_term_1', 'explicit_term_2'];
       
       for (const term of flaggedTerms) {
         if (content.toLowerCase().includes(term)) {
           return {
             safe: false,
             reason: `Contains flagged term: ${term}`
           };
         }
       }
       
       return { safe: true };
     }
     
     async postModerateContent(content) {
       // Check generated content for issues
       // This could involve additional checks or logging
       return { safe: true, content };
     }
   }
   
   module.exports = new ContentModerationService();
   ```

## Security Issues

### Authentication Failures

#### Symptoms
- Login failures
- Invalid credentials errors
- Session hijacking attempts
- Brute force attacks

#### Diagnosis
1. Check authentication logs:
   ```bash
   tail -f backend/logs/auth.log
   ```

2. Monitor failed login attempts:
   ```bash
   grep "Authentication failed" backend/logs/auth.log
   ```

3. Review security headers:
   ```bash
   curl -I http://localhost:3001/api/auth/login
   ```

#### Solutions
1. **Implement Account Lockout**:
   ```javascript
   // backend/services/authService.js
   class AuthService {
     constructor() {
       this.failedAttempts = new Map();
       this.lockedAccounts = new Map();
       this.maxAttempts = 5;
       this.lockoutDuration = 30 * 60 * 1000; // 30 minutes
     }
     
     async authenticateUser(username, password) {
       // Check if account is locked
       if (this.isAccountLocked(username)) {
         throw new Error('Account temporarily locked due to too many failed attempts');
       }
       
       try {
         // Attempt authentication
         const user = await this.verifyCredentials(username, password);
         
         // Reset failed attempts on successful login
         this.resetFailedAttempts(username);
         
         return user;
       } catch (error) {
         // Increment failed attempts
         this.incrementFailedAttempts(username);
         
         throw error;
       }
     }
     
     isAccountLocked(username) {
       const lockInfo = this.lockedAccounts.get(username);
       if (!lockInfo) return false;
       
       if (Date.now() - lockInfo.timestamp > this.lockoutDuration) {
         // Lockout period expired
         this.lockedAccounts.delete(username);
         return false;
       }
       
       return true;
     }
     
     incrementFailedAttempts(username) {
       const attempts = this.failedAttempts.get(username) || 0;
       const newAttempts = attempts + 1;
       this.failedAttempts.set(username, newAttempts);
       
       if (newAttempts >= this.maxAttempts) {
         // Lock the account
         this.lockedAccounts.set(username, {
           timestamp: Date.now()
         });
         this.failedAttempts.delete(username);
       }
     }
     
     resetFailedAttempts(username) {
       this.failedAttempts.delete(username);
       this.lockedAccounts.delete(username);
     }
   }
   ```

2. **Implement Multi-Factor Authentication**:
   ```javascript
   // backend/services/mfaService.js
   const speakeasy = require('speakeasy');

   class MFAService {
     async generateTOTPSecret(userId) {
       const secret = speakeasy.generateSecret({
         name: 'Ironclad',
         issuer: 'Deeper Research Synthetic',
         account: userId
       });
       
       // Save secret to user record
       await User.updateOne(
         { _id: userId },
         { $set: { totpSecret: secret.base32 } }
       );
       
       return secret;
     }
     
     async verifyTOTPToken(userId, token) {
       const user = await User.findById(userId);
       if (!user || !user.totpSecret) {
         throw new Error('TOTP not configured for user');
       }
       
       return speakeasy.totp.verify({
         secret: user.totpSecret,
         encoding: 'base32',
         token: token,
         window: 2
       });
     }
   }
   
   module.exports = new MFAService();
   ```

3. **Rate Limit Authentication Attempts**:
   ```javascript
   // backend/middleware/authRateLimiter.js
   const rateLimit = require('express-rate-limit');

   const authRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // limit each IP to 5 login attempts per windowMs
     message: {
       error: 'Too many authentication attempts, please try again later.'
     },
     standardHeaders: true,
     legacyHeaders: false,
     skipSuccessfulRequests: true
   });

   module.exports = authRateLimiter;
   ```

### Authorization Problems

#### Symptoms
- Access denied errors
- Insufficient permissions
- Privilege escalation attempts
- Unauthorized resource access

#### Diagnosis
1. Check authorization logs:
   ```bash
   tail -f backend/logs/authz.log
   ```

2. Review user roles and permissions:
   ```bash
   # Check database for user roles
   mongo ironclad --eval "db.users.find({}, {username: 1, role: 1})"
   ```

3. Test authorization endpoints:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/users
   ```

#### Solutions
1. **Implement Role-Based Access Control**:
   ```javascript
   // backend/middleware/authorization.js
   const ROLES = {
     ADMIN: 'admin',
     USER: 'user',
     GUEST: 'guest'
   };

   const PERMISSIONS = {
     CREATE_PROJECT: 'create_project',
     DELETE_PROJECT: 'delete_project',
     ACCESS_ALL_PROJECTS: 'access_all_projects',
     MANAGE_USERS: 'manage_users'
   };

   const ROLE_PERMISSIONS = {
     [ROLES.ADMIN]: [
       PERMISSIONS.CREATE_PROJECT,
       PERMISSIONS.DELETE_PROJECT,
       PERMISSIONS.ACCESS_ALL_PROJECTS,
       PERMISSIONS.MANAGE_USERS
     ],
     [ROLES.USER]: [
       PERMISSIONS.CREATE_PROJECT,
       PERMISSIONS.DELETE_PROJECT
     ],
     [ROLES.GUEST]: []
   };

   function requirePermission(permission) {
     return (req, res, next) => {
       const userRole = req.user.role;
       const userPermissions = ROLE_PERMISSIONS[userRole] || [];
       
       if (!userPermissions.includes(permission)) {
         return res.status(403).json({ error: 'Insufficient permissions' });
       }
       
       next();
     };
   }

   module.exports = {
     ROLES,
     PERMISSIONS,
     ROLE_PERMISSIONS,
     requirePermission
   };
   ```

2. **Implement Resource-Based Access Control**:
   ```javascript
   // backend/middleware/resourceAuthorization.js
   async function requireProjectOwnership(req, res, next) {
     const projectId = req.params.projectId;
     const userId = req.user.id;
     
     try {
       const project = await Project.findOne({ 
         _id: projectId, 
         ownerId: userId 
       });
       
       if (!project) {
         return res.status(403).json({ 
           error: 'Access denied: You do not own this project' 
         });
       }
       
       req.project = project;
       next();
     } catch (error) {
       console.error('Authorization error:', error);
       res.status(500).json({ error: 'Internal server error' });
     }
   }

   module.exports = {
     requireProjectOwnership
   };
   ```

3. **Audit Authorization Decisions**:
   ```javascript
   // backend/services/authorizationAuditService.js
   class AuthorizationAuditService {
     logAuthorizationDecision(userId, resource, action, granted, reason = null) {
       const logEntry = {
         timestamp: new Date().toISOString(),
         userId: userId,
         resource: resource,
         action: action,
         granted: granted,
         reason: reason,
         ipAddress: this.getClientIP(),
         userAgent: this.getUserAgent()
       };
       
       // Save to audit log
       this.saveAuditLog(logEntry);
       
       // Alert on suspicious activities
       if (!granted && this.isSuspiciousActivity(logEntry)) {
         this.sendSecurityAlert(logEntry);
       }
     }
     
     isSuspiciousActivity(logEntry) {
       // Check for patterns indicating potential security issues
       // e.g., repeated access denied errors from same IP
       return false; // Implement your logic here
     }
   }
   
   module.exports = new AuthorizationAuditService();
   ```

### Security Alerts

#### Symptoms
- Suspicious activity detected
- Security breach notifications
- Unusual traffic patterns
- Malware or exploit attempts

#### Diagnosis
1. Check security logs:
   ```bash
   tail -f backend/logs/security.log
   ```

2. Monitor network traffic:
   ```bash
   # Use tools like tcpdump or wireshark
   tcpdump -i any port 3001
   ```

3. Review intrusion detection alerts:
   ```bash
   # Check for IDS alerts
   cat /var/log/snort/alert
   ```

#### Solutions
1. **Implement Intrusion Detection**:
   ```javascript
   // backend/middleware/intrusionDetection.js
   class IntrusionDetector {
     constructor() {
       this.suspiciousActivities = new Map();
       this.blockedIPs = new Set();
     }
     
     detectSuspiciousActivity(req, res, next) {
       const ip = req.ip;
       
       // Check if IP is blocked
       if (this.blockedIPs.has(ip)) {
         return res.status(403).json({ 
           error: 'Access denied due to suspicious activity' 
         });
       }
       
       // Check for common attack patterns
       if (this.isPotentialAttack(req)) {
         this.logSuspiciousActivity(ip, req);
         this.incrementSuspiciousCounter(ip);
         
         // Block IP after multiple suspicious activities
         if (this.getSuspiciousCount(ip) > 10) {
           this.blockIP(ip);
           this.sendSecurityAlert(ip, 'IP blocked due to repeated suspicious activity');
         }
       }
       
       next();
     }
     
     isPotentialAttack(req) {
       // Check for SQL injection attempts
       const sqlInjectionPatterns = [
         /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
         /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
         /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i
       ];
       
       const url = req.url;
       const body = JSON.stringify(req.body);
       
       return sqlInjectionPatterns.some(pattern => 
         pattern.test(url) || pattern.test(body)
       );
     }
     
     logSuspiciousActivity(ip, req) {
       const logEntry = {
         timestamp: new Date().toISOString(),
         ip: ip,
         method: req.method,
         url: req.url,
         userAgent: req.get('User-Agent'),
         body: req.body
       };
       
       console.warn('Suspicious activity detected:', logEntry);
       this.saveSecurityLog(logEntry);
     }
   }
   
   module.exports = new IntrusionDetector();
   ```

2. **Implement Security Headers**:
   ```javascript
   // backend/middleware/securityHeaders.js
   const helmet = require('helmet');

   function securityHeaders(req, res, next) {
     // Apply Helmet middleware for common security headers
     helmet()(req, res, next);
     
     // Additional custom headers
     res.setHeader('X-Content-Type-Options', 'nosniff');
     res.setHeader('X-Frame-Options', 'DENY');
     res.setHeader('X-XSS-Protection', '1; mode=block');
     res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
     res.setHeader('Referrer-Policy', 'no-referrer');
     res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
     
     next();
   }

   module.exports = securityHeaders;
   ```

3. **Implement Request Size Limits**:
   ```javascript
   // backend/middleware/requestSizeLimit.js
   function requestSizeLimit(req, res, next) {
     // Limit request body size
     const maxSize = 10 * 1024 * 1024; // 10MB
     let data = '';
     
     req.on('data', chunk => {
       data += chunk;
       if (data.length > maxSize) {
         // Destroy the stream to prevent further data
         req.destroy();
         return res.status(413).json({ 
           error: 'Request entity too large' 
         });
       }
     });
     
     req.on('end', () => {
       req.rawBody = data;
       try {
         req.body = JSON.parse(data);
       } catch (error) {
         return res.status(400).json({ 
           error: 'Invalid JSON in request body' 
         });
       }
       next();
     });
   }

   module.exports = requestSizeLimit;
   ```

## Performance Troubleshooting

### Slow API Responses

#### Symptoms
- API calls taking longer than expected
- User interface lagging
- Timeouts occurring frequently
- Poor user experience

#### Diagnosis
1. Profile API endpoints:
   ```bash
   # Use tools like clinic.js or 0x
   npm install -g clinic
   clinic doctor -- node server.js
   ```

2. Monitor database queries:
   ```javascript
   // Add query profiling to database operations
   mongoose.set('debug', true);
   ```

3. Check system resources:
   ```bash
   # Monitor CPU, memory, and disk usage
   top
   iostat -x 1
   ```

#### Solutions
1. **Implement Caching**:
   ```javascript
   // backend/services/cacheService.js
   const redis = require('redis');
   const client = redis.createClient();
   
   class CacheService {
     async getCachedData(key) {
       const cached = await client.get(key);
       return cached ? JSON.parse(cached) : null;
     }
     
     async setCachedData(key, data, ttl = 300) {
       await client.setex(key, ttl, JSON.stringify(data));
     }
     
     async invalidateCache(pattern) {
       const keys = await client.keys(pattern);
       if (keys.length > 0) {
         await client.del(...keys);
       }
     }
   }
   
   module.exports = new CacheService();
   ```

2. **Optimize Database Queries**:
   ```javascript
   // backend/services/projectService.js
   class ProjectService {
     async getProjectsWithPagination(page = 1, limit = 10) {
       // Use pagination to avoid loading all projects at once
       const skip = (page - 1) * limit;
       
       const projects = await Project.find()
         .skip(skip)
         .limit(limit)
         .sort({ createdAt: -1 })
         .select('name framework createdAt'); // Only select needed fields
       
       const total = await Project.countDocuments();
       
       return {
         projects,
         pagination: {
           page,
           limit,
           total,
           pages: Math.ceil(total / limit)
         }
       };
     }
     
     async getProjectById(id) {
       // Use lean() for read-only operations to reduce memory usage
       return await Project.findById(id).lean();
     }
   }
   ```

3. **Implement Connection Pooling**:
   ```javascript
   // backend/config/database.js
   const mongoose = require('mongoose');
   
   const connectionOptions = {
     useNewUrlParser: true,
     useUnifiedTopology: true,
     maxPoolSize: 10, // Maximum number of connections
     serverSelectionTimeoutMS: 5000, // Timeout after 5s
     socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
   };
   
   mongoose.connect(process.env.DATABASE_URL, connectionOptions);
   ```

### High Memory Usage

#### Symptoms
- Application consuming excessive memory
- Out of memory errors (OOM)
- Garbage collection pauses
- Slow performance

#### Diagnosis
1. Monitor memory usage:
   ```bash
   # Use node --inspect for memory profiling
   node --inspect server.js
   ```

2. Check for memory leaks:
   ```bash
   # Use tools like memwatch-next
   npm install memwatch-next
   
   const memwatch = require('memwatch-next');
   memwatch.on('leak', (info) => {
     console.error('Memory leak detected:', info);
   });
   ```

3. Profile heap usage:
   ```bash
   # Generate heap snapshots
   node --inspect --inspect-brk server.js
   # Then connect with Chrome DevTools and take heap snapshots
   ```

#### Solutions
1. **Implement Memory Monitoring**:
   ```javascript
   // backend/services/memoryMonitor.js
   class MemoryMonitor {
     constructor() {
       this.threshold = 0.8; // 80% of available memory
       this.checkInterval = 30000; // 30 seconds
       this.startMonitoring();
     }
     
     startMonitoring() {
       setInterval(() => {
         const usage = this.getMemoryUsage();
         if (usage.heapUsedRatio > this.threshold) {
           this.handleHighMemoryUsage(usage);
         }
       }, this.checkInterval);
     }
     
     getMemoryUsage() {
       const mem = process.memoryUsage();
       return {
         rss: mem.rss,
         heapTotal: mem.heapTotal,
         heapUsed: mem.heapUsed,
         external: mem.external,
         heapUsedRatio: mem.heapUsed / mem.heapTotal
       };
     }
     
     handleHighMemoryUsage(usage) {
       console.warn('High memory usage detected:', usage);
       
       // Trigger garbage collection if available
       if (global.gc) {
         global.gc();
       }
       
       // Log warning and possibly restart service
       this.logWarning(usage);
       
       // In extreme cases, you might want to restart the process
       // process.exit(1); // Let process manager restart
     }
     
     logWarning(usage) {
       // Log to monitoring system
       console.warn('Memory usage alert:', {
         timestamp: new Date().toISOString(),
         memoryUsage: usage
       });
     }
   }
   
   // Enable garbage collection
   // Start node with --expose-gc flag
   if (process.env.NODE_ENV === 'development') {
     new MemoryMonitor();
   }
   
   module.exports = MemoryMonitor;
   ```

2. **Implement Efficient Data Streaming**:
   ```javascript
   // backend/services/streamingService.js
   const { Transform, PassThrough } = require('stream');
   
   class StreamingService {
     // Stream large data instead of loading into memory
     streamLargeDataset(query, res) {
       const stream = Project.find(query).cursor();
       
       res.setHeader('Content-Type', 'application/json');
       res.write('[');
       
       let first = true;
       
       stream.on('data', (doc) => {
         if (!first) {
           res.write(',');
         }
         res.write(JSON.stringify(doc));
         first = false;
       });
       
       stream.on('end', () => {
         res.write(']');
         res.end();
       });
       
       stream.on('error', (error) => {
         console.error('Streaming error:', error);
         res.status(500).json({ error: 'Streaming failed' });
       });
     }
     
     // Transform stream for processing data on-the-fly
     createTransformStream(transformFunction) {
       return new Transform({
         objectMode: true,
         transform(chunk, encoding, callback) {
           try {
             const transformed = transformFunction(chunk);
             callback(null, transformed);
           } catch (error) {
             callback(error);
           }
         }
       });
     }
   }
   
   module.exports = new StreamingService();
   ```

3. **Implement Proper Cleanup**:
   ```javascript
   // backend/services/resourceManager.js
   class ResourceManager {
     constructor() {
       this.resources = new Map();
     }
     
     registerResource(id, resource, cleanupFn) {
       this.resources.set(id, {
         resource,
         cleanup: cleanupFn,
         createdAt: Date.now()
       });
     }
     
     unregisterResource(id) {
       const resource = this.resources.get(id);
       if (resource && resource.cleanup) {
         try {
           resource.cleanup(resource.resource);
         } catch (error) {
           console.error('Error cleaning up resource:', error);
         }
       }
       this.resources.delete(id);
     }
     
     cleanupAll() {
       for (const [id, resource] of this.resources) {
         this.unregisterResource(id);
       }
     }
     
     // Periodically clean up stale resources
     startCleanupInterval() {
       setInterval(() => {
         const now = Date.now();
         const staleThreshold = 5 * 60 * 1000; // 5 minutes
         
         for (const [id, resource] of this.resources) {
           if (now - resource.createdAt > staleThreshold) {
             this.unregisterResource(id);
           }
         }
       }, 60000); // Check every minute
     }
   }
   
   const resourceManager = new ResourceManager();
   resourceManager.startCleanupInterval();
   
   // Clean up on process exit
   process.on('exit', () => {
     resourceManager.cleanupAll();
   });
   
   process.on('SIGINT', () => {
     resourceManager.cleanupAll();
     process.exit(0);
   });
   
   module.exports = resourceManager;
   ```

### CPU Bottlenecks

#### Symptoms
- High CPU usage
- Slow response times
- Application freezing
- Poor scalability

#### Diagnosis
1. Monitor CPU usage:
   ```bash
   # Use top or htop
   top -p $(pgrep -f node)
   
   # Use Node.js profiler
   node --prof server.js
   node --prof-process isolate-*.log
   ```

2. Identify hot paths:
   ```bash
   # Use clinic.js flame
   clinic flame -- node server.js
   ```

3. Check for blocking operations:
   ```javascript
   // Look for synchronous operations in code
   // Especially in request handlers
   ```

#### Solutions
1. **Offload CPU-Intensive Tasks**:
   ```javascript
   // backend/services/cpuIntensiveService.js
   const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
   
   class CPUIntensiveService {
     // Offload heavy computation to worker threads
     async processHeavyTask(data) {
       return new Promise((resolve, reject) => {
         if (isMainThread) {
           const worker = new Worker(__filename, {
             workerData: { task: 'heavy-computation', data }
           });
           
           worker.on('message', resolve);
           worker.on('error', reject);
           worker.on('exit', (code) => {
             if (code !== 0) {
               reject(new Error(`Worker stopped with exit code ${code}`));
             }
           });
         } else {
           // Worker thread code
           if (workerData.task === 'heavy-computation') {
             const result = this.performHeavyComputation(workerData.data);
             parentPort.postMessage(result);
           }
         }
       });
     }
     
     performHeavyComputation(data) {
       // CPU-intensive operation
       let result = 0;
       for (let i = 0; i < data.iterations; i++) {
         result += Math.sqrt(i);
       }
       return result;
     }
   }
   
   // Export worker thread code separately
   if (!isMainThread) {
     const service = new CPUIntensiveService();
     // Worker thread will handle messages
     parentPort.on('message', async (message) => {
       if (message.task === 'heavy-computation') {
         const result = service.performHeavyComputation(message.data);
         parentPort.postMessage(result);
       }
     });
   }
   
   module.exports = new CPUIntensiveService();
   ```

2. **Implement Request Queuing**:
   ```javascript
   // backend/services/requestQueue.js
   class RequestQueue {
     constructor() {
       this.queue = [];
       this.processing = false;
       this.maxConcurrent = 2; // Limit concurrent CPU-intensive requests
     }
     
     async enqueue(requestHandler, ...args) {
       return new Promise((resolve, reject) => {
         this.queue.push({
           handler: requestHandler,
           args: args,
           resolve,
           reject
         });
         
         if (!this.processing) {
           this.processQueue();
         }
       });
     }
     
     async processQueue() {
       this.processing = true;
       
       while (this.queue.length > 0) {
         // Process up to maxConcurrent requests
         const batch = this.queue.splice(0, this.maxConcurrent);
         
         const promises = batch.map(async (item) => {
           try {
             const result = await item.handler(...item.args);
             item.resolve(result);
           } catch (error) {
             item.reject(error);
           }
         });
         
         await Promise.all(promises);
         
         // Small delay to prevent overwhelming CPU
         await new Promise(resolve => setImmediate(resolve));
       }
       
       this.processing = false;
     }
   }
   
   module.exports = new RequestQueue();
   ```

3. **Implement Caching for Expensive Operations**:
   ```javascript
   // backend/services/expensiveOperationCache.js
   const NodeCache = require('node-cache');
   
   class ExpensiveOperationCache {
     constructor() {
       this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL
       this.pendingOperations = new Map();
     }
     
     async getCachedOrCompute(key, computeFunction, ...args) {
       // Check if result is cached
       const cached = this.cache.get(key);
       if (cached !== undefined) {
         return cached;
       }
       
       // Check if operation is already pending
       if (this.pendingOperations.has(key)) {
         // Return promise for pending operation
         return this.pendingOperations.get(key);
       }
       
       // Start new operation
       const operationPromise = computeFunction(...args)
         .then(result => {
           // Cache result
           this.cache.set(key, result);
           // Remove from pending operations
           this.pendingOperations.delete(key);
           return result;
         })
         .catch(error => {
           // Remove from pending operations on error
           this.pendingOperations.delete(key);
           throw error;
         });
       
       // Store pending operation
       this.pendingOperations.set(key, operationPromise);
       
       return operationPromise;
     }
     
     invalidate(key) {
       this.cache.del(key);
       this.pendingOperations.delete(key);
     }
     
     clear() {
       this.cache.flushAll();
       this.pendingOperations.clear();
     }
   }
   
   module.exports = new ExpensiveOperationCache();
   ```

## Logging and Monitoring

### Log Analysis

#### Symptoms
- Difficulty identifying issues from logs
- Missing critical information
- Log files growing too large
- Poor log formatting

#### Diagnosis
1. Check current logging configuration:
   ```bash
   cat backend/config/logging.js
   ```

2. Review log file structure:
   ```bash
   ls -la backend/logs/
   ```

3. Analyze log content:
   ```bash
   tail -f backend/logs/app.log
   ```

#### Solutions
1. **Implement Structured Logging**:
   ```javascript
   // backend/services/logger.js
   const winston = require('winston');
   const path = require('path');
   
   // Custom format for structured logging
   const logFormat = winston.format.combine(
     winston.format.timestamp(),
     winston.format.errors({ stack: true }),
     winston.format.json()
   );
   
   const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: logFormat,
     defaultMeta: { service: 'ironclad' },
     transports: [
       // Write all logs with level `info` and below to `combined.log`
       new winston.transports.File({ 
         filename: path.join(__dirname, '../logs/combined.log'),
         level: 'info'
       }),
       
       // Write all logs with level `error` and below to `error.log`
       new winston.transports.File({ 
         filename: path.join(__dirname, '../logs/error.log'),
         level: 'error'
       }),
       
       // Write to console in development
       ...(process.env.NODE_ENV !== 'production' ? [
         new winston.transports.Console({
           format: winston.format.combine(
             winston.format.colorize(),
             winston.format.simple()
           )
         })
       ] : [])
     ]
   });
   
   // Add request logging middleware
   function requestLogger(req, res, next) {
     const start = Date.now();
     
     res.on('finish', () => {
       const duration = Date.now() - start;
       
       logger.info('HTTP Request', {
         method: req.method,
         url: req.url,
         statusCode: res.statusCode,
         duration: duration,
         userAgent: req.get('User-Agent'),
         ip: req.ip,
         userId: req.user?.id
       });
     });
     
     next();
   }
   
   module.exports = { logger, requestLogger };
   ```

2. **Implement Log Rotation**:
   ```javascript
   // backend/services/logRotation.js
   const rotateLogs = require('winston-daily-rotate-file');
   
   const rotatedFileTransport = new rotateLogs({
     filename: path.join(__dirname, '../logs/application-%DATE%.log'),
     datePattern: 'YYYY-MM-DD',
     zippedArchive: true,
     maxSize: '20m',
     maxFiles: '14d'
   });
   
   logger.add(rotatedFileTransport);
   ```

3. **Implement Log Filtering and Searching**:
   ```javascript
   // backend/services/logAnalyzer.js
   const fs = require('fs');
   const readline = require('readline');
   
   class LogAnalyzer {
     async searchLogs(searchTerm, logFile = 'combined.log', limit = 100) {
       const filePath = path.join(__dirname, '../logs', logFile);
       const results = [];
       
       const rl = readline.createInterface({
         input: fs.createReadStream(filePath),
         crlfDelay: Infinity
       });
       
       for await (const line of rl) {
         if (line.includes(searchTerm)) {
           results.push(JSON.parse(line));
           if (results.length >= limit) {
             break;
           }
         }
       }
       
       return results;
     }
     
     async getErrorSummary(hours = 24) {
       const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
       const errors = await this.searchLogs('"level":"error"', 'error.log');
       
       return errors.filter(error => {
         const timestamp = new Date(error.timestamp).getTime();
         return timestamp > cutoffTime;
       });
     }
     
     async getPerformanceMetrics(hours = 24) {
       const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
       const logs = await this.searchLogs('"HTTP Request"', 'combined.log');
       
       const recentRequests = logs.filter(log => {
         const timestamp = new Date(log.timestamp).getTime();
         return timestamp > cutoffTime;
       });
       
       const metrics = {
         totalRequests: recentRequests.length,
         averageResponseTime: 0,
         errorRate: 0,
         slowRequests: 0
       };
       
       if (recentRequests.length > 0) {
         const totalDuration = recentRequests.reduce((sum, req) => sum + req.duration, 0);
         metrics.averageResponseTime = totalDuration / recentRequests.length;
         
         const errorRequests = recentRequests.filter(req => req.statusCode >= 400);
         metrics.errorRate = (errorRequests.length / recentRequests.length) * 100;
         
         metrics.slowRequests = recentRequests.filter(req => req.duration > 5000).length;
       }
       
       return metrics;
     }
   }
   
   module.exports = new LogAnalyzer();
   ```

### Monitoring Dashboard Issues

#### Symptoms
- Monitoring dashboards not updating
- Metrics not displaying correctly
- Alerting not working
- Dashboard performance issues

#### Diagnosis
1. Check monitoring service status:
   ```bash
   # For Prometheus
   curl http://localhost:9090/-/healthy
   
   # For Grafana
   curl http://localhost:3000/api/health
   ```

2. Verify metric endpoints:
   ```bash
   curl http://localhost:3001/metrics
   ```

3. Review monitoring configuration:
   ```bash
   cat prometheus.yml
   cat grafana/dashboards/ironclad.json
   ```

#### Solutions
1. **Implement Application Metrics**:
   ```javascript
   // backend/services/metricsService.js
   const client = require('prom-client');
   
   // Create a Registry which registers the metrics
   const register = new client.Registry();
   register.setDefaultLabels({
     app: 'ironclad-backend'
   });
   
   // Enable the collection of default metrics
   client.collectDefaultMetrics({ register });
   
   // Custom metrics
   const httpRequestDuration = new client.Histogram({
     name: 'http_request_duration_seconds',
     help: 'Duration of HTTP requests in seconds',
     labelNames: ['method', 'route', 'status_code'],
     buckets: [0.1, 0.5, 1, 2, 5, 10]
   });
   
   const activeUsers = new client.Gauge({
     name: 'active_users_total',
     help: 'Number of active users'
   });
   
   const generationRequests = new client.Counter({
     name: 'generation_requests_total',
     help: 'Total number of generation requests',
     labelNames: ['framework']
   });
   
   register.registerMetric(httpRequestDuration);
   register.registerMetric(activeUsers);
   register.registerMetric(generationRequests);
   
   // Middleware to track request duration
   function metricsMiddleware(req, res, next) {
     const start = Date.now();
     
     res.on('finish', () => {
       const duration = (Date.now() - start) / 1000;
       httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(duration);
     });
     
     next();
   }
   
   // Expose metrics endpoint
   function metricsEndpoint(req, res) {
     res.set('Content-Type', register.contentType);
     res.end(register.metrics());
   }
   
   module.exports = {
     register,
     metricsMiddleware,
     metricsEndpoint,
     activeUsers,
     generationRequests
   };
   ```

2. **Implement Health Checks**:
   ```javascript
   // backend/routes/health.js
   const { register } = require('../services/metricsService');
   
   router.get('/health', async (req, res) => {
     const healthCheck = {
       uptime: process.uptime(),
       message: 'OK',
       timestamp: Date.now(),
       checks: {
         database: await checkDatabase(),
         gemini: await checkGeminiAPI(),
         diskSpace: await checkDiskSpace(),
         memory: checkMemoryUsage()
       }
     };
     
     const isHealthy = Object.values(healthCheck.checks).every(check => check.healthy);
     
     res.status(isHealthy ? 200 : 503).json(healthCheck);
   });
   
   async function checkDatabase() {
     try {
       await mongoose.connection.db.admin().ping();
       return { healthy: true };
     } catch (error) {
       return { healthy: false, error: error.message };
     }
   }
   
   async function checkGeminiAPI() {
     try {
       // Simple test request to Gemini API
       const model = getModel();
       const result = await model.generateContent('ping');
       return { healthy: true };
     } catch (error) {
       return { healthy: false, error: error.message };
     }
   }
   
   async function checkDiskSpace() {
     const checkDiskSpace = require('check-disk-space');
     try {
       const diskSpace = await checkDiskSpace('/');
       const freePercentage = (diskSpace.free / diskSpace.size) * 100;
       return { 
         healthy: freePercentage > 10, 
         free: diskSpace.free,
         total: diskSpace.size,
         percentage: freePercentage
       };
     } catch (error) {
       return { healthy: false, error: error.message };
     }
   }
   
   function checkMemoryUsage() {
     const mem = process.memoryUsage();
     const heapUsedPercentage = (mem.heapUsed / mem.heapTotal) * 100;
     return {
       healthy: heapUsedPercentage < 80,
       heapUsed: mem.heapUsed,
       heapTotal: mem.heapTotal,
       percentage: heapUsedPercentage
     };
   }
   
   module.exports = router;
   ```

3. **Implement Alerting**:
   ```javascript
   // backend/services/alertService.js
   class AlertService {
     constructor() {
       this.alerts = [];
       this.checkInterval = 60000; // 1 minute
       this.startMonitoring();
     }
     
     startMonitoring() {
       setInterval(async () => {
         await this.checkAlerts();
       }, this.checkInterval);
     }
     
     async checkAlerts() {
       // Check for high error rates
       const errorRate = await this.getErrorRate();
       if (errorRate > 0.05) { // 5% error rate
         this.sendAlert('HIGH_ERROR_RATE', {
           errorRate: errorRate,
           threshold: 0.05
         });
       }
       
       // Check for high response times
       const avgResponseTime = await this.getAverageResponseTime();
       if (avgResponseTime > 5000) { // 5 seconds
         this.sendAlert('HIGH_RESPONSE_TIME', {
           avgResponseTime: avgResponseTime,
           threshold: 5000
         });
       }
       
       // Check for low disk space
       const diskUsage = await this.getDiskUsage();
       if (diskUsage.percentage < 10) { // Less than 10% free
         this.sendAlert('LOW_DISK_SPACE', {
           freePercentage: diskUsage.percentage,
           threshold: 10
         });
       }
     }
     
     sendAlert(type, data) {
       const alert = {
         id: this.generateAlertId(),
         type: type,
         timestamp: new Date().toISOString(),
         data: data,
         acknowledged: false
       };
       
       this.alerts.push(alert);
       
       // Send notification (email, Slack, etc.)
       this.notifyTeam(alert);
       
       // Log alert
       console.error('ALERT:', alert);
     }
     
     notifyTeam(alert) {
       // Implementation depends on your notification system
       // Could be email, Slack, SMS, etc.
       console.log('Sending alert notification:', alert);
     }
     
     getActiveAlerts() {
       return this.alerts.filter(alert => !alert.acknowledged);
     }
     
     acknowledgeAlert(alertId) {
       const alert = this.alerts.find(a => a.id === alertId);
       if (alert) {
         alert.acknowledged = true;
       }
     }
   }
   
   module.exports = new AlertService();
   ```

## Advanced Debugging Techniques

### Debugging with Node.js Inspector

#### Symptoms
- Complex issues difficult to troubleshoot with logs
- Need to inspect runtime state
- Performance bottlenecks requiring detailed analysis

#### Diagnosis
1. Start Node.js with inspector:
   ```bash
   node --inspect-brk server.js
   ```

2. Connect with Chrome DevTools:
   - Open Chrome
   - Navigate to chrome://inspect
   - Click "Open dedicated DevTools for Node"

3. Set breakpoints and inspect variables

#### Solutions
1. **Remote Debugging Setup**:
   ```javascript
   // backend/config/debug.js
   const debug = require('debug')('ironclad');
   
   // Enable debugging in development
   if (process.env.NODE_ENV === 'development') {
     // Enable debug output
     process.env.DEBUG = 'ironclad:*';
   }
   
   // Use debug statements in code
   function someComplexFunction(param) {
     debug('Entering someComplexFunction with param:', param);
     
     // Complex logic here
     const result = performComplexOperation(param);
     
     debug('someComplexFunction result:', result);
     return result;
   }
   
   module.exports = debug;
   ```

2. **Profiling with Clinic.js**:
   ```bash
   # Install clinic globally
   npm install -g clinic
   
   # Run diagnostic tools
   clinic doctor -- node server.js
   clinic bubbleprof -- node server.js
   clinic flame -- node server.js
   
   # Open generated reports
   ```

3. **Memory Profiling**:
   ```bash
   # Run with heap profiler
   node --inspect server.js
   
   # In Chrome DevTools:
   # 1. Go to Memory tab
   # 2. Take heap snapshots
   # 3. Compare snapshots to identify memory leaks
   ```

### Network Traffic Analysis

#### Symptoms
- Network-related issues
- API communication problems
- Slow external service responses
- Security concerns with network traffic

#### Diagnosis
1. Capture network traffic:
   ```bash
   # Use tcpdump to capture traffic
   sudo tcpdump -i any -w capture.pcap port 3001
   
   # Analyze with Wireshark
   wireshark capture.pcap
   ```

2. Monitor with ngrep:
   ```bash
   # Monitor HTTP traffic
   ngrep -d any port 3001
   ```

3. Use mitmproxy for detailed inspection:
   ```bash
   # Install mitmproxy
   brew install mitmproxy
   
   # Run mitmproxy
   mitmproxy -p 8080
   ```

#### Solutions
1. **Implement Request Logging**:
   ```javascript
   // backend/middleware/requestLogger.js
   const logger = require('../services/logger').logger;
   
   function detailedRequestLogger(req, res, next) {
     const startTime = Date.now();
     
     // Log request details
     logger.info('Incoming request', {
       method: req.method,
       url: req.url,
       headers: req.headers,
       body: req.body,
       ip: req.ip,
       userAgent: req.get('User-Agent'),
       timestamp: new Date().toISOString()
     });
     
     // Capture response
     const originalSend = res.send;
     let responseBody;
     
     res.send = function(data) {
       responseBody = data;
       return originalSend.call(this, data);
     };
     
     res.on('finish', () => {
       const duration = Date.now() - startTime;
       
       logger.info('Outgoing response', {
         method: req.method,
         url: req.url,
         statusCode: res.statusCode,
         duration: duration,
         responseBody: responseBody,
         timestamp: new Date().toISOString()
       });
     });
     
     next();
   }
   
   module.exports = detailedRequestLogger;
   ```

2. **Implement Network Monitoring**:
   ```javascript
   // backend/services/networkMonitor.js
   class NetworkMonitor {
     constructor() {
       this.connections = new Map();
       this.stats = {
         totalRequests: 0,
         totalErrors: 0,
         averageResponseTime: 0,
         activeConnections: 0
       };
     }
     
     trackRequest(req, res) {
       const connectionId = `${req.ip}-${Date.now()}`;
       const startTime = Date.now();
       
       this.connections.set(connectionId, {
         id: connectionId,
         ip: req.ip,
         method: req.method,
         url: req.url,
         startTime: startTime,
         userAgent: req.get('User-Agent')
       });
       
       this.stats.totalRequests++;
       this.stats.activeConnections = this.connections.size;
       
       res.on('finish', () => {
         const duration = Date.now() - startTime;
         this.connections.delete(connectionId);
         this.stats.activeConnections = this.connections.size;
         
         if (res.statusCode >= 400) {
           this.stats.totalErrors++;
         }
         
         // Update average response time
         this.updateAverageResponseTime(duration);
       });
       
       res.on('close', () => {
         this.connections.delete(connectionId);
         this.stats.activeConnections = this.connections.size;
       });
     }
     
     updateAverageResponseTime(duration) {
       // Simple moving average
       const currentAvg = this.stats.averageResponseTime;
       const total = this.stats.totalRequests;
       this.stats.averageResponseTime = ((currentAvg * (total - 1)) + duration) / total;
     }
     
     getConnectionStats() {
       return {
         ...this.stats,
         connections: Array.from(this.connections.values())
       };
     }
   }
   
   module.exports = new NetworkMonitor();
   ```

### Memory Leak Detection

#### Symptoms
- Gradually increasing memory usage
- Application crashes with OOM errors
- Performance degradation over time
- GC pressure

#### Diagnosis
1. Monitor memory with Node.js built-in tools:
   ```bash
   # Run with memory tracking
   node --inspect --expose-gc server.js
   ```

2. Use memwatch-next:
   ```bash
   npm install memwatch-next
   ```

3. Profile with heap snapshots:
   ```bash
   # In Chrome DevTools Memory tab
   # Take multiple heap snapshots over time
   # Compare snapshots to identify growing objects
   ```

#### Solutions
1. **Implement Memory Leak Detection**:
   ```javascript
   // backend/services/memoryLeakDetector.js
   const memwatch = require('memwatch-next');
   
   class MemoryLeakDetector {
     constructor() {
       this.leaks = [];
       this.setupListeners();
     }
     
     setupListeners() {
       memwatch.on('leak', (info) => {
         const leak = {
           ...info,
           timestamp: new Date().toISOString(),
           type: 'memory_leak'
         };
         
         this.leaks.push(leak);
         console.error('Memory leak detected:', leak);
         this.sendAlert(leak);
       });
       
       memwatch.on('stats', (stats) => {
         console.log('GC stats:', stats);
         this.checkForIssues(stats);
       });
     }
     
     checkForIssues(stats) {
       // Check for concerning GC patterns
       if (stats.current_base > stats.estimated_base * 2) {
         const gcIssue = {
           type: 'gc_pressure',
           stats: stats,
           timestamp: new Date().toISOString()
         };
         
         console.warn('High GC pressure detected:', gcIssue);
         this.sendAlert(gcIssue);
       }
     }
     
     sendAlert(issue) {
       // Send alert to monitoring system
       console.error('MEMORY ALERT:', issue);
     }
     
     getLeaks() {
       return this.leaks;
     }
     
     clearLeaks() {
       this.leaks = [];
     }
   }
   
   // Only enable in development or with explicit flag
   if (process.env.ENABLE_MEMORY_LEAK_DETECTION === 'true') {
     module.exports = new MemoryLeakDetector();
   } else {
     // No-op implementation for production
     module.exports = {
       setupListeners: () => {},
       getLeaks: () => [],
       clearLeaks: () => {}
     };
   }
   ```

2. **Implement Weak Maps for Cache**:
   ```javascript
   // backend/services/weakCache.js
   class WeakCache {
     constructor() {
       this.cache = new WeakMap();
     }
     
     set(key, value) {
       // Only cache objects, not primitives
       if (typeof key === 'object' && key !== null) {
         this.cache.set(key, value);
       }
     }
     
     get(key) {
       if (typeof key === 'object' && key !== null) {
         return this.cache.get(key);
       }
       return undefined;
     }
     
     has(key) {
       if (typeof key === 'object' && key !== null) {
         return this.cache.has(key);
       }
       return false;
     }
   }
   
   module.exports = WeakCache;
   ```

3. **Implement Proper Cleanup for Event Listeners**:
   ```javascript
   // backend/services/eventManager.js
   class EventManager {
     constructor() {
       this.listeners = new Map();
     }
     
     addListener(emitter, event, listener) {
       emitter.on(event, listener);
       
       // Track listener for cleanup
       const key = `${emitter.constructor.name}-${event}`;
       if (!this.listeners.has(key)) {
         this.listeners.set(key, []);
       }
       this.listeners.get(key).push({ emitter, event, listener });
     }
     
     removeListener(emitter, event, listener) {
       emitter.off(event, listener);
       
       // Remove from tracking
       const key = `${emitter.constructor.name}-${event}`;
       const listeners = this.listeners.get(key);
       if (listeners) {
         const index = listeners.findIndex(l => 
           l.emitter === emitter && 
           l.event === event && 
           l.listener === listener
         );
         
         if (index !== -1) {
           listeners.splice(index, 1);
         }
       }
     }
     
     removeAllListeners() {
       for (const [key, listeners] of this.listeners) {
         for (const { emitter, event, listener } of listeners) {
           emitter.off(event, listener);
         }
       }
       this.listeners.clear();
     }
   }
   
   module.exports = new EventManager();
   ```

This comprehensive troubleshooting guide covers the most common issues that may arise with the Deeper Research Synthetic application. By following these systematic approaches to diagnosis and resolution, you should be able to identify and fix most problems that occur in development, testing, or production environments.

Remember to always backup your system before making significant changes, and to test fixes in a development environment before applying them to production.