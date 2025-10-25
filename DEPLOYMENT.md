# 🚀 Production Deployment Guide

## Overview

This guide covers deploying Deeper Research Synthetic to production environments using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+ and Docker Compose v2.0+
- 2GB+ RAM available
- 10GB+ disk space
- Linux/macOS/Windows with WSL2
- AI API key (Venice.ai or Google Gemini)

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/Fayeblade1488/deeper_research_synthetic.git
cd deeper_research_synthetic
```

### 2. Configure Environment

```bash
# Copy production environment template
cp .env.production .env

# Edit .env with your configuration
nano .env
```

**Required Configuration:**

```bash
# Change MongoDB password
MONGO_ROOT_PASSWORD=your_secure_password_here

# Add your AI API key
VENICE_API_KEY=your_venice_api_key  # OR
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Deploy

```bash
# Run deployment script
./deploy.sh
```

The script will:
- Validate configuration
- Build Docker images
- Start all services
- Run health checks
- Display access URLs

### 4. Access Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001/api/v1
- **API Health**: http://localhost:3001/api/v1/health

## Manual Deployment

### Build Images

```bash
docker-compose build
```

### Start Services

```bash
docker-compose up -d
```

### Check Status

```bash
docker-compose ps
docker-compose logs -f
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes

```bash
docker-compose down -v
```

## Production Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_ROOT_PASSWORD` | ✅ | - | MongoDB root password |
| `VENICE_API_KEY` | * | - | Venice.ai API key |
| `GEMINI_API_KEY` | * | - | Google Gemini API key |
| `AI_PROVIDER` | ❌ | venice | AI provider (venice/gemini) |
| `NODE_ENV` | ❌ | production | Node environment |
| `ANONYMOUS_MODE` | ❌ | true | Privacy mode |

\* At least one API key required

### Security Checklist

- ✅ Change default MongoDB password
- ✅ Use strong, unique passwords
- ✅ Enable HTTPS in production (see below)
- ✅ Configure firewall rules
- ✅ Keep API keys secure
- ✅ Regular security updates
- ✅ Monitor logs for suspicious activity

## HTTPS Configuration

### Using Reverse Proxy (Recommended)

Add an HTTPS reverse proxy like Nginx or Caddy:

```yaml
# docker-compose.override.yml
services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
```

### SSL Certificate Setup

```bash
# Using Let's Encrypt (Certbot)
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
```

## Cloud Deployment

### AWS ECS

1. Build and push images to ECR:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker tag deeper-research-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/deeper-research-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/deeper-research-backend:latest

docker tag deeper-research-frontend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/deeper-research-frontend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/deeper-research-frontend:latest
```

2. Create ECS task definitions using images
3. Configure load balancer
4. Set environment variables in task definition

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT-ID/deeper-research-backend ./backend
gcloud builds submit --tag gcr.io/PROJECT-ID/deeper-research-frontend ./frontend

# Deploy to Cloud Run
gcloud run deploy deeper-research-backend \
  --image gcr.io/PROJECT-ID/deeper-research-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars="NODE_ENV=production,MONGODB_URI=..."

gcloud run deploy deeper-research-frontend \
  --image gcr.io/PROJECT-ID/deeper-research-frontend \
  --platform managed \
  --region us-central1
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings:
   - Backend: Node.js, build command `npm install`, run command `npm start`
   - Frontend: Static site, build command `npm run build`, output dir `dist`
3. Add environment variables
4. Deploy

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3001/api/v1/health

# Frontend health
curl http://localhost:8080/health
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Metrics

Access container metrics:

```bash
docker stats
```

## Backup & Recovery

### Database Backup

```bash
# Create backup
docker-compose exec mongodb mongodump --out=/data/backup --authenticationDatabase=admin -u admin -p ${MONGO_ROOT_PASSWORD}

# Copy backup from container
docker cp deeper-research-mongodb:/data/backup ./backups/$(date +%Y%m%d)
```

### Automated Backups

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

### Restore Database

```bash
# Copy backup to container
docker cp ./backups/20231025 deeper-research-mongodb:/data/restore

# Restore
docker-compose exec mongodb mongorestore /data/restore --authenticationDatabase=admin -u admin -p ${MONGO_ROOT_PASSWORD}
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
    
  nginx-lb:
    image: nginx:alpine
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    ports:
      - "3001:3001"
```

Start with scaling:

```bash
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale backend=3
```

### Vertical Scaling

Adjust resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache

# Reset everything
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Test connection
docker-compose exec mongodb mongosh -u admin -p ${MONGO_ROOT_PASSWORD}

# Check environment variables
docker-compose exec backend env | grep MONGODB
```

### Frontend Can't Reach Backend

```bash
# Check network connectivity
docker-compose exec frontend ping backend

# Verify API URL
docker-compose exec frontend env | grep VITE_API_URL

# Check nginx proxy config
docker-compose exec frontend cat /etc/nginx/nginx.conf
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check for memory leaks
docker-compose logs backend | grep "memory"

# Monitor MongoDB performance
docker-compose exec mongodb mongosh --eval "db.serverStatus()"
```

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Update Dependencies

```bash
# Update Node packages
docker-compose exec backend npm update
docker-compose exec frontend npm update

# Rebuild images
docker-compose build
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune
```

## Security Updates

```bash
# Update base images
docker-compose pull
docker-compose build --pull
docker-compose up -d
```

## Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/Fayeblade1488/deeper_research_synthetic/issues)
- **Security**: [SECURITY.md](./SECURITY.md)

## License

MIT License - See [LICENSE](./LICENSE)
