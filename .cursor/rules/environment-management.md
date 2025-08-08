# Environment Variables Management

This document outlines the environment variables required for the Spike project and how to manage them securely.

## Overview

The project uses environment variables to configure database connections, authentication, and external service integrations. All sensitive values should be stored in `.env.development` locally and never committed to version control.

### Current Environment Variables Template:

```env
# Supabase Configuration
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
SUPABASE_DB_PASSWORD="your_database_password"

# NextAuth v5 Configuration
APP_URL="http://localhost:3000"
AUTH_SECRET="your_nextauth_secret_generate_with_openssl_rand_base64_32"
AUTH_URL="http://localhost:3000"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Moodle Configuration
MOODLE_USERNAME="your_moodle_username"
MOODLE_PASSWORD="your_moodle_password"
MOODLE_BASE_URL="your_moodle_instance_url"

# Environment Settings
NODE_ENV="development"
NEXTAUTH_DEBUG=true
```

## Setup Instructions

1. Copy the template above to your `.env.development` file
2. Replace all placeholder values with your actual credentials
3. Ensure `.env.development` is listed in `.gitignore`
4. Never commit actual credentials to version control

## Security Notes

- All environment files (`.env.*`) are excluded from version control
- Use strong, unique secrets for all authentication tokens
- Rotate credentials regularly
- Use environment-specific values for different deployment stages

## Generating Secrets

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

## Required Services

- **Supabase**: Database and authentication backend
- **Google OAuth**: For user authentication
- **Moodle**: Course data integration

Each service requires registration and credential generation through their respective consoles.
