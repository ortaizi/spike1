#!/bin/bash

# Database Monitoring Script for Spike Platform
# Health checks, performance monitoring, and alerting

set -e

# Configuration
DB_NAME="spike_dev"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
LOG_FILE="/var/log/spike/db_monitor.log"
ALERT_EMAIL="admin@spike.local"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local message="$1"
    log "ALERT: $message"
    # In production, you would send email/SMS here
    # echo "$message" | mail -s "Spike DB Alert" "$ALERT_EMAIL"
}

# Function to check database connectivity
check_connectivity() {
    log "Checking database connectivity..."
    
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log "Database connectivity: OK"
        return 0
    else
        send_alert "Database connectivity failed!"
        return 1
    fi
}

# Function to check database size
check_database_size() {
    log "Checking database size..."
    
    local size_query="SELECT pg_size_pretty(pg_database_size('$DB_NAME'));"
    local size=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$size_query" | xargs)
    
    log "Database size: $size"
    
    # Extract numeric value for comparison
    local size_mb=$(echo "$size" | sed 's/[^0-9.]//g')
    if (( $(echo "$size_mb > 1000" | bc -l) )); then
        send_alert "Database size is large: $size"
    fi
}

# Function to check active connections
check_connections() {
    log "Checking active connections..."
    
    local connections_query="SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
    local connections=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$connections_query" | xargs)
    
    log "Active connections: $connections"
    
    if [ "$connections" -gt 50 ]; then
        send_alert "High number of active connections: $connections"
    fi
}

# Function to check slow queries
check_slow_queries() {
    log "Checking for slow queries..."
    
    local slow_query="SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"
    local slow_queries=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$slow_query")
    
    if [ -n "$slow_queries" ]; then
        log "Slow queries detected:"
        echo "$slow_queries" | while read -r line; do
            if [ -n "$line" ]; then
                log "  $line"
            fi
        done
    else
        log "No slow queries detected"
    fi
}

# Function to check table sizes
check_table_sizes() {
    log "Checking table sizes..."
    
    local table_size_query="
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
        LIMIT 10;
    "
    
    local table_sizes=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$table_size_query")
    
    log "Largest tables:"
    echo "$table_sizes" | while read -r line; do
        if [ -n "$line" ]; then
            log "  $line"
        fi
    done
}

# Function to check index usage
check_index_usage() {
    log "Checking index usage..."
    
    local index_query="
        SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
        FROM pg_stat_user_indexes 
        ORDER BY idx_scan DESC 
        LIMIT 10;
    "
    
    local index_usage=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$index_query")
    
    log "Index usage statistics:"
    echo "$index_usage" | while read -r line; do
        if [ -n "$line" ]; then
            log "  $line"
        fi
    done
}

# Function to check locks
check_locks() {
    log "Checking for locks..."
    
    local locks_query="
        SELECT 
            l.pid,
            l.mode,
            l.granted,
            a.usename,
            a.application_name,
            a.query
        FROM pg_locks l
        JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.locktype = 'relation'
        AND NOT l.granted;
    "
    
    local locks=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$locks_query")
    
    if [ -n "$locks" ]; then
        send_alert "Database locks detected!"
        log "Locks found:"
        echo "$locks" | while read -r line; do
            if [ -n "$line" ]; then
                log "  $line"
            fi
        done
    else
        log "No locks detected"
    fi
}

# Function to check autovacuum status
check_autovacuum() {
    log "Checking autovacuum status..."
    
    local autovacuum_query="
        SELECT 
            schemaname,
            tablename,
            last_vacuum,
            last_autovacuum,
            vacuum_count,
            autovacuum_count
        FROM pg_stat_user_tables 
        WHERE autovacuum_count > 0
        ORDER BY autovacuum_count DESC 
        LIMIT 10;
    "
    
    local autovacuum_stats=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$autovacuum_query")
    
    log "Autovacuum statistics:"
    echo "$autovacuum_stats" | while read -r line; do
        if [ -n "$line" ]; then
            log "  $line"
        fi
    done
}

# Function to check Redis connectivity
check_redis() {
    log "Checking Redis connectivity..."
    
    if redis-cli -h localhost -p 6379 -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
        log "Redis connectivity: OK"
        
        # Check Redis memory usage
        local memory_info=$(redis-cli -h localhost -p 6379 -a "$REDIS_PASSWORD" info memory | grep "used_memory_human")
        log "Redis memory usage: $memory_info"
        
        # Check Redis keys
        local key_count=$(redis-cli -h localhost -p 6379 -a "$REDIS_PASSWORD" dbsize)
        log "Redis keys count: $key_count"
        
    else
        send_alert "Redis connectivity failed!"
        return 1
    fi
}

# Main monitoring function
main() {
    log "Starting database monitoring..."
    
    # Check connectivity
    if ! check_connectivity; then
        exit 1
    fi
    
    # Run all checks
    check_database_size
    check_connections
    check_slow_queries
    check_table_sizes
    check_index_usage
    check_locks
    check_autovacuum
    check_redis
    
    log "Database monitoring completed successfully"
}

# Run main function
main "$@" 