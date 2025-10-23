# 🚀 Deployment Guide - Deeper Research Synthetic

## Overview

This document provides comprehensive instructions for deploying the Deeper Research Synthetic application to production environments. It covers deployment strategies, environment configuration, security considerations, and monitoring setup.

## Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer  │───▶│  Reverse Proxy  │───▶│   Application   │
│   (NGINX/HAProxy)│    │   (NGINX/Apache)│    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SSL/TLS       │    │   Process       │    │   Database      │
│   Termination   │    │   Manager       │    │   (MongoDB)     │
│   (Let's Encrypt)│    │   (PM2/Docker)  │    │   (Atlas/Hosted)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ LTS, CentOS 8+, or macOS 12+
- **Node.js**: Version 18+ (LTS recommended)
- **Memory**: 4GB+ RAM minimum (8GB+ recommended)
- **Storage**: 20GB+ available disk space
- **Network**: Stable internet connection with outbound access

### Dependencies
- **MongoDB**: Version 5.0+ (local or hosted)
- **AI Provider API Key**: Venice.ai or Google Gemini
- **Reverse Proxy**: NGINX or Apache
- **Process Manager**: PM2 or Docker
- **SSL Certificate**: Let's Encrypt or commercial

### Ports Required
- **Public Access**: 80 (HTTP), 443 (HTTPS)
- **Application**: 3001 (backend), 5173 (frontend dev)
- **Database**: 27017 (MongoDB, if self-hosted)
- **Monitoring**: 9090 (Prometheus), 3000 (Grafana)

## Environment Configuration

### Environment Variables

#### Backend Configuration
```bash
# Required
AI_PROVIDER=venice          # or gemini
VENICE_API_KEY=your_api_key # or GEMINI_API_KEY=your_api_key
DATABASE_URL=mongodb://localhost:27017/deeper_research
PORT=3001

# Optional
NODE_ENV=production
MAX_OUTPUT_TOKENS=32000
TEMPERATURE=0.7
TOP_P=0.95
TOP_K=40
ANONYMOUS_MODE=true
ENABLE_WEB_SEARCH=off
ENABLE_WEB_CITATIONS=false

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # 100 requests per window
```

#### Frontend Configuration
```bash
# Required
VITE_API_URL=https://yourdomain.com/api

# Optional
VITE_APP_NAME="Deeper Research Synthetic"
VITE_APP_VERSION=2.0.0
```

### Configuration Files

#### 1. Backend .env File
Create `/opt/deeper_research_synthetic/backend/.env`:
```bash
# AI Provider Configuration
AI_PROVIDER=venice
VENICE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANONYMOUS_MODE=true

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/deeper_research
MONGODB_USER=deeper_research_user
MONGODB_PASSWORD=secure_password

# Server Configuration
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Generation Parameters
MAX_OUTPUT_TOKENS=32000
TEMPERATURE=0.7
TOP_P=0.95
TOP_K=40

# Security Configuration
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Performance Monitoring
PERFORMANCE_MONITORING=true
MAX_MEMORY_MB=512
MAX_ACTIVE_GENERATIONS=10
MAX_ERROR_RATE=0.1
MAX_RESPONSE_TIME=30000
```

#### 2. Frontend .env File
Create `/opt/deeper_research_synthetic/frontend/.env`:
```bash
# API Configuration
VITE_API_URL=https://yourdomain.com/api

# Application Configuration
VITE_APP_NAME="Deeper Research Synthetic"
VITE_APP_VERSION=2.0.0

# Feature Flags
VITE_ENABLE_ANONYMOUS_MODE=true
VITE_ENABLE_WEB_SEARCH=false
```

## Deployment Methods

### Option 1: Docker Deployment (Recommended)

#### 1. Docker Compose Setup
Create `/opt/deeper_research_synthetic/docker-compose.yml`:
```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:6.0
    container_name: deeper_research_mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGODB_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD}
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - deeper_research_network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend Application
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: deeper_research_backend
    restart: unless-stopped
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      - AI_PROVIDER=${AI_PROVIDER}
      - VENICE_API_KEY=${VENICE_API_KEY}
      - DATABASE_URL=mongodb://mongodb:27017/deeper_research
      - PORT=3001
      - NODE_ENV=production
      - CORS_ORIGIN=${CORS_ORIGIN}
    volumes:
      - ./backend/.env:/app/.env:ro
    networks:
      - deeper_research_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: deeper_research_frontend
    restart: unless-stopped
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:3001/api
    networks:
      - deeper_research_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5173"]
      interval: 30s
      timeout: 10s
      retries: 3

  # NGINX Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: deeper_research_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/sites-available:/etc/nginx/sites-available:ro
      - ./ssl/certs:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - deeper_research_network

volumes:
  mongodb_data:

networks:
  deeper_research_network:
    driver: bridge
```

#### 2. Backend Dockerfile
Create `/opt/deeper_research_synthetic/backend/Dockerfile`:
```dockerfile
# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/status || exit 1

# Start application
CMD ["npm", "start"]
```

#### 3. Frontend Dockerfile
Create `/opt/deeper_research_synthetic/frontend/Dockerfile`:
```dockerfile
# Build stage
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5173 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### 4. Docker Deployment Commands
```bash
# Navigate to project root
cd /opt/deeper_research_synthetic

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services if needed
docker-compose up -d --scale backend=2 --scale frontend=2

# Stop services
docker-compose down

# Update services
docker-compose down
docker-compose up -d --build
```

### Option 2: Traditional Deployment (PM2)

#### 1. Backend Deployment with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Navigate to backend directory
cd /opt/deeper_research_synthetic/backend

# Install dependencies
npm ci --only=production

# Start backend with PM2
pm2 start server.js --name "deeper-research-backend" --env production

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

#### 2. Frontend Deployment with PM2
```bash
# Navigate to frontend directory
cd /opt/deeper_research_synthetic/frontend

# Install dependencies
npm ci --only=production

# Build frontend
npm run build

# Serve built files with PM2
pm2 serve dist 5173 --name "deeper-research-frontend" --spa

# Save PM2 configuration
pm2 save
```

#### 3. PM2 Configuration File
Create `/opt/deeper_research_synthetic/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'deeper-research-backend',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '512M',
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'deeper-research-frontend',
      script: 'npx',
      args: 'serve dist -l 5173 -s',
      cwd: './frontend',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '256M',
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

#### 4. PM2 Deployment Commands
```bash
# Navigate to project root
cd /opt/deeper_research_synthetic

# Start all applications
pm2 start ecosystem.config.js --env production

# View application status
pm2 list

# View logs
pm2 logs

# Monitor applications
pm2 monit

# Restart applications
pm2 restart ecosystem.config.js

# Stop applications
pm2 stop ecosystem.config.js

# Delete applications
pm2 delete ecosystem.config.js
```

## SSL/TLS Configuration

### Let's Encrypt Setup with Certbot

#### 1. Install Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx

# macOS
brew install certbot
```

#### 2. Obtain SSL Certificate
```bash
# Obtain certificate for single domain
sudo certbot --nginx -d yourdomain.com

# Obtain certificate for multiple domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Obtain wildcard certificate
sudo certbot --nginx -d *.yourdomain.com
```

#### 3. Auto-renewal Setup
```bash
# Test renewal process
sudo certbot renew --dry-run

# Set up automatic renewal with cron
sudo crontab -e

# Add this line to run twice daily
0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Certificate Installation

#### 1. NGINX SSL Configuration
Create `/opt/deeper_research_synthetic/nginx/sites-available/deeper_research`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/yourdomain.com.crt;
    ssl_certificate_key /etc/nginx/ssl/yourdomain.com.key;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Root path
    root /opt/deeper_research_synthetic/frontend/dist;
    index index.html;
    
    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }
    
    # Serve frontend files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Logging
    access_log /var/log/nginx/deeper_research_access.log;
    error_log /var/log/nginx/deeper_research_error.log;
}
```

#### 2. SSL Certificate Renewal Script
Create `/opt/deeper_research_synthetic/scripts/renew_ssl.sh`:
```bash
#!/bin/bash

# SSL certificate renewal script
# This script renews SSL certificates and reloads NGINX

set -e

# Configuration
DOMAIN="yourdomain.com"
CERT_DIR="/etc/nginx/ssl"
LOG_FILE="/var/log/ssl_renewal.log"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Main renewal process
renew_certificates() {
    log "Starting SSL certificate renewal process"
    
    # Renew certificates with Certbot
    if command -v certbot &> /dev/null; then
        certbot renew --quiet
        log "Certbot renewal completed"
    else
        log "ERROR: Certbot not found"
        exit 1
    fi
    
    # Reload NGINX to apply new certificates
    if systemctl reload nginx; then
        log "NGINX reloaded successfully"
    else
        log "ERROR: Failed to reload NGINX"
        exit 1
    fi
    
    log "SSL certificate renewal process completed"
}

# Execute renewal
renew_certificates
```

#### 3. SSL Certificate Monitoring
Create `/opt/deeper_research_synthetic/scripts/monitor_ssl.sh`:
```bash
#!/bin/bash

# SSL certificate monitoring script
# This script checks SSL certificate expiration dates

set -e

# Configuration
DOMAIN="yourdomain.com"
WARNING_DAYS=30
LOG_FILE="/var/log/ssl_monitoring.log"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Check certificate expiration
check_certificate() {
    log "Checking SSL certificate for $DOMAIN"
    
    # Get certificate expiration date
    expiration_date=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
    
    if [ -z "$expiration_date" ]; then
        log "ERROR: Failed to retrieve certificate expiration date"
        exit 1
    fi
    
    # Convert dates to seconds since epoch
    exp_seconds=$(date -d "$expiration_date" +%s)
    current_seconds=$(date +%s)
    
    # Calculate days until expiration
    days_until_expiry=$(( (exp_seconds - current_seconds) / 86400 ))
    
    log "Certificate expires on: $expiration_date ($days_until_expiry days)"
    
    # Check if certificate is about to expire
    if [ "$days_until_expiry" -lt "$WARNING_DAYS" ]; then
        log "WARNING: Certificate expires in $days_until_expiry days"
        # Send alert (email, Slack, etc.)
        echo "SSL certificate for $DOMAIN expires in $days_until_expiry days" | mail -s "SSL Certificate Expiration Warning" admin@yourdomain.com
    fi
    
    log "SSL certificate check completed"
}

# Execute check
check_certificate
```

## Database Configuration

### MongoDB Atlas (Recommended for Production)

#### 1. Create MongoDB Atlas Cluster
1. Sign up for MongoDB Atlas at https://www.mongodb.com/cloud/atlas
2. Create a new cluster with M10+ tier
3. Configure cluster settings:
   - Cloud provider: AWS, GCP, or Azure
   - Region: Closest to your application servers
   - Cluster tier: M10+ for production
4. Set up database user with read/write permissions
5. Configure IP whitelist for your application servers
6. Get connection string from "Connect" button

#### 2. MongoDB Atlas Connection String
```bash
# In backend/.env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/deeper_research?retryWrites=true&w=majority
```

#### 3. MongoDB Atlas Security
- Enable network encryption
- Use SCRAM-SHA-256 authentication
- Enable audit logging
- Configure backup policies
- Set up alerts for unusual activity

### Self-Hosted MongoDB

#### 1. Install MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# CentOS/RHEL
sudo yum install -y mongodb-org

# macOS
brew tap mongodb/brew
brew install mongodb-community@6.0
```

#### 2. Configure MongoDB Security
Create `/opt/deeper_research_synthetic/mongo-init.js`:
```javascript
// Create deeper_research database and user
db = db.getSiblingDB('deeper_research');

// Create user with readWrite permissions
db.createUser({
  user: 'deeper_research_user',
  pwd: 'secure_password',
  roles: [
    {
      role: 'readWrite',
      db: 'deeper_research'
    }
  ]
});

// Create indexes
db.projects.createIndex({ "createdAt": -1 });
db.projects.createIndex({ "framework": 1 });
db.projects.createIndex({ "status": 1 });
db.projects.createIndex({ "name": "text", "sourceContext": "text" });
```

#### 3. MongoDB Configuration
Create `/etc/mongod.conf`:
```yaml
# MongoDB configuration
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100

replication:
  replSetName: rs0
```

#### 4. Start MongoDB
```bash
# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod

# Initialize replica set (for production)
mongo --eval "rs.initiate()"
```

## Monitoring and Logging

### Application Monitoring

#### 1. PM2 Monitoring
```bash
# Monitor applications
pm2 monit

# View logs
pm2 logs

# Generate log reports
pm2 logs --format --timestamp --nostream
```

#### 2. Custom Monitoring Script
Create `/opt/deeper_research_synthetic/scripts/monitor_app.sh`:
```bash
#!/bin/bash

# Application monitoring script
# This script monitors application health and performance

set -e

# Configuration
APP_NAME="deeper-research-backend"
LOG_FILE="/var/log/app_monitoring.log"
HEALTH_CHECK_URL="http://localhost:3001/api/status"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Check application health
check_health() {
    log "Checking application health"
    
    # Check if PM2 process is running
    if pm2 list | grep -q "$APP_NAME"; then
        log "PM2 process is running"
    else
        log "ERROR: PM2 process is not running"
        # Restart application
        pm2 restart "$APP_NAME"
        return 1
    fi
    
    # Check API health endpoint
    if curl -s -f "$HEALTH_CHECK_URL" > /dev/null; then
        log "API health check passed"
    else
        log "ERROR: API health check failed"
        # Restart application
        pm2 restart "$APP_NAME"
        return 1
    fi
    
    log "Application health check completed"
    return 0
}

# Check resource usage
check_resources() {
    log "Checking resource usage"
    
    # Get PM2 process info
    pm2_status=$(pm2 list | grep "$APP_NAME")
    log "PM2 Status: $pm2_status"
    
    # Get system resource usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    memory_usage=$(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')
    
    log "CPU Usage: $cpu_usage%"
    log "Memory Usage: $memory_usage"
    
    # Check if resource usage is high
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log "WARNING: High CPU usage detected"
    fi
    
    if (( $(echo "${memory_usage%?} > 80" | bc -l) )); then
        log "WARNING: High memory usage detected"
    fi
    
    log "Resource usage check completed"
}

# Main monitoring function
monitor_application() {
    log "Starting application monitoring"
    
    # Check health
    if ! check_health; then
        log "Health check failed, restarting application"
        pm2 restart "$APP_NAME"
    fi
    
    # Check resources
    check_resources
    
    log "Application monitoring completed"
}

# Execute monitoring
monitor_application
```

### Log Management

#### 1. Log Rotation
Create `/etc/logrotate.d/deeper_research`:
```bash
/opt/deeper_research_synthetic/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### 2. Centralized Logging with ELK Stack
Configure Logstash to collect application logs:
```ruby
# /etc/logstash/conf.d/deeper_research.conf
input {
  file {
    path => "/opt/deeper_research_synthetic/logs/*.log"
    start_position => "beginning"
    sincedb_path => "/dev/null"
    codec => "json"
  }
}

filter {
  if [message] =~ /^\{.*\}$/ {
    json {
      source => "message"
    }
  }
  
  date {
    match => [ "timestamp", "ISO8601" ]
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "deeper-research-%{+YYYY.MM.dd}"
  }
}
```

#### 3. Log Analysis Script
Create `/opt/deeper_research_synthetic/scripts/analyze_logs.sh`:
```bash
#!/bin/bash

# Log analysis script
# This script analyzes application logs for errors and patterns

set -e

# Configuration
LOG_DIR="/opt/deeper_research_synthetic/logs"
ANALYSIS_FILE="/var/log/log_analysis_$(date +%Y%m%d).txt"

# Analyze logs
analyze_logs() {
    echo "=== Deeper Research Synthetic Log Analysis Report ===" > "$ANALYSIS_FILE"
    echo "Generated: $(date)" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Count total log entries
    total_entries=$(grep -c ".*" "$LOG_DIR"/*.log 2>/dev/null || echo 0)
    echo "Total Log Entries: $total_entries" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Find error logs
    echo "=== Error Summary ===" >> "$ANALYSIS_FILE"
    error_count=$(grep -c "ERROR\|error\|Error" "$LOG_DIR"/*.log 2>/dev/null || echo 0)
    echo "Error Entries: $error_count" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Show recent errors
    echo "=== Recent Errors ===" >> "$ANALYSIS_FILE"
    grep "ERROR\|error\|Error" "$LOG_DIR"/*.log | tail -10 >> "$ANALYSIS_FILE" 2>/dev/null || echo "No recent errors found" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Find warning logs
    echo "=== Warning Summary ===" >> "$ANALYSIS_FILE"
    warning_count=$(grep -c "WARN\|warn\|Warning" "$LOG_DIR"/*.log 2>/dev/null || echo 0)
    echo "Warning Entries: $warning_count" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Show recent warnings
    echo "=== Recent Warnings ===" >> "$ANALYSIS_FILE"
    grep "WARN\|warn\|Warning" "$LOG_DIR"/*.log | tail -10 >> "$ANALYSIS_FILE" 2>/dev/null || echo "No recent warnings found" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Analyze API request patterns
    echo "=== API Request Patterns ===" >> "$ANALYSIS_FILE"
    api_requests=$(grep -c "GET\|POST\|PUT\|DELETE" "$LOG_DIR"/*.log 2>/dev/null || echo 0)
    echo "API Requests: $api_requests" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Show most frequent API endpoints
    echo "Most Frequent API Endpoints:" >> "$ANALYSIS_FILE"
    grep "GET\|POST\|PUT\|DELETE" "$LOG_DIR"/*.log | grep -o "/api/[^ ]*" | sort | uniq -c | sort -nr | head -10 >> "$ANALYSIS_FILE" 2>/dev/null || echo "No API endpoints found" >> "$ANALYSIS_FILE"
    
    echo "Log analysis completed. Report saved to $ANALYSIS_FILE"
}

# Execute analysis
analyze_logs
```

## Security Configuration

### Firewall Setup

#### 1. UFW Configuration (Ubuntu)
```bash
# Install UFW
sudo apt install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (port 22)
sudo ufw allow ssh

# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443)
sudo ufw allow 443/tcp

# Allow MongoDB (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 27017

# Allow Node.js app (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 3001

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

#### 2. iptables Configuration (CentOS/RHEL)
```bash
# Allow SSH (port 22)
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP (port 80) and HTTPS (port 443)
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow MongoDB (port 27017) only from localhost
iptables -A INPUT -p tcp -s 127.0.0.1 --dport 27017 -j ACCEPT

# Allow Node.js app (port 3001) only from localhost
iptables -A INPUT -p tcp -s 127.0.0.1 --dport 3001 -j ACCEPT

# Drop all other connections
iptables -A INPUT -j DROP

# Save rules
iptables-save > /etc/iptables/rules.v4
```

### Security Headers Configuration

Update NGINX configuration with security headers:
```nginx
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Feature Policy
add_header Feature-Policy "geolocation 'none'; midi 'none'; notifications 'none'; push 'none'; sync-xhr 'none'; microphone 'none'; camera 'none'; magnetometer 'none'; gyroscope 'none'; speaker 'none'; vibrate 'none'; fullscreen 'self'; payment 'none';" always;
```

### Rate Limiting Configuration

Add rate limiting to NGINX:
```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=generation:10m rate=10r/m;

# API rate limiting
location /api/ {
    limit_req zone=api burst=200 nodelay;
    proxy_pass http://localhost:3001/api/;
    # ... other proxy settings
}

# Generation rate limiting
location /api/generate/ {
    limit_req zone=generation burst=20 nodelay;
    proxy_pass http://localhost:3001/api/generate/;
    # ... other proxy settings
}
```

## Backup and Recovery

### Automated Backup Script

Create `/opt/deeper_research_synthetic/scripts/backup.sh`:
```bash
#!/bin/bash

# Backup script for Deeper Research Synthetic
# This script backs up application data and configuration

set -e

# Configuration
BACKUP_DIR="/opt/backups/deeper_research"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MONGODB_URI="mongodb://localhost:27017/deeper_research"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Backup MongoDB
backup_database() {
    log "Starting database backup"
    
    # Create backup directory for this timestamp
    DB_BACKUP_DIR="$BACKUP_DIR/db_$TIMESTAMP"
    mkdir -p "$DB_BACKUP_DIR"
    
    # Backup database
    if mongodump --uri="$MONGODB_URI" --out="$DB_BACKUP_DIR"; then
        log "Database backup completed successfully"
        
        # Compress backup
        tar -czf "$DB_BACKUP_DIR.tar.gz" -C "$BACKUP_DIR" "db_$TIMESTAMP"
        rm -rf "$DB_BACKUP_DIR"
        
        log "Database backup compressed"
    else
        log "ERROR: Database backup failed"
        exit 1
    fi
}

# Backup application configuration
backup_config() {
    log "Starting configuration backup"
    
    # Create backup directory for this timestamp
    CONFIG_BACKUP_DIR="$BACKUP_DIR/config_$TIMESTAMP"
    mkdir -p "$CONFIG_BACKUP_DIR"
    
    # Copy configuration files
    cp /opt/deeper_research_synthetic/backend/.env "$CONFIG_BACKUP_DIR/" 2>/dev/null || true
    cp /opt/deeper_research_synthetic/frontend/.env "$CONFIG_BACKUP_DIR/" 2>/dev/null || true
    
    # Copy other important files
    cp -r /opt/deeper_research_synthetic/data/frameworks "$CONFIG_BACKUP_DIR/" 2>/dev/null || true
    
    # Compress backup
    tar -czf "$CONFIG_BACKUP_DIR.tar.gz" -C "$BACKUP_DIR" "config_$TIMESTAMP"
    rm -rf "$CONFIG_BACKUP_DIR"
    
    log "Configuration backup completed"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups"
    
    # Remove backups older than RETENTION_DAYS
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    log "Old backups cleanup completed"
}

# Main backup function
perform_backup() {
    log "Starting Deeper Research Synthetic backup"
    
    # Create backup
    backup_database
    backup_config
    
    # Cleanup old backups
    cleanup_backups
    
    log "Backup process completed successfully"
}

# Execute backup
perform_backup
```

### Automated Recovery Script

Create `/opt/deeper_research_synthetic/scripts/recover.sh`:
```bash
#!/bin/bash

# Recovery script for Deeper Research Synthetic
# This script recovers application data from backups

set -e

# Configuration
BACKUP_DIR="/opt/backups/deeper_research"
MONGODB_URI="mongodb://localhost:27017/deeper_research"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Find latest backup
find_latest_backup() {
    latest_backup=$(ls -t "$BACKUP_DIR"/db_*.tar.gz 2>/dev/null | head -1)
    if [ -z "$latest_backup" ]; then
        log "ERROR: No database backups found"
        exit 1
    fi
    echo "$latest_backup"
}

# Restore database from backup
restore_database() {
    local backup_file=$1
    
    log "Starting database restore from $backup_file"
    
    # Extract backup
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Restore database
    local db_dir=$(find "$temp_dir" -name "db_*" -type d | head -1)
    if [ -z "$db_dir" ]; then
        log "ERROR: Could not find database backup directory"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    if mongorestore --uri="$MONGODB_URI" --drop "$db_dir"; then
        log "Database restore completed successfully"
    else
        log "ERROR: Database restore failed"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log "Database restore process completed"
}

# Main recovery function
perform_recovery() {
    log "Starting Deeper Research Synthetic recovery"
    
    # Find latest backup
    local latest_backup=$(find_latest_backup)
    
    # Confirm recovery
    echo "Latest backup found: $latest_backup"
    read -p "Are you sure you want to restore from this backup? This will overwrite current data. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Recovery cancelled by user"
        exit 0
    fi
    
    # Stop application services
    log "Stopping application services"
    pm2 stop deeper-research-backend 2>/dev/null || true
    pm2 stop deeper-research-frontend 2>/dev/null || true
    
    # Restore database
    restore_database "$latest_backup"
    
    # Start application services
    log "Starting application services"
    pm2 start deeper-research-backend 2>/dev/null || true
    pm2 start deeper-research-frontend 2>/dev/null || true
    
    log "Recovery process completed successfully"
}

# Execute recovery
perform_recovery
```

### Backup Scheduling

Set up cron jobs for automated backups:
```bash
# Edit crontab
crontab -e

# Add these lines for automated backups:
# Daily database backup at 2 AM
0 2 * * * /opt/deeper_research_synthetic/scripts/backup.sh >> /var/log/backup.log 2>&1

# Weekly full backup on Sundays at 1 AM
0 1 * * 0 /opt/deeper_research_synthetic/scripts/backup.sh full >> /var/log/backup.log 2>&1
```

## Performance Tuning

### Node.js Performance Tuning

#### 1. PM2 Cluster Mode
Update ecosystem.config.js to use cluster mode:
```javascript
module.exports = {
  apps: [
    {
      name: 'deeper-research-backend',
      script: './backend/server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster', // Enable cluster mode
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '512M', // Restart if memory exceeds 512MB
      node_args: '--max-old-space-size=4096', // Set max heap size to 4GB
      // ... other configuration
    }
  ]
};
```

#### 2. V8 Engine Tuning
Add these flags to improve Node.js performance:
```bash
# In ecosystem.config.js or startup script
node_args: [
  '--max-old-space-size=4096',
  '--optimize_for_size',
  '--gc_interval=100',
  '--max-semi-space-size=128'
]
```

### MongoDB Performance Tuning

#### 1. Index Optimization
Create optimal indexes for the projects collection:
```javascript
// In mongo-init.js or via mongo shell
db.projects.createIndex({ "createdAt": -1 });
db.projects.createIndex({ "framework": 1 });
db.projects.createIndex({ "status": 1 });
db.projects.createIndex({ "name": "text", "sourceContext": "text" });
db.projects.createIndex({ "deletedAt": 1 }, { sparse: true });
```

#### 2. Query Optimization
Use projection to limit data transfer:
```javascript
// In ProjectRepository.js
Project.find(query, { 
  name: 1, 
  framework: 1, 
  status: 1, 
  createdAt: 1, 
  updatedAt: 1 
}).sort({ createdAt: -1 });
```

### NGINX Performance Tuning

Update NGINX configuration for better performance:
```nginx
# Performance tuning
worker_processes auto;
worker_connections 1024;
worker_rlimit_nofile 2048;

# Buffer tuning
client_body_buffer_size 128k;
client_max_body_size 100m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;

# Timeout tuning
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 15;
send_timeout 10;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied expired no-cache no-store private must-revalidate auth;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
```

## Disaster Recovery

### Recovery Plan

#### 1. Incident Response Team
- Define roles and responsibilities
- Establish communication channels
- Create incident response playbooks
- Train team members

#### 2. Recovery Procedures

##### Application Server Failure
```bash
# Recovery steps for application server failure
1. Identify failed server
2. Check logs for error patterns
3. Restart application services:
   pm2 restart deeper-research-backend
   pm2 restart deeper-research-frontend
4. If restart fails, restore from backup:
   /opt/deeper_research_synthetic/scripts/recover.sh
5. Verify application functionality
6. Update monitoring systems
```

##### Database Failure
```bash
# Recovery steps for database failure
1. Identify database failure
2. Check MongoDB logs for error patterns
3. Restart MongoDB service:
   sudo systemctl restart mongod
4. If restart fails, restore from backup:
   /opt/deeper_research_synthetic/scripts/recover.sh
5. Verify database connectivity
6. Test application functionality
7. Update monitoring systems
```

##### Network Failure
```bash
# Recovery steps for network failure
1. Identify network issue
2. Check firewall rules
3. Verify DNS resolution
4. Test connectivity to external services
5. Restart network services if needed
6. Update network configuration
7. Verify application connectivity
```

### Business Continuity

#### 1. High Availability Setup
- Load balancer for multiple application servers
- MongoDB replica set for database redundancy
- Multiple geographic regions for global availability
- Automated failover mechanisms

#### 2. Data Replication
- MongoDB replica sets for automatic failover
- Regular backups to multiple locations
- Point-in-time recovery capabilities
- Cross-region data replication

## Testing and Validation

### Pre-Deployment Testing

#### 1. Smoke Tests
Create `/opt/deeper_research_synthetic/scripts/smoke_test.sh`:
```bash
#!/bin/bash

# Smoke test script
# This script performs basic functionality tests

set -e

# Configuration
BASE_URL="http://localhost:5173"
API_URL="$BASE_URL/api"

# Test functions
test_api_status() {
    echo "Testing API status endpoint..."
    response=$(curl -s -w "%{http_code}" "$API_URL/status" -o /tmp/status_response.json)
    if [ "$response" = "200" ]; then
        echo "✅ API status endpoint: PASS"
    else
        echo "❌ API status endpoint: FAIL (HTTP $response)"
        cat /tmp/status_response.json
        exit 1
    fi
}

test_projects_endpoint() {
    echo "Testing projects endpoint..."
    response=$(curl -s -w "%{http_code}" "$API_URL/projects" -o /tmp/projects_response.json)
    if [ "$response" = "200" ]; then
        echo "✅ Projects endpoint: PASS"
    else
        echo "❌ Projects endpoint: FAIL (HTTP $response)"
        cat /tmp/projects_response.json
        exit 1
    fi
}

test_create_project() {
    echo "Testing project creation..."
    response=$(curl -s -w "%{http_code}" -X POST "$API_URL/projects" \
        -H "Content-Type: application/json" \
        -d '{"name":"Smoke Test Project","framework":"PROJECT_DEEPDIVE"}' \
        -o /tmp/create_response.json)
    if [ "$response" = "201" ]; then
        echo "✅ Project creation: PASS"
        PROJECT_ID=$(jq -r '.id' /tmp/create_response.json)
        echo "Created project ID: $PROJECT_ID"
    else
        echo "❌ Project creation: FAIL (HTTP $response)"
        cat /tmp/create_response.json
        exit 1
    fi
}

test_get_project() {
    echo "Testing project retrieval..."
    response=$(curl -s -w "%{http_code}" "$API_URL/projects/$PROJECT_ID" -o /tmp/get_response.json)
    if [ "$response" = "200" ]; then
        echo "✅ Project retrieval: PASS"
    else
        echo "❌ Project retrieval: FAIL (HTTP $response)"
        cat /tmp/get_response.json
        exit 1
    fi
}

test_update_project() {
    echo "Testing project update..."
    response=$(curl -s -w "%{http_code}" -X PUT "$API_URL/projects/$PROJECT_ID" \
        -H "Content-Type: application/json" \
        -d '{"sourceContext":"This is test source context for smoke testing."}' \
        -o /tmp/update_response.json)
    if [ "$response" = "200" ]; then
        echo "✅ Project update: PASS"
    else
        echo "❌ Project update: FAIL (HTTP $response)"
        cat /tmp/update_response.json
        exit 1
    fi
}

test_delete_project() {
    echo "Testing project deletion..."
    response=$(curl -s -w "%{http_code}" -X DELETE "$API_URL/projects/$PROJECT_ID")
    if [ "$response" = "204" ]; then
        echo "✅ Project deletion: PASS"
    else
        echo "❌ Project deletion: FAIL (HTTP $response)"
        exit 1
    fi
}

# Main test execution
echo "=== Deeper Research Synthetic Smoke Tests ==="
test_api_status
test_projects_endpoint
test_create_project
test_get_project
test_update_project
test_delete_project
echo "=== All smoke tests passed ==="
```

#### 2. Load Testing
Create `/opt/deeper_research_synthetic/scripts/load_test.sh`:
```bash
#!/bin/bash

# Load test script
# This script performs basic load testing

set -e

# Configuration
API_URL="http://localhost:5173/api"
CONCURRENT_USERS=50
REQUESTS_PER_USER=10
TOTAL_REQUESTS=$((CONCURRENT_USERS * REQUESTS_PER_USER))

# Install k6 if not present
if ! command -v k6 &> /dev/null; then
    echo "Installing k6..."
    curl -o k6.tar.gz -L https://github.com/grafana/k6/releases/latest/download/k6-latest-linux-amd64.tar.gz
    tar -xzf k6.tar.gz
    sudo cp k6-*/k6 /usr/local/bin/
    rm -rf k6-* k6.tar.gz
fi

# Create load test script
cat > /tmp/load_test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: __ENV.CONCURRENT_USERS || 50,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  const baseUrl = __ENV.API_URL || 'http://localhost:5173/api';
  
  // Test status endpoint
  const res1 = http.get(`${baseUrl}/status`);
  check(res1, {
    'status is 200': (r) => r.status === 200,
  });
  
  // Test projects endpoint
  const res2 = http.get(`${baseUrl}/projects`);
  check(res2, {
    'projects is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
EOF

# Run load test
echo "Running load test with $CONCURRENT_USERS concurrent users..."
k6 run -e API_URL="$API_URL" -e CONCURRENT_USERS="$CONCURRENT_USERS" /tmp/load_test.js

# Cleanup
rm /tmp/load_test.js
```

### Post-Deployment Validation

#### 1. Health Checks
- Verify all services are running
- Check API endpoints respond correctly
- Validate database connectivity
- Confirm monitoring is working

#### 2. Performance Baseline
- Measure response times
- Check resource utilization
- Validate throughput capacity
- Establish performance baseline

#### 3. Security Validation
- Verify firewall rules
- Check SSL certificate validity
- Validate access controls
- Confirm security headers

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Not Starting
```bash
# Check PM2 logs
pm2 logs deeper-research-backend

# Check if port is available
lsof -i :3001

# Check environment variables
printenv | grep -E "(VENICE|GEMINI|DATABASE)"

# Verify dependencies
cd backend && npm list
```

#### 2. Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Test database connectivity
mongo mongodb://localhost:27017/deeper_research --eval "db.stats()"

# Check database logs
tail -f /var/log/mongodb/mongod.log

# Verify connection string
echo $DATABASE_URL
```

#### 3. API Connectivity Problems
```bash
# Test API endpoints directly
curl -v http://localhost:3001/api/status

# Test through proxy
curl -v http://localhost:5173/api/status

# Check NGINX configuration
sudo nginx -t

# Check NGINX logs
tail -f /var/log/nginx/error.log
```

#### 4. SSL/TLS Issues
```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate expiration
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Verify certificate chain
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com -showcerts
```

#### 5. Performance Issues
```bash
# Check system resources
top -p $(pgrep -f "node.*server.js")
htop

# Check application logs for errors
pm2 logs deeper-research-backend --lines 100

# Monitor MongoDB performance
mongostat 5

# Check network performance
iftop -i eth0
```

## Maintenance

### Regular Maintenance Tasks

#### 1. Weekly Maintenance
```bash
# Update dependencies
cd backend && npm outdated && npm update
cd frontend && npm outdated && npm update

# Check for security vulnerabilities
cd backend && npm audit
cd frontend && npm audit

# Run tests
cd backend && npm test
cd frontend && npm test

# Backup database
/opt/deeper_research_synthetic/scripts/backup.sh

# Check logs for errors
/opt/deeper_research_synthetic/scripts/analyze_logs.sh
```

#### 2. Monthly Maintenance
```bash
# Review SSL certificates
/opt/deeper_research_synthetic/scripts/monitor_ssl.sh

# Check system resources
df -h
free -h
iotop

# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart services
pm2 restart deeper-research-backend
pm2 restart deeper-research-frontend

# Review firewall rules
sudo ufw status numbered
```

#### 3. Quarterly Maintenance
```bash
# Review application performance
/opt/deeper_research_synthetic/scripts/monitor_app.sh

# Check database indexes
mongo deeper_research --eval "db.projects.getIndexes()"

# Review backup integrity
tar -tzf /opt/backups/deeper_research/*.tar.gz | head -10

# Update documentation
# Review and update deployment guide
# Review and update security policies
# Review and update operational procedures
```

### Monitoring Alerts

#### 1. Critical Alerts
- Application downtime > 5 minutes
- Database connection failures
- High error rates > 10%
- Memory usage > 90%
- CPU usage > 95%

#### 2. Warning Alerts
- Response times > 500ms
- Memory usage > 80%
- CPU usage > 85%
- Error rates > 5%
- Low disk space < 10%

#### 3. Informational Alerts
- New deployments
- Configuration changes
- Backup completion
- SSL certificate renewal

## Conclusion

This deployment guide provides a comprehensive framework for deploying the Deeper Research Synthetic application to production environments. By following these instructions, you can:

1. Set up a secure, scalable deployment architecture
2. Configure environment variables and security settings
3. Implement monitoring and logging solutions
4. Establish backup and recovery procedures
5. Optimize performance for production workloads
6. Implement disaster recovery plans
7. Perform regular maintenance tasks
8. Troubleshoot common deployment issues

The application is now ready for production deployment with all the necessary security, performance, and operational considerations in place.