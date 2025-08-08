# Spike - Academic Management Platform

A comprehensive academic management platform designed specifically for Israeli university students, starting with Ben Gurion University.

## 🎯 Overview

Spike integrates assignment tracking, academic calendar, course management, email organization, and team collaboration into one seamless experience.

## 🏗️ Architecture

This is a monorepo built with Turborepo containing:

- **`apps/web`** - Next.js 14 frontend with App Router
- **`apps/api`** - Express.js microservice (optional)
- **`apps/scraper`** - Python web scraping service
- **`packages/database`** - Prisma schema and database client
- **`packages/shared`** - Shared types and utilities
- **`packages/ui`** - Shared UI components

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL (or use Supabase/Neon.tech)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Spike
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the database**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Set up the database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
spike/
├── apps/
│   ├── web/                    # Next.js frontend + API
│   │   ├── app/               # App Router (Next.js 14)
│   │   ├── components/        # React components
│   │   ├── lib/              # Utilities and helpers
│   │   └── public/           # Static assets
│   ├── api/                   # Express.js service (optional)
│   └── scraper/              # Python scraping service
├── packages/
│   ├── database/             # Prisma schema & client
│   ├── shared/              # Shared types & utils
│   └── ui/                  # Shared UI components
├── docker-compose.yml       # Local development
├── turbo.json              # Turborepo config
└── package.json            # Root package.json
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all packages and apps
- `npm run lint` - Lint all packages and apps
- `npm run test` - Run tests
- `npm run db:push` - Push database schema
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data

### Adding New Features

1. **Frontend Components**: Add to `apps/web/components/`
2. **API Routes**: Add to `apps/web/app/api/`
3. **Database Models**: Update `packages/database/prisma/schema.prisma`
4. **Shared Types**: Add to `packages/shared/src/`
5. **UI Components**: Add to `packages/ui/src/components/`

## 🎨 Design System

The platform uses a custom design system based on your existing Vercel v0 pages. All new features will maintain visual consistency with your original design.

### Hebrew RTL Support

- Full Right-to-Left text direction support
- Hebrew date and number formatting
- Israeli academic terminology
- BGU-specific course codes and calendar

## 🔧 Configuration

### Environment Variables

Key environment variables (see `env.example` for full list):

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `UPSTASH_REDIS_REST_URL` - Redis for caching
- `SENTRY_DSN` - Error monitoring

### Database

The platform uses PostgreSQL with Prisma ORM. Key models include:

- **User** - Student profiles and preferences
- **Course** - Academic courses with BGU codes
- **Assignment** - Course assignments with tracking
- **Team** - Student collaboration groups
- **Grade** - Academic performance tracking

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy to Vercel
```

### Backend (Railway/Render)
```bash
# Deploy Express.js service
# Deploy Python scraper
```

### Database (Neon.tech/Supabase)
- Use managed PostgreSQL service
- Configure connection pooling
- Set up automated backups

## 📊 Monitoring

- **Error Tracking**: Sentry
- **Uptime Monitoring**: BetterUptime
- **Analytics**: Posthog/Plausible
- **Performance**: New Relic

## 🤝 Contributing

1. Follow the established coding standards
2. Use the provided Cursor rules for consistency
3. Write tests for new features
4. Update documentation as needed

## 📄 License

[Add your license here]

## 🆘 Support

For support and questions, please refer to the project documentation or create an issue. 