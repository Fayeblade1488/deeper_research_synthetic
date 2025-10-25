#!/bin/bash

# Backup script for MongoDB database

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$DATE"

echo "🗄️  Starting MongoDB backup..."

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Get MongoDB password from .env
if [ -f .env ]; then
    source .env
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Create backup
docker-compose exec -T mongodb mongodump \
    --out=/data/backup \
    --authenticationDatabase=admin \
    -u admin \
    -p "$MONGO_ROOT_PASSWORD"

# Copy from container
docker cp deeper-research-mongodb:/data/backup "$BACKUP_PATH"

# Compress backup
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_PATH"

echo "✅ Backup completed: $BACKUP_PATH.tar.gz"

# Keep only last 7 backups
cd "$BACKUP_DIR"
ls -t *.tar.gz | tail -n +8 | xargs -r rm

echo "🧹 Cleaned up old backups (keeping last 7)"
