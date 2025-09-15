#!/bin/bash
# Tenant database setup script for Academic Service
# Usage: ./tenant-setup.sh <tenant_id> [db_host] [db_port]

set -e

TENANT_ID="${1}"
DB_HOST="${2:-localhost}"
DB_PORT="${3:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

if [ -z "$TENANT_ID" ]; then
    echo "Usage: $0 <tenant_id> [db_host] [db_port]"
    echo "Example: $0 bgu localhost 5432"
    exit 1
fi

TENANT_DB="spike_${TENANT_ID}"

echo "🚀 Setting up Academic Service database for tenant: ${TENANT_ID}"
echo "Database: ${TENANT_DB}"
echo "Host: ${DB_HOST}:${DB_PORT}"

# Check if database exists, create if not
echo "📊 Checking if database ${TENANT_DB} exists..."

DB_EXISTS=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${TENANT_DB}'" || echo "0")

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ Database ${TENANT_DB} already exists"
else
    echo "🔨 Creating database ${TENANT_DB}..."
    PGPASSWORD="${DB_PASSWORD}" createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TENANT_DB}"
    echo "✅ Database ${TENANT_DB} created"
fi

# Create academic service user if not exists
echo "👤 Setting up academic service user..."
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TENANT_DB}" <<EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'academic_service_user') THEN
        CREATE USER academic_service_user WITH ENCRYPTED PASSWORD 'academic_service_password';
    END IF;
END
\$\$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE ${TENANT_DB} TO academic_service_user;
GRANT CREATE ON DATABASE ${TENANT_DB} TO academic_service_user;
EOF

# Run migration with tenant-specific replacement
echo "🗄️  Running database migration for tenant ${TENANT_ID}..."

# Create temporary migration file with tenant ID replaced
TEMP_MIGRATION="/tmp/migration_${TENANT_ID}.sql"
sed "s/{tenant_id}/${TENANT_ID}/g" "$(dirname "$0")/001_create_academic_schema.sql" > "${TEMP_MIGRATION}"

# Execute migration
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TENANT_DB}" -f "${TEMP_MIGRATION}"

# Cleanup
rm -f "${TEMP_MIGRATION}"

echo "✅ Migration completed for tenant ${TENANT_ID}"

# Verify schema creation
echo "🔍 Verifying schema creation..."
TABLE_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TENANT_DB}" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'academic_${TENANT_ID}'")

echo "📊 Created ${TABLE_COUNT} tables in schema academic_${TENANT_ID}"

if [ "$TABLE_COUNT" -ge 7 ]; then
    echo "✅ Schema setup successful for tenant ${TENANT_ID}"
else
    echo "❌ Schema setup may have failed - expected at least 7 tables"
    exit 1
fi

# Test basic operations
echo "🧪 Testing basic database operations..."
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TENANT_DB}" <<EOF
-- Test insert and select
INSERT INTO academic_${TENANT_ID}.courses (code, name, faculty, academic_year, semester, tenant_id)
VALUES ('TEST-101', 'Test Course', 'Test Faculty', 2024, 'fall', '${TENANT_ID}');

SELECT code, name FROM academic_${TENANT_ID}.courses WHERE code = 'TEST-101';

-- Cleanup test data
DELETE FROM academic_${TENANT_ID}.courses WHERE code = 'TEST-101';
EOF

echo "✅ Database operations test passed"
echo "🎉 Academic Service database setup complete for tenant: ${TENANT_ID}"
echo ""
echo "Connection details:"
echo "  Database: ${TENANT_DB}"
echo "  Schema: academic_${TENANT_ID}"
echo "  Host: ${DB_HOST}:${DB_PORT}"
echo "  Service User: academic_service_user"
echo ""
echo "You can now start the Academic Service with TENANT_ID=${TENANT_ID}"