#!/bin/bash

# Script to generate secure secrets for Spike platform
# Usage: ./scripts/generate-secrets.sh

set -e

echo "🔐 Generating secure secrets for Spike platform..."
echo ""
echo "================================================"
echo "Add these to your .env file (DO NOT COMMIT!):"
echo "================================================"
echo ""

# Generate NextAuth Secret (minimum 32 characters)
echo "# Authentication Secrets"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "NEXTAUTH_URL=http://localhost:3000"
echo ""

# Generate JWT Secrets
echo "# JWT Secrets"
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo "JWT_ACCESS_EXPIRE=1h"
echo "JWT_REFRESH_EXPIRE=7d"
echo ""

# Generate Database Passwords
echo "# Database Configuration"
echo "DATABASE_URL=postgresql://spike_user:$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)@localhost:5432/spike_db"
echo "DATABASE_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)"
echo ""

# Generate Redis Password
echo "# Redis Configuration"
echo "REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)"
echo "REDIS_URL=redis://:$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)@localhost:6379"
echo ""

# Generate RabbitMQ Password
echo "# RabbitMQ Configuration"
echo "RABBITMQ_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)"
echo "RABBITMQ_DEFAULT_USER=spike_user"
echo "RABBITMQ_DEFAULT_VHOST=spike_platform"
echo ""

# Generate Encryption Key
echo "# Encryption"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo ""

# Placeholder for OAuth (user must get from providers)
echo "# OAuth Providers (Get from provider dashboards)"
echo "GOOGLE_CLIENT_ID=<get-from-google-console>"
echo "GOOGLE_CLIENT_SECRET=<get-from-google-console>"
echo ""

# Placeholder for Supabase
echo "# Supabase (Get from Supabase dashboard)"
echo "NEXT_PUBLIC_SUPABASE_URL=<your-project-url>"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>"
echo "SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>"
echo ""

# Placeholder for third-party APIs
echo "# Third-party APIs"
echo "CONTEXT7_API_KEY=<get-from-context7-dashboard>"
echo "TWILIO_ACCOUNT_SID=<get-from-twilio>"
echo "TWILIO_AUTH_TOKEN=<get-from-twilio>"
echo ""

# Test Environment Secrets
echo "# Test Environment (for .env.test)"
echo "TEST_NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "TEST_JWT_SECRET=$(openssl rand -hex 32)"
echo "TEST_DATABASE_URL=postgresql://test_user:$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)@localhost:5432/spike_test"
echo ""

# Test User Credentials (generated securely)
echo "# Test User Credentials (for .env.test)"
echo "TEST_BGU_EMAIL=test-bgu-$(uuidgen | cut -c1-8)@example.test"
echo "TEST_BGU_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)"
echo "TEST_TAU_EMAIL=test-tau-$(uuidgen | cut -c1-8)@example.test"
echo "TEST_TAU_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)"
echo "TEST_HUJI_EMAIL=test-huji-$(uuidgen | cut -c1-8)@example.test"
echo "TEST_HUJI_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)"
echo ""

echo "================================================"
echo ""
echo "⚠️  IMPORTANT REMINDERS:"
echo "1. Copy these values to your .env file"
echo "2. NEVER commit .env files to git"
echo "3. Add .env to .gitignore if not already there"
echo "4. Update OAuth and API keys with real values from providers"
echo "5. Store production secrets in a secure secret manager"
echo "6. Rotate secrets every 30-90 days"
echo ""
echo "✅ Secret generation complete!"