# Deployment Guide for Deeper Research Synthetic

## Overview

This guide provides comprehensive instructions for deploying the Deeper Research Synthetic application to production environments. It covers deployment strategies, configuration, monitoring, and maintenance procedures.

## Table of Contents

1. [Deployment Architecture](#deployment-architecture)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Backend Deployment](#backend-deployment)
   - [Building the Backend](#building-the-backend)
   - [Deployment Options](#deployment-options)
5. [Frontend Deployment](#frontend-deployment)
   - [Building the Frontend](#building-the-frontend)
   - [Deployment Options](#frontend-deployment-options)
6. [Database Deployment](#database-deployment)
7. [Containerization](#containerization)
   - [Docker](#docker)
   - [Kubernetes](#kubernetes)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Scaling](#scaling)
11. [Security Considerations](#security-considerations)
12. [Backup and Recovery](#backup-and-recovery)
13. [Maintenance](#maintenance)
14. [Rollback Procedures](#rollback-procedures)

## Deployment Architecture

The Deeper Research Synthetic application follows a client-server architecture:

```
┌────────────────────┐           ┌────────────────────┐
│   Frontend (THE    │           │   Backend (THE     │
│        LENS)       │           │       FORGE)       │
│                    │           │                    │
│  React Application │◄──────────┤  Node.js/Express   │
│                    │  REST API │                    │
│                    │           │  Gemini AI Client  │
│                    │           │                    │
│                    │           │  MongoDB/DynamoDB  │
└─────────┬──────────┘           └─────────┬──────────┘
          │                                │
          │                                │
┌─────────┴──────────┐           ┌─────────┴──────────┐
│   Static Hosting   │           │   Server Hosting   │
│ (Netlify, Vercel,  │           │ (Heroku, AWS EC2,  │
│   AWS S3, etc.)    │           │   Docker, etc.)    │
└────────────────────┘           └────────────────────┘
```

## Prerequisites

Before deploying, ensure you have:

1. **Node.js** (version 14 or higher) installed on the deployment server
2. **npm** or **yarn** package manager
3. **Google Gemini API key** with appropriate permissions
4. **Git** for version control
5. **Docker** (optional, for containerized deployment)
6. **Kubernetes** (optional, for container orchestration)
7. **Domain name** (optional, for custom domain)
8. **SSL certificate** (recommended, for HTTPS)

## Environment Configuration

### Environment Variables

Create a `.env.production` file in the backend directory with the following variables:

```bash
# .env.production
GEMINI_API_KEY=your_production_gemini_api_key
PORT=3001
NODE_ENV=production
DATABASE_URL=mongodb://localhost:27017/ironclad
JWT_SECRET=your_jwt_secret_key
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
LOG_LEVEL=info
TEMPERATURE=0.7
TOP_P=0.95
TOP_K=40
MAX_OUTPUT_TOKENS=32000
```

### Configuration Files

Ensure the following configuration files are properly set up:

1. **Backend Configuration** (`backend/config/*.js`)
2. **Frontend Configuration** (`frontend/vite.config.js`)

## Backend Deployment

### Building the Backend

1. Install dependencies:
   ```bash
   cd backend
   npm ci --only=production
   ```

2. Run database migrations (if applicable):
   ```bash
   npm run migrate
   ```

3. Build the application (if using TypeScript or other transpilers):
   ```bash
   npm run build
   ```

### Deployment Options

#### Option 1: Traditional Server Deployment

1. Transfer files to the server:
   ```bash
   rsync -avz --exclude node_modules backend/ user@server:/var/www/ironclad-backend/
   ```

2. Install dependencies on the server:
   ```bash
   ssh user@server
   cd /var/www/ironclad-backend/
   npm ci --only=production
   ```

3. Start the application with PM2 or similar process manager:
   ```bash
   pm2 start server.js --name ironclad-backend
   pm2 save
   ```

#### Option 2: Platform-as-a-Service (PaaS)

##### Heroku

1. Create a `Procfile` in the backend directory:
   ```
   web: node server.js
   ```

2. Deploy to Heroku:
   ```bash
   heroku create ironclad-backend-production
   heroku config:set GEMINI_API_KEY=your_production_gemini_api_key
   git push heroku main
   ```

##### Render

1. Create a `render.yaml` file:
   ```yaml
   services:
     - type: web
       name: ironclad-backend
       env: node
       buildCommand: npm install
       startCommand: node server.js
       envVars:
         - key: GEMINI_API_KEY
           sync: false
   ```

2. Connect your repository to Render and deploy.

#### Option 3: Cloud Provider VM

##### AWS EC2

1. Launch an EC2 instance with Node.js AMI or Ubuntu AMI
2. SSH into the instance:
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. Install Node.js if not using Node.js AMI:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. Deploy the application:
   ```bash
   git clone https://github.com/yourusername/deeper_research_synthetic.git
   cd deeper_research_synthetic/backend
   npm ci --only=production
   npm start
   ```

5. Set up a reverse proxy with Nginx (optional):
   ```bash
   sudo apt-get install nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

## Frontend Deployment

### Building the Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm ci
   ```

2. Build the application:
   ```bash
   npm run build
   ```

This creates a `dist/` directory with the production-ready frontend.

### Frontend Deployment Options

#### Option 1: Static Hosting

##### Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   cd frontend
   netlify deploy --prod
   ```

##### Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd frontend
   vercel --prod
   ```

##### AWS S3

1. Create an S3 bucket with static website hosting enabled
2. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

3. Sync files to S3:
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

#### Option 2: Server Deployment

If deploying the frontend to a traditional server:

1. Transfer the `dist/` directory to the server:
   ```bash
   rsync -avz dist/ user@server:/var/www/ironclad-frontend/
   ```

2. Configure your web server (Apache, Nginx) to serve the files:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       root /var/www/ironclad-frontend;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api/ {
           proxy_pass http://localhost:3001/;
       }
   }
   ```

## Database Deployment

### MongoDB Deployment

#### Option 1: MongoDB Atlas (Recommended for Production)

1. Create a MongoDB Atlas cluster
2. Add database user and whitelist IP addresses
3. Update `DATABASE_URL` in your environment variables:
   ```
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/ironclad?retryWrites=true&w=majority
   ```

#### Option 2: Self-Hosted MongoDB

1. Install MongoDB:
   ```bash
   sudo apt-get install mongodb
   ```

2. Start MongoDB service:
   ```bash
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

3. Secure MongoDB installation:
   ```bash
   mongo
   use admin
   db.createUser({user: "admin", pwd: "secure_password", roles: ["root"]})
   exit
   ```

4. Enable authentication in MongoDB configuration:
   ```bash
   sudo nano /etc/mongodb.conf
   # Add:
   security.authorization: enabled
   ```

5. Restart MongoDB:
   ```bash
   sudo systemctl restart mongodb
   ```

## Containerization

### Docker

#### Backend Dockerfile

Create a `Dockerfile` in the backend directory:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

#### Frontend Dockerfile

Create a `Dockerfile` in the frontend directory:

```dockerfile
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - NODE_ENV=production
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

#### Building and Running with Docker

1. Build the images:
   ```bash
   docker-compose build
   ```

2. Run the containers:
   ```bash
   docker-compose up -d
   ```

### Kubernetes

#### Helm Chart

Create a Helm chart for easier Kubernetes deployment:

1. Create the chart structure:
   ```
   helm create ironclad
   ```

2. Update `values.yaml`:
   ```yaml
   replicaCount: 2
   
   image:
     repository: yourregistry/ironclad-backend
     tag: latest
     pullPolicy: IfNotPresent
   
   service:
     type: ClusterIP
     port: 3001
   
   ingress:
     enabled: true
     hosts:
       - host: ironclad.yourdomain.com
         paths: ["/"]
   
   resources:
     limits:
       cpu: 100m
       memory: 128Mi
     requests:
       cpu: 100m
       memory: 128Mi
   
   env:
     GEMINI_API_KEY: your_production_key
   ```

3. Deploy with Helm:
   ```bash
   helm install ironclad ./ironclad
   ```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install backend dependencies
        run: |
          cd backend
          npm ci
          
      - name: Run backend tests
        run: |
          cd backend
          npm test
          
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Run frontend tests
        run: |
          cd frontend
          npm test
          
  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "ironclad-backend-production"
          heroku_email: "your-email@example.com"
          appdir: "backend"
          
      - name: Deploy Frontend to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        working-directory: frontend
```

## Monitoring and Logging

### Backend Monitoring

#### Application Performance Monitoring (APM)

Use tools like New Relic, Datadog, or Sentry for comprehensive monitoring:

1. Install APM agent:
   ```bash
   npm install newrelic
   ```

2. Configure APM:
   ```javascript
   // newrelic.js
   exports.config = {
     app_name: ['Ironclad Backend'],
     license_key: 'your_license_key',
     logging: {
       level: 'info'
     }
   };
   ```

3. Add to server.js:
   ```javascript
   require('newrelic');
   ```

#### Health Checks

Implement health check endpoints:

```javascript
// backend/routes/health.js
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    versions: process.versions
  });
});

module.exports = router;
```

### Frontend Monitoring

#### Error Tracking

Use Sentry for frontend error tracking:

1. Install Sentry:
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

2. Initialize Sentry:
   ```javascript
   // frontend/src/index.js
   import * as Sentry from "@sentry/react";
   import { Integrations } from "@sentry/tracing";

   Sentry.init({
     dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
     integrations: [new Integrations.BrowserTracing()],
     tracesSampleRate: 1.0,
   });
   ```

#### Logging

Implement centralized logging:

```javascript
// backend/services/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ironclad' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## Scaling

### Horizontal Scaling

#### Load Balancing

Use a load balancer to distribute traffic across multiple instances:

```nginx
# nginx.conf
upstream ironclad_backend {
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://ironclad_backend;
    }
}
```

#### Auto-scaling

Configure auto-scaling based on CPU usage or request rate:

```yaml
# kubernetes hpa
apiVersion: autoscaling/v2beta2
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
        averageUtilization: 50
```

### Vertical Scaling

Increase resources allocated to instances:

1. Upgrade server instances to higher specifications
2. Increase memory allocation
3. Add more CPU cores

### Database Scaling

1. **Read Replicas**: Create read replicas for read-heavy operations
2. **Sharding**: Distribute data across multiple database instances
3. **Caching**: Implement Redis or Memcached for frequently accessed data

## Security Considerations

### API Security

#### Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### Authentication and Authorization

Implement JWT-based authentication:

```javascript
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
```

#### Input Validation

Validate all user inputs:

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/projects', [
  body('name').isLength({ min: 1 }).trim().escape(),
  body('framework').isIn(['PROJECT_DEEPDIVE', 'PROJECT_SYNTHETIC', 'PROJECT_BENCHMARK'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});
```

### Frontend Security

#### Content Security Policy (CSP)

Implement CSP headers:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://apis.google.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://api.yourdomain.com;">
```

#### XSS Prevention

Sanitize user inputs before rendering:

```javascript
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(userGeneratedContent);
```

## Backup and Recovery

### Automated Backups

#### Database Backups

Schedule regular database backups:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --host localhost --port 27017 --out /backups/mongodb_$DATE
tar -czf /backups/mongodb_$DATE.tar.gz /backups/mongodb_$DATE
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup.sh
```

#### File Backups

Backup important files and configurations:

```bash
#!/bin/bash
# file-backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/app_files_$DATE.tar.gz /var/www/ironclad-backend /var/www/ironclad-frontend
```

### Disaster Recovery Plan

1. **Daily Backups**: Schedule daily backups of databases and files
2. **Weekly Full Backups**: Perform full system backups weekly
3. **Monthly Offsite Backups**: Store monthly backups in offsite locations
4. **Recovery Testing**: Test recovery procedures quarterly
5. **Documentation**: Maintain up-to-date recovery documentation

## Maintenance

### Scheduled Maintenance

1. **Weekly**: Apply security patches and updates
2. **Monthly**: Review logs and performance metrics
3. **Quarterly**: Perform security audits and penetration testing
4. **Annually**: Review and update disaster recovery plans

### Update Procedures

1. **Test Updates**: Test all updates in a staging environment first
2. **Rolling Updates**: Use rolling updates to minimize downtime
3. **Rollback Plan**: Have a rollback plan ready for each update
4. **Monitoring**: Monitor application performance after updates

### Performance Tuning

1. **Database Optimization**: Index frequently queried fields
2. **Caching**: Implement caching for frequently accessed data
3. **Compression**: Enable gzip compression for API responses
4. **CDN**: Use CDN for static assets

## Rollback Procedures

### Quick Rollback

For minor issues, implement quick rollback procedures:

```bash
#!/bin/bash
# quick-rollback.sh
# Stop current deployment
pm2 stop ironclad-backend

# Restore previous version
cp -r /var/www/ironclad-backend-backup/* /var/www/ironclad-backend/

# Start previous version
pm2 start /var/www/ironclad-backend/server.js --name ironclad-backend

# Verify application is running
curl -f http://localhost:3001/api/status || echo "Rollback failed"
```

### Full Rollback

For major issues requiring full rollback:

1. **Restore Database**: Restore database from backup
2. **Restore Files**: Restore application files from backup
3. **Restart Services**: Restart all services
4. **Verify Functionality**: Test all critical functionality
5. **Notify Stakeholders**: Inform stakeholders of the rollback

This deployment guide provides comprehensive instructions for deploying the Deeper Research Synthetic application to production environments. Following these guidelines will help ensure a successful deployment with proper monitoring, security, and maintenance procedures in place.