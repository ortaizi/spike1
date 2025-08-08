# Self-Hosted Database Setup for Spike Platform

This document outlines the comprehensive self-hosted PostgreSQL and Redis setup for the Spike academic management platform, following industry best practices for security, performance, and reliability.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Spike Platform                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js App (Port 3000)                                  │
│  ├── API Routes                                           │
│  ├── Server Components                                    │
│  └── Client Components                                    │
├─────────────────────────────────────────────────────────────┤
│  PgBouncer (Port 6432) - Connection Pooling              │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (Port 5432) - Primary Database               │
│  ├── Row Level Security (RLS)                            │
│  ├── Automated Backups                                   │
│  ├── Performance Monitoring                               │
│  └── Health Checks                                       │
├─────────────────────────────────────────────────────────────┤
│  Redis Cluster                                           │
│  ├── Redis Master (Port 6379)                            │
│  ├── Redis Replica                                       │
│  ├── Redis Sentinel (Port 26379)                         │
│  └── Redis Commander (Port 8081)                         │
├─────────────────────────────────────────────────────────────┤
│  Management Tools                                        │
│  ├── pgAdmin (Port 8080)                                 │
│  └── Redis Commander (Port 8081)                         │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp env.local.example .env.local

# Edit environment variables
nano .env.local
```

### 2. Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis-master
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with test data
npm run db:seed
```

### 4. Access Management Tools

- **pgAdmin**: http://localhost:8080 (admin@spike.local / admin)
- **Redis Commander**: http://localhost:8081
- **Database**: localhost:5432 (postgres / password)

## 🔒 Security Features

### PostgreSQL Security

1. **Row Level Security (RLS)**
   - Multi-tenant data isolation
   - User-specific data access policies
   - Automatic data filtering

2. **Connection Security**
   - SSL/TLS encryption (production)
   - Password authentication
   - IP-based access control

3. **User Privileges**
   - Limited application user (`spike_app`)
   - Read-only monitoring user
   - Separate admin user

### Redis Security

1. **Authentication**
   - Password-protected access
   - User-based authentication
   - Network isolation

2. **Memory Management**
   - Configurable memory limits
   - LRU eviction policy
   - Memory monitoring

3. **Network Security**
   - Internal network only
   - No external access by default
   - Encrypted connections (production)

## 📊 Performance Optimizations

### PostgreSQL Performance

1. **Connection Pooling**
   - PgBouncer with 20 default connections
   - Transaction-level pooling
   - Connection health monitoring

2. **Query Optimization**
   - Strategic indexes for common queries
   - Full-text search for Hebrew content
   - Composite indexes for complex queries

3. **Memory Configuration**
   - Shared buffers: 256MB
   - Work memory: 4MB per query
   - Effective cache size: 1GB

4. **Maintenance**
   - Automated vacuuming
   - Statistics collection
   - Background writer optimization

### Redis Performance

1. **Memory Management**
   - 256MB memory limit
   - LRU eviction policy
   - Memory monitoring

2. **Persistence**
   - AOF (Append Only File) enabled
   - RDB snapshots
   - Hybrid persistence

3. **Replication**
   - Master-replica setup
   - Sentinel for high availability
   - Automatic failover

## 🔧 Monitoring & Maintenance

### Automated Scripts

1. **Backup Script** (`scripts/backup.sh`)
   ```bash
   # Manual backup
   ./packages/database/scripts/backup.sh
   
   # Automated daily backup (cron)
   0 2 * * * /path/to/spike/packages/database/scripts/backup.sh
   ```

2. **Monitoring Script** (`scripts/monitor.sh`)
   ```bash
   # Health check
   ./packages/database/scripts/monitor.sh
   
   # Continuous monitoring (cron)
   */5 * * * * /path/to/spike/packages/database/scripts/monitor.sh
   ```

### Monitoring Metrics

1. **Database Metrics**
   - Connection count
   - Query performance
   - Table sizes
   - Index usage
   - Lock detection

2. **Redis Metrics**
   - Memory usage
   - Key count
   - Hit/miss ratio
   - Replication status

3. **System Metrics**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network traffic

## 🛠️ Configuration Files

### PostgreSQL Configuration

- **`postgresql.conf`**: Performance and logging settings
- **`pg_hba.conf`**: Authentication and access control
- **`init/01-init-db.sql`**: Database initialization and security setup

### Redis Configuration

- **`redis.conf`**: Redis server configuration
- **`sentinel.conf`**: Redis Sentinel configuration

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Database Replication**
   - Read replicas for query distribution
   - Streaming replication setup
   - Load balancing with PgBouncer

2. **Redis Cluster**
   - Multiple Redis instances
   - Sharding for large datasets
   - Sentinel for failover management

### Vertical Scaling

1. **Resource Allocation**
   - Increase memory limits
   - Optimize connection pools
   - Tune query planner

2. **Performance Tuning**
   - Query optimization
   - Index strategy
   - Caching layers

## 🔄 Backup & Recovery

### Backup Strategy

1. **Automated Backups**
   - Daily full backups
   - Compressed storage
   - 30-day retention

2. **Backup Verification**
   - Integrity checks
   - Restore testing
   - Metadata tracking

3. **Recovery Procedures**
   - Point-in-time recovery
   - Selective table restore
   - Disaster recovery plan

### Backup Commands

```bash
# Create backup
./packages/database/scripts/backup.sh

# Restore backup
gunzip -c backup_file.sql.gz | psql -h localhost -U postgres -d spike_dev

# Verify backup
gunzip -t backup_file.sql.gz
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Issues**
   ```bash
   # Check PostgreSQL status
   docker-compose logs postgres
   
   # Test connection
   psql -h localhost -U postgres -d spike_dev
   ```

2. **Performance Issues**
   ```bash
   # Check slow queries
   ./packages/database/scripts/monitor.sh
   
   # Analyze query performance
   EXPLAIN ANALYZE your_query;
   ```

3. **Memory Issues**
   ```bash
   # Check Redis memory
   redis-cli -h localhost -a password info memory
   
   # Check PostgreSQL memory
   psql -c "SELECT * FROM pg_stat_bgwriter;"
   ```

### Log Locations

- **PostgreSQL**: `/var/lib/postgresql/data/log/`
- **Redis**: Docker container logs
- **Application**: `/var/log/spike/`

## 🔐 Production Deployment

### Security Checklist

- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Strong passwords set
- [ ] Network isolation implemented
- [ ] Monitoring alerts configured
- [ ] Backup verification completed
- [ ] Disaster recovery tested

### Performance Checklist

- [ ] Connection pooling optimized
- [ ] Indexes created for common queries
- [ ] Memory settings tuned
- [ ] Monitoring dashboards configured
- [ ] Load testing completed
- [ ] Performance baselines established

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Consult monitoring dashboards
4. Contact the development team 