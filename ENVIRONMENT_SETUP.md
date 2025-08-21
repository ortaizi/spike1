# Environment Configuration Setup

## Overview
This project now uses separate environment files for development and production:

- **`.env.local`** - Development environment variables
- **`.env`** - Production environment variables (template)

## Environment Files

### Development (`.env.local`)
Used for local development with the following configuration:
- Local Supabase instance (127.0.0.1:54321) or hosted Supabase
- Development NextAuth settings (localhost:3000)
- Debug flags enabled
- Development Google OAuth credentials
- Development university Moodle credentials

### Production (`.env`)
Template for production deployment with:
- Production Supabase URLs
- Production NextAuth configuration
- Security-focused settings
- Comments indicating which variables should be set via hosting platform

## Key Changes Made

1. **Created `.env`** - Production environment template with actual production values
2. **Updated `.env.local`** - Clarified as development-only with appropriate labels
3. **Cleaned up `.gitignore`** - Removed duplicate .env entries
4. **Added development flags** - DEBUG=true, ENABLE_MOCK_DATA=true for development

## Variable Categories

### Production-Safe Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Uses production Supabase URL
- `GOOGLE_CLIENT_ID` - Same for both environments
- `BGU_MOODLE_URL` - Production Moodle URL

### Development-Only Variables
- `NEXTAUTH_DEBUG=true`
- `DEBUG=true` 
- `ENABLE_MOCK_DATA=true`
- Local Supabase configuration

### Environment-Specific Variables
- `NEXTAUTH_URL` - localhost vs production domain
- Database credentials - development vs production
- Client secrets - should be set via hosting platform in production

## Security Notes

### Never Commit These Values:
- Database passwords
- Client secrets
- API keys
- Encryption keys

### Hosting Platform Variables:
For production deployment, set these via your hosting platform's environment variables:
- `NEXTAUTH_SECRET`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`
- `ENCRYPTION_KEY`

## Environment Loading Priority (Next.js)

1. `.env.local` (development, ignored by git)
2. `.env.production` (production environment)
3. `.env` (production fallback)

## Testing

✅ **Development Environment**: Confirmed working
- Server starts successfully with `npm run dev`
- Environment variables load correctly
- Authentication functions properly
- Database connections work

✅ **Production Environment**: Template ready
- `.env` file contains production configuration
- Comments indicate hosting platform variables
- No sensitive data in version control

## Usage

### Development
```bash
npm run dev  # Uses .env.local
```

### Production
```bash
NODE_ENV=production npm run build  # Uses .env + hosting platform variables
npm run start
```

## Next Steps

1. **For deployment**: Set sensitive environment variables through your hosting platform dashboard
2. **For team members**: Copy `.env.local` and populate with your own development credentials
3. **For new environments**: Create `.env.staging` or similar following the same pattern