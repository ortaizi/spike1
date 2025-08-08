#!/bin/bash

# PostgreSQL Backup Script for Spike Platform
# Automated backup with rotation and compression

set -e

# Configuration
BACKUP_DIR="/backups/postgresql"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="spike_dev"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    log "Cleanup completed"
}

# Function to create backup
create_backup() {
    local backup_file="$BACKUP_DIR/spike_backup_$DATE.sql.gz"
    
    log "Starting backup of database $DB_NAME..."
    
    # Create backup with compression
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --no-owner \
        --no-privileges \
        --no-tablespaces \
        --exclude-table-data='reminders' \
        --exclude-table-data='assignment_submissions' \
        | gzip > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log "Backup completed successfully: $backup_file"
        log "Backup size: $(du -h "$backup_file" | cut -f1)"
    else
        log "ERROR: Backup failed!"
        exit 1
    fi
}

# Function to verify backup
verify_backup() {
    local backup_file="$BACKUP_DIR/spike_backup_$DATE.sql.gz"
    
    log "Verifying backup integrity..."
    
    # Test if backup can be read
    if gunzip -t "$backup_file" 2>/dev/null; then
        log "Backup verification successful"
    else
        log "ERROR: Backup verification failed!"
        exit 1
    fi
}

# Function to create backup metadata
create_metadata() {
    local backup_file="$BACKUP_DIR/spike_backup_$DATE.sql.gz"
    local metadata_file="$BACKUP_DIR/spike_backup_$DATE.metadata"
    
    cat > "$metadata_file" << EOF
Backup Date: $(date)
Database: $DB_NAME
Host: $DB_HOST
Port: $DB_PORT
User: $DB_USER
File: $(basename "$backup_file")
Size: $(du -h "$backup_file" | cut -f1)
Checksum: $(md5sum "$backup_file" | cut -d' ' -f1)
EOF
    
    log "Backup metadata created: $metadata_file"
}

# Main execution
main() {
    log "Starting PostgreSQL backup process..."
    
    # Check if PostgreSQL is running
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
        log "ERROR: PostgreSQL is not accessible!"
        exit 1
    fi
    
    # Create backup
    create_backup
    
    # Verify backup
    verify_backup
    
    # Create metadata
    create_metadata
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "Backup process completed successfully"
}

# Run main function
main "$@" 