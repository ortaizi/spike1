# Spike Platform - Comprehensive Technical Documentation

**Version:** 0.1.0
**Last Updated:** September 2025
**Classification:** Production Documentation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Documentation](#2-architecture-documentation)
3. [API Documentation](#3-api-documentation)
4. [Database Schema](#4-database-schema)
5. [Authentication System](#5-authentication-system)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Hebrew/RTL Implementation](#7-hebrewrtl-implementation)
8. [BGU Moodle Integration](#8-bgu-moodle-integration)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Guide](#10-deployment-guide)
11. [Development Workflow](#11-development-workflow)
12. [Security Documentation](#12-security-documentation)
13. [Performance Optimization](#13-performance-optimization)
14. [Troubleshooting Guide](#14-troubleshooting-guide)
15. [API Integration Examples](#15-api-integration-examples)
16. [Appendices](#16-appendices)

---

## 1. Executive Summary

### 1.1 Project Overview

Spike is a comprehensive academic management platform specifically designed for Israeli university students, with a primary focus on Ben Gurion University (BGU) of the Negev. The platform revolutionizes how students interact with their academic resources by providing a unified interface for course management, assignment tracking, and Moodle integration.

### 1.2 Vision and Mission

**Vision:** To become the leading academic management solution for Israeli higher education institutions, providing seamless integration with existing university systems while offering a modern, intuitive user experience.

**Mission:** To simplify academic life for Israeli university students by centralizing all academic resources in a single, accessible, Hebrew-first platform that respects cultural and linguistic requirements.

### 1.3 Key Features

- **Unified Authentication**: Multi-stage authentication system integrating Google OAuth with university credentials
- **Real-time Moodle Synchronization**: Automatic course and assignment synchronization with BGU's Moodle system
- **Hebrew-First Design**: Complete RTL support with Hebrew localization throughout
- **Smart Dashboard**: Personalized academic dashboard with intelligent prioritization
- **Team Collaboration**: Built-in team management for group projects
- **Assignment Tracking**: Comprehensive assignment management with due date tracking
- **Grade Management**: Centralized grade tracking across all courses
- **Mobile Responsive**: Full functionality across all device types

### 1.4 Target Audience

- **Primary Users**: Ben Gurion University students (undergraduate and graduate)
- **Secondary Users**: Faculty members for assignment and grade management
- **Future Expansion**: Other Israeli universities and academic institutions

### 1.5 Technology Highlights

- Modern Next.js 14 with App Router architecture
- Supabase PostgreSQL for scalable data management
- Python-based intelligent web scraping
- Microservices architecture with Docker orchestration
- Real-time synchronization with WebSockets
- Enterprise-grade security with encryption at rest

---

## 2. Architecture Documentation

### 2.1 System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Next.js Web App]
        MOBILE[Mobile PWA]
    end

    subgraph "API Gateway"
        NGINX[Nginx Gateway]
    end

    subgraph "Application Services"
        AUTH[Auth Service]
        TENANT[Tenant Service]
        ACADEMIC[Academic Service]
        SYNC[Sync Orchestrator]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
        RABBITMQ[RabbitMQ]
    end

    subgraph "External Systems"
        MOODLE[BGU Moodle]
        GOOGLE[Google OAuth]
    end

    subgraph "Infrastructure"
        MONITORING[Monitoring Stack]
        LOGS[Centralized Logging]
    end

    WEB --> NGINX
    MOBILE --> NGINX
    NGINX --> AUTH
    NGINX --> TENANT
    NGINX --> ACADEMIC
    NGINX --> SYNC

    AUTH --> POSTGRES
    AUTH --> REDIS
    AUTH --> GOOGLE

    TENANT --> POSTGRES
    TENANT --> REDIS

    ACADEMIC --> POSTGRES
    ACADEMIC --> RABBITMQ

    SYNC --> POSTGRES
    SYNC --> RABBITMQ
    SYNC --> MOODLE

    MONITORING --> AUTH
    MONITORING --> TENANT
    MONITORING --> ACADEMIC
    MONITORING --> SYNC
```

### 2.2 Technology Stack

#### 2.2.1 Frontend Technologies
- **Framework**: Next.js 14.0+ with App Router
- **Language**: TypeScript 5.0+
- **UI Library**: React 18.0+
- **Styling**: Tailwind CSS 3.0+ with RTL support
- **Component Library**: Radix UI for accessibility
- **State Management**: Zustand for client state, React Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Animation**: Framer Motion 12.0+

#### 2.2.2 Backend Technologies
- **Runtime**: Node.js 18.0+ LTS
- **API Framework**: Next.js API Routes + Express.js microservices
- **Authentication**: NextAuth.js with custom providers
- **Database ORM**: Prisma (planned) / Direct SQL queries (current)
- **Message Queue**: RabbitMQ for async processing
- **Caching**: Redis for session and data caching
- **Web Scraping**: Python with Puppeteer/Playwright

#### 2.2.3 Database Technologies
- **Primary Database**: PostgreSQL 15.0+
- **Database Provider**: Supabase (managed PostgreSQL)
- **Extensions**: uuid-ossp, pg_trgm, btree_gin, btree_gist
- **Full-text Search**: PostgreSQL native with Hebrew support

#### 2.2.4 Infrastructure
- **Container Orchestration**: Docker Compose (development), Kubernetes (production planned)
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus + Grafana
- **Tracing**: Jaeger for distributed tracing
- **CI/CD**: GitHub Actions (planned)

### 2.3 Monorepo Structure

```
spike-platform/
├── apps/
│   ├── web/                    # Main Next.js application
│   │   ├── app/                # App Router pages and API routes
│   │   ├── components/         # React components
│   │   ├── lib/               # Business logic and utilities
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript definitions
│   │   └── public/            # Static assets
│   │
│   └── scraper/               # Python scraping service
│       ├── src/
│       │   ├── auth/          # Authentication validators
│       │   ├── config/        # BGU configuration
│       │   └── validators/    # Data validators
│       └── main.py           # Entry point
│
├── packages/
│   ├── database/              # Shared database configuration
│   │   ├── init/             # Database initialization scripts
│   │   └── src/              # Database utilities
│   │
│   ├── shared/               # Shared types and utilities
│   │   └── src/
│   │
│   └── ui/                   # Shared UI components
│       └── src/
│
├── services/                  # Microservices (optional)
│   ├── auth-service/         # Authentication microservice
│   ├── tenant-service/       # Multi-tenancy management
│   ├── academic-service/     # Academic data management
│   └── sync-orchestrator/    # Synchronization orchestration
│
├── tests/                    # Test suites
│   ├── e2e/                 # End-to-end tests
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
│
├── scripts/                  # Build and deployment scripts
├── monitoring/              # Monitoring configuration
└── nginx/                   # API Gateway configuration
```

### 2.4 Design Patterns

#### 2.4.1 Architectural Patterns
- **Microservices Architecture**: Loosely coupled services for scalability
- **API Gateway Pattern**: Centralized entry point for all client requests
- **Event-Driven Architecture**: Asynchronous communication via message queues
- **Repository Pattern**: Data access abstraction
- **Service Layer Pattern**: Business logic encapsulation

#### 2.4.2 Design Principles
- **Domain-Driven Design (DDD)**: Clear domain boundaries and models
- **SOLID Principles**: Single responsibility, open/closed, etc.
- **12-Factor App**: Configuration, dependencies, and deployment best practices
- **Hebrew-First Development**: RTL and i18n considerations from the start

### 2.5 Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant Middleware
    participant API
    participant Database
    participant Moodle
    participant Cache

    User->>WebApp: Access Dashboard
    WebApp->>Middleware: Check Authentication
    Middleware->>WebApp: Auth Status

    alt Not Authenticated
        WebApp->>User: Redirect to Login
    else Authenticated
        WebApp->>API: Request User Data
        API->>Cache: Check Cache

        alt Cache Hit
            Cache->>API: Return Cached Data
        else Cache Miss
            API->>Database: Query Data
            Database->>API: Return Data
            API->>Cache: Store in Cache
        end

        API->>WebApp: Return Data
        WebApp->>User: Display Dashboard

        Note over API,Moodle: Background Sync
        API->>Moodle: Fetch Updates
        Moodle->>API: Course Data
        API->>Database: Update Records
    end
```

---

## 3. API Documentation

### 3.1 API Architecture

The Spike platform implements a RESTful API architecture with the following characteristics:

- **Version Management**: API versioning through URL paths (future: `/api/v1/`, `/api/v2/`)
- **Authentication**: JWT-based authentication with refresh tokens
- **Rate Limiting**: Configurable rate limits per endpoint
- **Response Format**: Consistent JSON response structure
- **Error Handling**: Standardized error codes and messages

### 3.2 Authentication Endpoints

#### 3.2.1 Google OAuth Initiation
```http
GET /api/auth/signin
```
Initiates Google OAuth flow for first-stage authentication.

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### 3.2.2 University Credentials Validation
```http
POST /api/auth/credentials/validate
```
Validates university credentials for second-stage authentication.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "universityId": "bgu",
  "googleUserId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "string",
    "email": "string",
    "universityId": "string",
    "isDualStageComplete": true
  }
}
```

#### 3.2.3 Session Status
```http
GET /api/auth/dual-stage/status
```
Checks current authentication stage completion status.

**Response:**
```json
{
  "authenticated": true,
  "stage": "dual-stage-complete",
  "user": {
    "email": "string",
    "hasGoogleAuth": true,
    "hasUniversityAuth": true
  }
}
```

### 3.3 Academic Data Endpoints

#### 3.3.1 Fetch User Courses
```http
GET /api/user/courses
```
Retrieves all courses for the authenticated user.

**Query Parameters:**
- `academicYear`: Filter by academic year (e.g., "2024")
- `semester`: Filter by semester ("א", "ב", "קיץ")
- `includeCompleted`: Include completed courses (boolean)

**Response:**
```json
{
  "courses": [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "credits": 3,
      "faculty": "string",
      "semester": "א",
      "academicYear": "2024",
      "instructor": "string",
      "enrollmentStatus": "active"
    }
  ],
  "total": 5
}
```

#### 3.3.2 Fetch Assignments
```http
GET /api/user/assignments
```
Retrieves assignments across all courses.

**Query Parameters:**
- `courseId`: Filter by course
- `status`: Filter by status (pending, submitted, graded)
- `dueDate`: Filter by due date range

**Response:**
```json
{
  "assignments": [
    {
      "id": "string",
      "courseId": "string",
      "title": "string",
      "description": "string",
      "dueDate": "2024-12-31T23:59:59Z",
      "status": "pending",
      "weight": 20,
      "submissionUrl": "string"
    }
  ],
  "statistics": {
    "pending": 3,
    "submitted": 5,
    "graded": 10
  }
}
```

### 3.4 Synchronization Endpoints

#### 3.4.1 Trigger Manual Sync
```http
POST /api/sync/trigger
```
Manually triggers Moodle synchronization.

**Request Body:**
```json
{
  "syncType": "full" | "incremental",
  "courses": ["courseId1", "courseId2"] // Optional: specific courses
}
```

**Response:**
```json
{
  "jobId": "string",
  "status": "queued",
  "estimatedTime": 30
}
```

#### 3.4.2 Check Sync Status
```http
GET /api/sync-status/{jobId}
```
Monitors synchronization job progress.

**Response:**
```json
{
  "jobId": "string",
  "status": "running",
  "progress": 65,
  "message": "Syncing course materials...",
  "completedTasks": 13,
  "totalTasks": 20
}
```

### 3.5 User Management Endpoints

#### 3.5.1 Get User Profile
```http
GET /api/users/{userId}
```
Retrieves user profile information.

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "studentId": "string",
  "faculty": "string",
  "department": "string",
  "yearOfStudy": 3,
  "avatarUrl": "string",
  "preferences": {
    "language": "he",
    "notifications": true,
    "theme": "light"
  }
}
```

#### 3.5.2 Update User Onboarding
```http
POST /api/user/onboarding
```
Updates user onboarding status and preferences.

**Request Body:**
```json
{
  "step": "university_selection" | "credentials" | "preferences" | "complete",
  "data": {
    "universityId": "string",
    "faculty": "string",
    "yearOfStudy": 3
  }
}
```

### 3.6 Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid username or password",
    "hebrewMessage": "שם משתמש או סיסמה שגויים",
    "details": {
      "field": "password",
      "requirement": "Must be at least 8 characters"
    }
  },
  "timestamp": "2024-12-31T23:59:59Z",
  "requestId": "req_abc123"
}
```

### 3.7 Rate Limiting

API endpoints implement rate limiting with the following defaults:

| Endpoint Type | Rate Limit | Window |
|--------------|------------|---------|
| Authentication | 10 requests | 15 minutes |
| Data Retrieval | 100 requests | 1 minute |
| Data Mutation | 30 requests | 1 minute |
| Sync Operations | 5 requests | 1 hour |

---

## 4. Database Schema

### 4.1 Database Architecture

The Spike platform uses PostgreSQL 15+ with Supabase as the managed database provider. The schema is designed for:

- **Multi-tenancy**: Support for multiple universities
- **Performance**: Optimized indexes and materialized views
- **Hebrew Support**: Full-text search with Hebrew language support
- **Security**: Row-Level Security (RLS) policies
- **Audit Trail**: Comprehensive logging of all changes

### 4.2 Core Tables

#### 4.2.1 Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    student_id VARCHAR(50),
    faculty VARCHAR(100),
    department VARCHAR(100),
    year_of_study INTEGER,
    avatar_url TEXT,
    university_id VARCHAR(50),
    is_setup_complete BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_university_id ON users(university_id);
```

#### 4.2.2 Courses Table
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_english VARCHAR(255),
    description TEXT,
    credits DECIMAL(3,1),
    faculty VARCHAR(100),
    department VARCHAR(100),
    semester VARCHAR(10),
    academic_year VARCHAR(10),
    instructor VARCHAR(255),
    moodle_course_id VARCHAR(50),
    syllabus_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code, academic_year, semester)
);

-- Indexes
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_faculty ON courses(faculty);
CREATE INDEX idx_courses_academic_year ON courses(academic_year);
CREATE INDEX idx_courses_name_fts ON courses
    USING gin(to_tsvector('hebrew', name));
```

#### 4.2.3 Assignments Table
```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    weight DECIMAL(5,2),
    max_grade DECIMAL(5,2) DEFAULT 100,
    status VARCHAR(20) DEFAULT 'PENDING',
    submission_type VARCHAR(50),
    submission_url TEXT,
    moodle_assignment_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status ON assignments(status);
```

#### 4.2.4 Course Enrollments Table
```sql
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    role VARCHAR(20) DEFAULT 'STUDENT',
    final_grade DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Indexes
CREATE INDEX idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_user_status ON course_enrollments(user_id, status);
```

#### 4.2.5 User Credentials Table
```sql
CREATE TABLE user_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL,
    university_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    encrypted_password TEXT NOT NULL,
    encryption_iv VARCHAR(32) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_validated_at TIMESTAMPTZ,
    validation_failures INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_email, university_id)
);

-- Indexes
CREATE INDEX idx_user_credentials_email ON user_credentials(user_email);
CREATE INDEX idx_user_credentials_active ON user_credentials(is_active);
```

### 4.3 Synchronization Tables

#### 4.3.1 Sync Jobs Table
```sql
CREATE TABLE sync_jobs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'starting',
    progress INTEGER DEFAULT 0,
    message TEXT,
    data JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_created_at ON sync_jobs(created_at);
```

#### 4.3.2 Sync History Table
```sql
CREATE TABLE sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    sync_type VARCHAR(50),
    items_synced INTEGER,
    items_updated INTEGER,
    items_failed INTEGER,
    duration_ms INTEGER,
    success BOOLEAN,
    error_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sync_history_user_id ON sync_history(user_id);
CREATE INDEX idx_sync_history_created_at ON sync_history(created_at DESC);
```

### 4.4 Security Tables

#### 4.4.1 Auth Attempts Table
```sql
CREATE TABLE auth_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_identifier VARCHAR(255),
    attempt_type VARCHAR(50),
    university_id VARCHAR(50),
    success BOOLEAN,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_auth_attempts_user ON auth_attempts(user_identifier);
CREATE INDEX idx_auth_attempts_created ON auth_attempts(created_at DESC);
```

#### 4.4.2 User Sessions Table
```sql
CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_type VARCHAR(50),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);
```

### 4.5 Row-Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can only view their own data
CREATE POLICY users_self_select ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_self_update ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can view courses they're enrolled in
CREATE POLICY courses_enrolled_select ON courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments
            WHERE course_enrollments.course_id = courses.id
            AND course_enrollments.user_id = auth.uid()
        )
    );

-- Users can view assignments for their courses
CREATE POLICY assignments_enrolled_select ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_enrollments
            WHERE course_enrollments.course_id = assignments.course_id
            AND course_enrollments.user_id = auth.uid()
        )
    );
```

### 4.6 Database Functions and Triggers

#### 4.6.1 Auto-update Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 4.6.2 Grade Calculation Function
```sql
CREATE OR REPLACE FUNCTION calculate_weighted_grade(
    p_user_id UUID,
    p_course_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_total_weight DECIMAL := 0;
    v_weighted_sum DECIMAL := 0;
BEGIN
    SELECT
        SUM(a.weight),
        SUM((g.grade / a.max_grade) * a.weight)
    INTO v_total_weight, v_weighted_sum
    FROM assignments a
    JOIN grades g ON g.assignment_id = a.id
    WHERE a.course_id = p_course_id
    AND g.user_id = p_user_id
    AND g.grade IS NOT NULL;

    IF v_total_weight > 0 THEN
        RETURN (v_weighted_sum / v_total_weight) * 100;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Authentication System

### 5.1 Multi-Stage Authentication Architecture

The Spike platform implements a sophisticated dual-stage authentication system that combines the security of OAuth with university-specific credentials.

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> GoogleAuth: Sign in with Google
    GoogleAuth --> GoogleAuthenticated: OAuth Success
    GoogleAuthenticated --> UniversityAuth: Enter BGU Credentials
    UniversityAuth --> ValidationPending: Validate with Moodle
    ValidationPending --> FullyAuthenticated: Validation Success
    ValidationPending --> UniversityAuth: Validation Failed
    FullyAuthenticated --> Dashboard: Access Granted

    FullyAuthenticated --> RevalidationNeeded: 30 days passed
    RevalidationNeeded --> UniversityAuth: Re-enter credentials

    FullyAuthenticated --> SignedOut: Sign Out
    SignedOut --> [*]
```

### 5.2 Authentication Flow Details

#### 5.2.1 Stage 1: Google OAuth
1. User initiates login from landing page
2. Redirect to Google OAuth consent screen
3. User authorizes application access
4. Google returns user profile with verified email
5. System validates email domain against university whitelist
6. Create or update user record in database
7. Issue JWT with `provider: 'google'` flag

#### 5.2.2 Stage 2: University Credentials
1. User prompted for university credentials
2. Credentials encrypted using AES-256-GCM
3. Validation against BGU Moodle API
4. On success:
   - Store encrypted credentials
   - Update user record with `is_setup_complete: true`
   - Issue new JWT with `isDualStageComplete: true`
   - Trigger background Moodle sync

### 5.3 Security Implementation

#### 5.3.1 Credential Encryption
```typescript
// Encryption implementation (simplified)
class CredentialsEncryption {
    private static algorithm = 'aes-256-gcm';
    private static keyLength = 32;

    static encryptCredentials(
        username: string,
        password: string
    ): EncryptedCredentials {
        const iv = crypto.randomBytes(16);
        const salt = crypto.randomBytes(64);
        const key = crypto.pbkdf2Sync(
            process.env.ENCRYPTION_KEY!,
            salt,
            100000,
            this.keyLength,
            'sha256'
        );

        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(password, 'utf8'),
            cipher.final()
        ]);

        return {
            encryptedPassword: encrypted.toString('hex'),
            iv: iv.toString('hex'),
            salt: salt.toString('hex'),
            authTag: cipher.getAuthTag().toString('hex')
        };
    }
}
```

#### 5.3.2 JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "student@post.bgu.ac.il",
  "name": "Student Name",
  "provider": "university-credentials",
  "googleId": "google-oauth-id",
  "universityId": "bgu",
  "universityName": "Ben-Gurion University",
  "isDualStageComplete": true,
  "credentialsValid": true,
  "lastValidation": "2024-12-01T00:00:00Z",
  "iat": 1701388800,
  "exp": 1703980800
}
```

### 5.4 Middleware Protection

The authentication middleware (`/apps/web/middleware.ts`) implements intelligent routing:

#### 5.4.1 Route Protection Matrix

| Route Pattern | No Auth | Google Only | Full Auth | Action |
|--------------|---------|-------------|-----------|--------|
| `/` (root) | ✅ | Redirect → `/dashboard` | Redirect → `/dashboard` | Show landing |
| `/auth/*` | ✅ | ✅ | Redirect → `/dashboard` | Process auth |
| `/onboarding` | Redirect → `/` | ✅ | Redirect → `/dashboard` | Show onboarding |
| `/dashboard` | Redirect → `/` | Redirect → `/onboarding` | ✅ | Show dashboard |
| `/api/*` | ✅ | ✅ | ✅ | Check per endpoint |

#### 5.4.2 Smart Redirect Logic
```typescript
// Simplified middleware logic
function determineSmartFlow(token: JWT | null): AuthFlow {
    if (!token) return 'no_auth';

    if (token.isDualStageComplete &&
        token.credentialsValid &&
        !needsRevalidation(token)) {
        return 'fully_authenticated';
    }

    if (token.isDualStageComplete &&
        needsRevalidation(token)) {
        return 'needs_revalidation';
    }

    if (token.provider === 'google' &&
        !token.isDualStageComplete) {
        return 'needs_university_auth';
    }

    return 'partial_auth';
}
```

### 5.5 Session Management

#### 5.5.1 Session Configuration
- **Token Type**: JWT (JSON Web Token)
- **Session Duration**: 30 days
- **Refresh Strategy**: Automatic on API calls
- **Storage**: HTTP-only secure cookies
- **CSRF Protection**: Double-submit cookie pattern

#### 5.5.2 Session Tracking
```sql
-- Active session monitoring
SELECT
    user_id,
    COUNT(*) as active_sessions,
    MAX(last_activity) as last_seen
FROM user_sessions
WHERE is_active = TRUE
AND expires_at > NOW()
GROUP BY user_id;
```

### 5.6 Hebrew Authentication Errors

The system provides localized error messages for Hebrew-speaking users:

```typescript
const HEBREW_AUTH_ERRORS = {
    InvalidCredentials: "שם משתמש או סיסמה שגויים",
    AccountLocked: "החשבון ננעל זמנית עקב ניסיונות כושלים",
    SessionExpired: "תוקף ההתחברות פג, אנא התחבר מחדש",
    UniversityNotSupported: "האוניברסיטה עדיין לא נתמכת במערכת",
    EmailNotVerified: "כתובת הדוא״ל טרם אומתה",
    NetworkError: "שגיאת רשת, אנא נסה שוב",
    MaintenanceMode: "המערכת בתחזוקה, נסה שוב מאוחר יותר"
};
```

---

## 6. Frontend Architecture

### 6.1 Next.js App Router Structure

The frontend uses Next.js 14's App Router with the following directory structure:

```
apps/web/app/
├── (auth)/                  # Authentication group
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx    # Sign-in page
│   │   ├── error/
│   │   │   └── page.tsx    # Auth error page
│   │   └── smart-redirect/
│   │       └── page.tsx    # Smart routing logic
│   └── onboarding/
│       └── page.tsx        # Onboarding flow
│
├── (dashboard)/            # Protected routes group
│   ├── dashboard/
│   │   ├── layout.tsx     # Dashboard layout
│   │   └── page.tsx       # Dashboard home
│   ├── courses/
│   │   └── [id]/
│   │       └── page.tsx   # Course details
│   └── assignments/
│       └── page.tsx       # Assignments list
│
├── api/                    # API routes
│   ├── auth/
│   ├── sync/
│   └── user/
│
├── layout.tsx             # Root layout
├── page.tsx               # Landing page
└── providers.tsx          # Client providers
```

### 6.2 Component Architecture

#### 6.2.1 Component Categories

```
components/
├── ui/                    # Base UI components (Radix UI wrappers)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── toast.tsx
│   └── ...
│
├── features/             # Feature-specific components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── CredentialsForm.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   └── CourseGrid.tsx
│   └── sync/
│       └── SyncStatus.tsx
│
├── layout/              # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
│
└── shared/              # Shared/common components
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── HebrewDatePicker.tsx
```

#### 6.2.2 Component Best Practices

1. **Server Components by Default**: Maximize server-side rendering
2. **Client Components When Needed**: For interactivity and browser APIs
3. **Composition Pattern**: Small, focused components
4. **Type Safety**: Full TypeScript coverage
5. **Hebrew-First Props**: RTL-aware prop names

### 6.3 State Management

#### 6.3.1 Client State (Zustand)
```typescript
// User store example
interface UserStore {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    setUser: (user: User) => void;
    clearUser: () => void;
    fetchUser: () => Promise<void>;
}

const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    isLoading: false,
    error: null,

    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),

    fetchUser: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/user/profile');
            const user = await response.json();
            set({ user, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    }
}));
```

#### 6.3.2 Server State (React Query)
```typescript
// Course data fetching
const useCourses = (filters?: CourseFilters) => {
    return useQuery({
        queryKey: ['courses', filters],
        queryFn: async () => {
            const params = new URLSearchParams(filters);
            const response = await fetch(`/api/user/courses?${params}`);
            if (!response.ok) throw new Error('Failed to fetch courses');
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
    });
};
```

### 6.4 Styling System

#### 6.4.1 Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
    content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                hebrew: ['Rubik', 'system-ui', 'sans-serif'],
            },
            animation: {
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
            },
        },
    },
    plugins: [
        require('tailwindcss-animate'),
        require('tailwindcss-rtl'),
    ],
};
```

#### 6.4.2 CSS Variables for Theming
```css
:root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --radius: 0.5rem;
}

[dir="rtl"] {
    --direction: rtl;
}
```

### 6.5 Routing and Navigation

#### 6.5.1 Dynamic Routes
```typescript
// app/courses/[id]/page.tsx
export default async function CoursePage({
    params
}: {
    params: { id: string }
}) {
    const course = await fetchCourse(params.id);

    return (
        <div className="container mx-auto p-4" dir="rtl">
            <h1 className="text-2xl font-bold mb-4">{course.name}</h1>
            <CourseContent course={course} />
        </div>
    );
}
```

#### 6.5.2 Navigation Component
```typescript
// components/layout/Navigation.tsx
export function Navigation() {
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'לוח בקרה', icon: HomeIcon },
        { href: '/courses', label: 'קורסים', icon: BookIcon },
        { href: '/assignments', label: 'מטלות', icon: TaskIcon },
        { href: '/grades', label: 'ציונים', icon: ChartIcon },
    ];

    return (
        <nav className="flex flex-col space-y-2">
            {navItems.map(item => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg",
                        pathname === item.href && "bg-primary text-primary-foreground"
                    )}
                >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}
```

### 6.6 Performance Optimizations

#### 6.6.1 Code Splitting
```typescript
// Lazy loading heavy components
const HeavyChart = dynamic(
    () => import('@/components/charts/GradeChart'),
    {
        loading: () => <ChartSkeleton />,
        ssr: false
    }
);
```

#### 6.6.2 Image Optimization
```typescript
// Using Next.js Image component
import Image from 'next/image';

<Image
    src={user.avatarUrl}
    alt={user.name}
    width={40}
    height={40}
    className="rounded-full"
    loading="lazy"
    placeholder="blur"
    blurDataURL={generateBlurDataURL()}
/>
```

#### 6.6.3 Prefetching
```typescript
// Prefetch data on hover
<Link
    href={`/courses/${course.id}`}
    prefetch={true}
    onMouseEnter={() => prefetchCourse(course.id)}
>
    {course.name}
</Link>
```

---

## 7. Hebrew/RTL Implementation

### 7.1 RTL Design Strategy

The Spike platform implements a comprehensive Hebrew-first design approach with full RTL (Right-to-Left) support throughout the application.

#### 7.1.1 Core Principles
1. **Hebrew as Primary Language**: All UI text defaults to Hebrew
2. **Logical Properties**: Use CSS logical properties instead of directional
3. **Mirrored Layouts**: UI layouts flip appropriately for RTL
4. **Cultural Considerations**: Date formats, number systems, and academic terminology

#### 7.1.2 Implementation Layers
```mermaid
graph TD
    A[HTML dir attribute] --> B[CSS Logical Properties]
    B --> C[Tailwind RTL Utilities]
    C --> D[Component RTL Logic]
    D --> E[Content Direction]
    E --> F[User Experience]
```

### 7.2 Technical Implementation

#### 7.2.1 HTML Direction
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
    return (
        <html lang="he" dir="rtl">
            <body className={cn(
                "min-h-screen bg-background font-hebrew antialiased",
                rubik.className
            )}>
                {children}
            </body>
        </html>
    );
}
```

#### 7.2.2 CSS Logical Properties
```css
/* Instead of margin-left/right */
.card {
    margin-inline-start: 1rem;  /* Becomes margin-right in RTL */
    margin-inline-end: 2rem;    /* Becomes margin-left in RTL */
}

/* Instead of padding-left/right */
.button {
    padding-inline-start: 1.5rem;
    padding-inline-end: 1.5rem;
}

/* Instead of left/right positioning */
.modal {
    inset-inline-start: 0;  /* Becomes right: 0 in RTL */
}

/* Border radius logical */
.card {
    border-start-start-radius: 0.5rem;  /* top-right in RTL */
    border-end-start-radius: 0.5rem;    /* bottom-right in RTL */
}
```

#### 7.2.3 Tailwind RTL Utilities
```typescript
// Custom Tailwind utilities for RTL
<div className="ms-4 me-2">  {/* margin-start, margin-end */}
    <button className="ps-6 pe-4">  {/* padding-start, padding-end */}
        <Icon className="rotate-180 rtl:rotate-0" />  {/* Conditional rotation */}
    </button>
</div>
```

### 7.3 Typography and Fonts

#### 7.3.1 Hebrew Font Stack
```css
@font-face {
    font-family: 'Rubik';
    src: url('/fonts/Rubik-Variable.woff2') format('woff2');
    font-weight: 300 900;
    font-display: swap;
    unicode-range: U+0590-05FF, U+FB00-FB4F; /* Hebrew range */
}

.font-hebrew {
    font-family: 'Rubik', 'Segoe UI', 'Arial Hebrew', 'Noto Sans Hebrew', sans-serif;
    font-feature-settings: 'liga' 1, 'calt' 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
```

#### 7.3.2 Mixed Content Handling
```typescript
// Component for mixed Hebrew/English content
export function MixedContent({ hebrew, english }: MixedContentProps) {
    return (
        <div className="space-y-1">
            <p className="text-lg font-medium" dir="rtl">
                {hebrew}
            </p>
            {english && (
                <p className="text-sm text-gray-600" dir="ltr">
                    {english}
                </p>
            )}
        </div>
    );
}
```

### 7.4 Form Components

#### 7.4.1 Hebrew Form Fields
```typescript
// Hebrew-aware form input
export function HebrewInput({
    label,
    placeholder,
    error,
    ...props
}: HebrewInputProps) {
    return (
        <div className="space-y-2">
            <Label className="text-right">{label}</Label>
            <Input
                dir="auto"  // Auto-detect direction
                placeholder={placeholder}
                className="text-right"
                {...props}
            />
            {error && (
                <p className="text-sm text-destructive text-right">
                    {error}
                </p>
            )}
        </div>
    );
}
```

#### 7.4.2 Hebrew Date Picker
```typescript
// Hebrew calendar integration
export function HebrewDatePicker({
    value,
    onChange
}: DatePickerProps) {
    const hebrewMonths = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל',
        'מאי', 'יוני', 'יולי', 'אוגוסט',
        'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];

    const hebrewDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

    return (
        <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            locale={he}
            dir="rtl"
            weekStartsOn={0}  // Sunday start
            formatters={{
                formatCaption: (date) => {
                    return `${hebrewMonths[date.getMonth()]} ${date.getFullYear()}`;
                }
            }}
        />
    );
}
```

### 7.5 Academic Terminology

#### 7.5.1 Translation Mappings
```typescript
const ACADEMIC_TERMS = {
    // Degree types
    bachelor: 'תואר ראשון',
    master: 'תואר שני',
    doctorate: 'דוקטורט',

    // Semesters
    fall: 'סמסטר א׳',
    spring: 'סמסטר ב׳',
    summer: 'סמסטר קיץ',

    // Course status
    active: 'פעיל',
    completed: 'הושלם',
    dropped: 'נטישה',

    // Assignment status
    pending: 'ממתין',
    submitted: 'הוגש',
    graded: 'נבדק',
    overdue: 'באיחור',

    // Grades
    pass: 'עובר',
    fail: 'נכשל',
    incomplete: 'לא הושלם',

    // Academic roles
    student: 'סטודנט',
    lecturer: 'מרצה',
    assistant: 'מתרגל',
    coordinator: 'רכז',
};
```

#### 7.5.2 Number Formatting
```typescript
// Hebrew number formatting
export function formatHebrewNumber(
    value: number,
    type: 'grade' | 'credits' | 'year'
): string {
    switch(type) {
        case 'grade':
            return value.toLocaleString('he-IL', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1
            });
        case 'credits':
            return `${value} נ״ז`;  // נקודות זכות
        case 'year':
            const yearMap = ['א׳', 'ב׳', 'ג׳', 'ד׳'];
            return `שנה ${yearMap[value - 1] || value}`;
        default:
            return value.toString();
    }
}
```

### 7.6 Icons and Directional Elements

#### 7.6.1 Directional Icons
```typescript
// RTL-aware icon component
export function DirectionalIcon({
    name,
    className
}: DirectionalIconProps) {
    const rtlIcons = {
        'chevron-left': 'chevron-right',
        'chevron-right': 'chevron-left',
        'arrow-left': 'arrow-right',
        'arrow-right': 'arrow-left',
        'corner-up-left': 'corner-up-right',
        'corner-up-right': 'corner-up-left'
    };

    const iconName = rtlIcons[name] || name;
    const Icon = Icons[iconName];

    return <Icon className={className} />;
}
```

#### 7.6.2 Progress Indicators
```typescript
// RTL progress bar
export function HebrewProgress({ value, max = 100 }) {
    const percentage = (value / max) * 100;

    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5" dir="ltr">
            <div
                className="bg-primary h-2.5 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
                dir="rtl"
            />
        </div>
    );
}
```

### 7.7 Testing Hebrew/RTL

#### 7.7.1 RTL Testing Utilities
```typescript
// Test utilities for RTL
export const rtlTestUtils = {
    // Check if element has correct direction
    expectRTL: (element: HTMLElement) => {
        expect(element).toHaveAttribute('dir', 'rtl');
        expect(getComputedStyle(element).direction).toBe('rtl');
    },

    // Check logical properties
    expectLogicalMargin: (element: HTMLElement, start: string, end: string) => {
        const styles = getComputedStyle(element);
        expect(styles.marginInlineStart).toBe(start);
        expect(styles.marginInlineEnd).toBe(end);
    },

    // Check Hebrew content
    expectHebrewText: (element: HTMLElement, text: string) => {
        expect(element.textContent).toContain(text);
        expect(element.lang).toBe('he');
    }
};
```

#### 7.7.2 Visual Regression Tests
```typescript
// Playwright test for RTL layout
test('Hebrew dashboard displays correctly', async ({ page }) => {
    await page.goto('/dashboard');

    // Check RTL direction
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Check Hebrew content
    await expect(page.locator('h1')).toContainText('לוח בקרה');

    // Visual regression
    await expect(page).toHaveScreenshot('dashboard-hebrew.png');
});
```

---

## 8. BGU Moodle Integration

### 8.1 Integration Architecture

The BGU Moodle integration is a critical component that synchronizes academic data between BGU's Moodle LMS and the Spike platform.

```mermaid
graph TB
    subgraph "Spike Platform"
        API[Sync API]
        SCRAPER[Python Scraper]
        QUEUE[Job Queue]
        DB[(Database)]
    end

    subgraph "BGU Systems"
        MOODLE[Moodle LMS]
        AUTH[BGU Auth]
    end

    API --> QUEUE
    QUEUE --> SCRAPER
    SCRAPER --> AUTH
    AUTH --> MOODLE
    MOODLE --> SCRAPER
    SCRAPER --> DB
    DB --> API
```

### 8.2 Scraping Service Implementation

#### 8.2.1 Python Scraper Architecture
```python
# apps/scraper/main.py structure
class BGUMoodleScraper:
    def __init__(self):
        self.session = None
        self.browser = None
        self.config = BGUConfig()

    async def authenticate(self, username: str, password: str) -> bool:
        """Authenticate with BGU Moodle"""
        # Implementation details

    async def fetch_courses(self) -> List[Course]:
        """Fetch user's enrolled courses"""
        # Implementation details

    async def fetch_assignments(self, course_id: str) -> List[Assignment]:
        """Fetch assignments for a course"""
        # Implementation details

    async def sync_all_data(self) -> SyncResult:
        """Complete synchronization process"""
        # Implementation details
```

#### 8.2.2 BGU Configuration
```python
# apps/scraper/src/config/bgu_config_updated.py
BGU_CONFIG = {
    "urls": {
        "login": "https://moodle2.bgu.ac.il/moodle/login/index.php",
        "dashboard": "https://moodle2.bgu.ac.il/moodle/my/",
        "courses": "https://moodle2.bgu.ac.il/moodle/course/view.php",
        "api_base": "https://moodle2.bgu.ac.il/moodle/webservice/rest/server.php"
    },
    "selectors": {
        "username_field": "#username",
        "password_field": "#password",
        "login_button": "#loginbtn",
        "course_list": ".course-listitem",
        "assignment_list": ".activity.assign"
    },
    "timeouts": {
        "page_load": 30000,
        "element_wait": 10000,
        "api_request": 15000
    }
}
```

### 8.3 Data Synchronization Process

#### 8.3.1 Sync Flow Diagram
```mermaid
sequenceDiagram
    participant User
    participant API
    participant Queue
    participant Scraper
    participant Moodle
    participant DB

    User->>API: Trigger Sync
    API->>Queue: Create Job
    Queue->>Scraper: Process Job

    Scraper->>Moodle: Authenticate
    Moodle-->>Scraper: Session Token

    loop For Each Course
        Scraper->>Moodle: Fetch Course Data
        Moodle-->>Scraper: Course Details
        Scraper->>Moodle: Fetch Assignments
        Moodle-->>Scraper: Assignment List
        Scraper->>DB: Update Records
    end

    Scraper->>Queue: Update Job Status
    Queue->>API: Job Complete
    API->>User: Sync Complete
```

#### 8.3.2 Data Mapping
```typescript
// Moodle to Spike data mapping
interface MoodleToSpikeMapper {
    mapCourse(moodleCourse: MoodleCourse): Course {
        return {
            id: generateUUID(),
            moodle_course_id: moodleCourse.id,
            code: extractCourseCode(moodleCourse.shortname),
            name: moodleCourse.fullname,
            credits: extractCredits(moodleCourse.summary),
            semester: detectSemester(moodleCourse.startdate),
            academic_year: extractAcademicYear(moodleCourse.startdate),
            instructor: moodleCourse.teachers?.[0]?.fullname,
            faculty: detectFaculty(moodleCourse.category),
            syllabus_url: moodleCourse.syllabusUrl,
            updated_at: new Date()
        };
    }

    mapAssignment(moodleAssignment: MoodleAssignment): Assignment {
        return {
            id: generateUUID(),
            moodle_assignment_id: moodleAssignment.id,
            title: moodleAssignment.name,
            description: stripHTML(moodleAssignment.intro),
            due_date: new Date(moodleAssignment.duedate * 1000),
            weight: moodleAssignment.grade?.weight || 0,
            max_grade: moodleAssignment.grade?.grademax || 100,
            submission_type: detectSubmissionType(moodleAssignment.submissiontype),
            status: calculateAssignmentStatus(moodleAssignment),
            updated_at: new Date()
        };
    }
}
```

### 8.4 Background Synchronization

#### 8.4.1 Sync Job Management
```typescript
// lib/background-sync.ts
export async function startBackgroundSync(
    userId: string,
    credentials: UniversityCredentials
): Promise<SyncJob> {
    const jobId = `sync_${userId}_${Date.now()}`;

    // Create job record
    const job = await createSyncJob({
        id: jobId,
        user_id: userId,
        status: 'queued',
        progress: 0,
        message: 'Initializing synchronization...'
    });

    // Queue async job
    await queueSyncTask({
        jobId,
        userId,
        credentials,
        syncType: 'full'
    });

    return job;
}
```

#### 8.4.2 Progressive Sync Updates
```typescript
// Real-time sync progress updates
class SyncProgressTracker {
    private progress: number = 0;
    private total: number = 0;

    async updateProgress(
        jobId: string,
        completed: number,
        total: number,
        message: string
    ) {
        this.progress = completed;
        this.total = total;

        await updateSyncJob(jobId, {
            progress: Math.round((completed / total) * 100),
            message,
            data: {
                completed_tasks: completed,
                total_tasks: total
            }
        });

        // Emit websocket event for real-time updates
        await emitSyncProgress(jobId, {
            progress: this.progress,
            total: this.total,
            message
        });
    }
}
```

### 8.5 Error Handling and Recovery

#### 8.5.1 Retry Logic
```python
# Retry decorator for network operations
def retry_on_failure(max_retries=3, delay=1):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return await func(*args, **kwargs)
                except (NetworkError, TimeoutError) as e:
                    retries += 1
                    if retries == max_retries:
                        raise e
                    await asyncio.sleep(delay * retries)
            return None
        return wrapper
    return decorator

@retry_on_failure(max_retries=3, delay=2)
async def fetch_with_retry(url: str):
    # Fetch implementation
```

#### 8.5.2 Error Recovery
```typescript
// Graceful error recovery
export async function recoverFailedSync(
    jobId: string,
    lastSuccessfulItem?: string
): Promise<void> {
    const job = await getSyncJob(jobId);

    if (job.status !== 'failed') {
        throw new Error('Job is not in failed state');
    }

    // Resume from last successful item
    const resumePoint = lastSuccessfulItem ||
        job.data?.last_successful_item ||
        null;

    await updateSyncJob(jobId, {
        status: 'recovering',
        message: 'Attempting to recover sync...'
    });

    // Re-queue with resume point
    await queueSyncTask({
        jobId,
        userId: job.user_id,
        syncType: 'recovery',
        resumeFrom: resumePoint
    });
}
```

### 8.6 Data Validation

#### 8.6.1 Moodle Data Validators
```python
# apps/scraper/src/validators/dev_real_validator.py
class MoodleDataValidator:
    @staticmethod
    def validate_course(course_data: dict) -> bool:
        """Validate course data from Moodle"""
        required_fields = ['id', 'fullname', 'shortname']

        for field in required_fields:
            if field not in course_data or not course_data[field]:
                return False

        # Validate Hebrew content
        if not HebrewValidator.contains_hebrew(course_data['fullname']):
            logger.warning(f"Course name not in Hebrew: {course_data['fullname']}")

        return True

    @staticmethod
    def validate_assignment(assignment_data: dict) -> bool:
        """Validate assignment data"""
        if not assignment_data.get('name'):
            return False

        # Validate due date
        if assignment_data.get('duedate'):
            due_date = datetime.fromtimestamp(assignment_data['duedate'])
            if due_date < datetime.now():
                assignment_data['status'] = 'overdue'

        return True
```

#### 8.6.2 Data Integrity Checks
```sql
-- Verify sync data integrity
WITH sync_summary AS (
    SELECT
        user_id,
        COUNT(DISTINCT course_id) as courses_synced,
        COUNT(DISTINCT assignment_id) as assignments_synced,
        MAX(last_sync_at) as last_sync,
        SUM(CASE WHEN sync_error IS NOT NULL THEN 1 ELSE 0 END) as error_count
    FROM sync_logs
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY user_id
)
SELECT
    u.email,
    s.courses_synced,
    s.assignments_synced,
    s.last_sync,
    s.error_count,
    CASE
        WHEN s.error_count > 5 THEN 'Critical'
        WHEN s.error_count > 0 THEN 'Warning'
        ELSE 'Healthy'
    END as sync_health
FROM users u
JOIN sync_summary s ON u.id = s.user_id
ORDER BY s.error_count DESC;
```

---

## 9. Testing Strategy

### 9.1 Testing Architecture

The Spike platform implements a comprehensive testing strategy across multiple levels:

```mermaid
graph TD
    subgraph "Testing Pyramid"
        E2E[E2E Tests - Playwright]
        INTEGRATION[Integration Tests]
        UNIT[Unit Tests - Vitest]
    end

    subgraph "Specialized Tests"
        HEBREW[Hebrew/RTL Tests]
        AUTH[Authentication Tests]
        PERF[Performance Tests]
        A11Y[Accessibility Tests]
    end

    UNIT --> INTEGRATION
    INTEGRATION --> E2E
    E2E --> HEBREW
    E2E --> AUTH
    E2E --> PERF
    E2E --> A11Y
```

### 9.2 Unit Testing

#### 9.2.1 Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'tests/', '*.config.*']
        },
        include: ['**/*.{test,spec}.{js,ts,jsx,tsx}']
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './apps/web'),
            '@/lib': path.resolve(__dirname, './apps/web/lib'),
            '@/components': path.resolve(__dirname, './apps/web/components')
        }
    }
});
```

#### 9.2.2 Unit Test Examples
```typescript
// tests/unit/auth-utils.test.ts
describe('Authentication Utilities', () => {
    describe('validateUniversityEmail', () => {
        it('should accept valid BGU email', () => {
            const result = validateUniversityEmail('student@post.bgu.ac.il');
            expect(result.isValid).toBe(true);
            expect(result.university?.id).toBe('bgu');
        });

        it('should reject non-university email', () => {
            const result = validateUniversityEmail('user@gmail.com');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Email domain not recognized');
        });
    });

    describe('encryptCredentials', () => {
        it('should encrypt and decrypt credentials correctly', () => {
            const original = { username: 'user', password: 'pass123' };
            const encrypted = CredentialsEncryption.encryptCredentials(
                original.username,
                original.password
            );

            expect(encrypted.encryptedPassword).toBeDefined();
            expect(encrypted.iv).toBeDefined();

            const decrypted = CredentialsEncryption.decryptCredentials(
                encrypted
            );
            expect(decrypted.password).toBe(original.password);
        });
    });
});
```

### 9.3 Integration Testing

#### 9.3.1 API Integration Tests
```typescript
// tests/integration/api-sync.test.ts
describe('Sync API Integration', () => {
    let testUser: User;
    let authToken: string;

    beforeEach(async () => {
        testUser = await createTestUser();
        authToken = await getAuthToken(testUser);
    });

    it('should trigger sync and track progress', async () => {
        const response = await fetch('/api/sync/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ syncType: 'full' })
        });

        expect(response.status).toBe(200);
        const { jobId } = await response.json();

        // Poll for completion
        let status = 'running';
        while (status === 'running') {
            const statusResponse = await fetch(`/api/sync-status/${jobId}`);
            const jobStatus = await statusResponse.json();
            status = jobStatus.status;
            await sleep(1000);
        }

        expect(status).toBe('completed');
    });
});
```

### 9.4 End-to-End Testing

#### 9.4.1 Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure'
    },
    projects: [
        {
            name: 'Desktop Chrome',
            use: { ...devices['Desktop Chrome'] }
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] }
        },
        {
            name: 'Hebrew RTL Desktop',
            use: {
                ...devices['Desktop Chrome'],
                locale: 'he-IL',
                timezoneId: 'Asia/Jerusalem'
            }
        }
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI
    }
});
```

#### 9.4.2 E2E Test Scenarios
```typescript
// tests/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('complete dual-stage authentication', async ({ page }) => {
        // Stage 1: Google OAuth
        await page.goto('/');
        await page.click('text=התחבר עם Google');

        // Handle Google OAuth (mocked in test environment)
        await page.fill('#email', 'test@post.bgu.ac.il');
        await page.fill('#password', 'testpass');
        await page.click('#submit');

        // Should redirect to onboarding
        await expect(page).toHaveURL('/onboarding');

        // Stage 2: University credentials
        await page.fill('#username', 'testuser');
        await page.fill('#password', 'univpass');
        await page.click('text=המשך');

        // Wait for validation
        await page.waitForSelector('text=מאמת נתונים');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('h1')).toContainText('לוח בקרה');
    });
});
```

### 9.5 Hebrew/RTL Testing

#### 9.5.1 Hebrew Content Tests
```typescript
// tests/e2e/hebrew-content.spec.ts
test.describe('Hebrew Content and RTL Layout', () => {
    test('displays Hebrew content correctly', async ({ page }) => {
        await page.goto('/dashboard');

        // Check RTL direction
        const html = page.locator('html');
        await expect(html).toHaveAttribute('dir', 'rtl');
        await expect(html).toHaveAttribute('lang', 'he');

        // Verify Hebrew text rendering
        const heading = page.locator('h1');
        await expect(heading).toContainText('לוח בקרה');

        // Check Hebrew date format
        const dateElement = page.locator('.date-display');
        await expect(dateElement).toContainText(/\d{1,2} ב[א-ת]+ \d{4}/);
    });

    test('form inputs handle Hebrew correctly', async ({ page }) => {
        await page.goto('/profile');

        const nameInput = page.locator('#name');
        await nameInput.fill('ישראל ישראלי');

        // Verify RTL text alignment
        const styles = await nameInput.evaluate(el =>
            window.getComputedStyle(el)
        );
        expect(styles.direction).toBe('rtl');
        expect(styles.textAlign).toBe('right');
    });
});
```

### 9.6 Performance Testing

#### 9.6.1 Load Time Tests
```typescript
// tests/performance/load-time.spec.ts
test.describe('Performance Metrics', () => {
    test('dashboard loads within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/dashboard', { waitUntil: 'networkidle' });

        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(3000); // 3 seconds max

        // Check Core Web Vitals
        const metrics = await page.evaluate(() => ({
            FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
            LCP: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime,
            CLS: performance.getEntriesByName('layout-shift')[0]?.value || 0
        }));

        expect(metrics.FCP).toBeLessThan(1800); // 1.8s
        expect(metrics.LCP).toBeLessThan(2500); // 2.5s
        expect(metrics.CLS).toBeLessThan(0.1);  // 0.1
    });
});
```

### 9.7 Accessibility Testing

#### 9.7.1 WCAG Compliance Tests
```typescript
// tests/a11y/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Compliance', () => {
    test('dashboard meets WCAG 2.1 AA standards', async ({ page }) => {
        await page.goto('/dashboard');
        await injectAxe(page);

        await checkA11y(page, null, {
            detailedReport: true,
            detailedReportOptions: {
                html: true
            }
        });
    });

    test('keyboard navigation works correctly', async ({ page }) => {
        await page.goto('/dashboard');

        // Tab through interactive elements
        await page.keyboard.press('Tab');
        const firstFocus = await page.evaluate(() =>
            document.activeElement?.tagName
        );
        expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocus);

        // Test skip links
        await page.keyboard.press('Tab');
        const skipLink = page.locator('text=דלג לתוכן הראשי');
        await expect(skipLink).toBeFocused();
    });
});
```

### 9.8 Test Data Management

#### 9.8.1 Test Data Factories
```typescript
// tests/factories/user.factory.ts
export class UserFactory {
    static create(overrides?: Partial<User>): User {
        return {
            id: faker.datatype.uuid(),
            email: `test-${faker.datatype.number()}@post.bgu.ac.il`,
            name: faker.name.findName(),
            student_id: faker.datatype.number({ min: 100000, max: 999999 }).toString(),
            faculty: 'מדעי הטבע',
            department: 'מדעי המחשב',
            year_of_study: faker.datatype.number({ min: 1, max: 4 }),
            ...overrides
        };
    }

    static createWithCourses(courseCount: number = 5): UserWithCourses {
        const user = this.create();
        const courses = CourseFactory.createMany(courseCount);

        return {
            ...user,
            courses,
            enrollments: courses.map(course =>
                EnrollmentFactory.create({ user_id: user.id, course_id: course.id })
            )
        };
    }
}
```

### 9.9 Continuous Integration Tests

#### 9.9.1 GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## 10. Deployment Guide

### 10.1 Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV_LOCAL[Local Development]
        DEV_DOCKER[Docker Compose]
    end

    subgraph "Staging"
        STAGE_K8S[Kubernetes Staging]
        STAGE_DB[(Staging DB)]
    end

    subgraph "Production"
        PROD_LB[Load Balancer]
        PROD_APP1[App Instance 1]
        PROD_APP2[App Instance 2]
        PROD_DB[(Production DB)]
        PROD_REDIS[(Redis Cluster)]
    end

    DEV_LOCAL --> DEV_DOCKER
    DEV_DOCKER --> STAGE_K8S
    STAGE_K8S --> PROD_LB
    PROD_LB --> PROD_APP1
    PROD_LB --> PROD_APP2
    PROD_APP1 --> PROD_DB
    PROD_APP2 --> PROD_DB
    PROD_APP1 --> PROD_REDIS
    PROD_APP2 --> PROD_REDIS
```

### 10.2 Environment Configuration

#### 10.2.1 Environment Variables
```bash
# .env.production
# Application
NODE_ENV=production
APP_URL=https://spike.bgu.ac.il
PORT=3000

# Authentication
NEXTAUTH_URL=https://spike.bgu.ac.il
NEXTAUTH_SECRET=<generated-secret>
AUTH_SECRET=<auth-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>

# Database
DATABASE_URL=postgresql://user:pass@host:5432/spike_prod
DATABASE_POOL_SIZE=20

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Redis
REDIS_URL=redis://user:pass@host:6379

# Encryption
ENCRYPTION_KEY=<32-character-key>
ENCRYPTION_SALT=<generated-salt>

# Monitoring
SENTRY_DSN=https://<key>@sentry.io/<project>
NEW_RELIC_LICENSE_KEY=<license-key>

# Feature Flags
ENABLE_SYNC=true
ENABLE_NOTIFICATIONS=true
MAINTENANCE_MODE=false
```

### 10.3 Docker Deployment

#### 10.3.1 Production Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/

RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 10.4 Kubernetes Deployment

#### 10.4.1 Kubernetes Manifests
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spike-web
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: spike-web
  template:
    metadata:
      labels:
        app: spike-web
    spec:
      containers:
      - name: spike-web
        image: spike/web:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: spike-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: spike-web-service
  namespace: production
spec:
  selector:
    app: spike-web
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 10.5 Database Migration

#### 10.5.1 Migration Strategy
```bash
#!/bin/bash
# scripts/migrate-production.sh

# Backup current database
echo "Creating database backup..."
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
echo "Running migrations..."
npx prisma migrate deploy

# Verify migration
echo "Verifying migration..."
psql $DATABASE_URL -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;"

echo "Migration complete!"
```

### 10.6 CI/CD Pipeline

#### 10.6.1 GitHub Actions Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Build Docker image
        run: |
          docker build -t spike/web:${{ github.sha }} .
          docker tag spike/web:${{ github.sha }} spike/web:latest

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push spike/web:${{ github.sha }}
          docker push spike/web:latest

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/spike-web spike-web=spike/web:${{ github.sha }} -n production
          kubectl rollout status deployment/spike-web -n production
```

### 10.7 Monitoring and Observability

#### 10.7.1 Monitoring Stack Configuration
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=redis-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"

  jaeger:
    image: jaegertracing/all-in-one:latest
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "16686:16686"
      - "4317:4317"

volumes:
  prometheus_data:
  grafana_data:
```

### 10.8 Backup and Recovery

#### 10.8.1 Automated Backup Script
```bash
#!/bin/bash
# scripts/backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
S3_BUCKET="spike-backups"

# Database backup
echo "Backing up database..."
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Upload to S3
echo "Uploading to S3..."
aws s3 cp $BACKUP_DIR/db_$TIMESTAMP.sql.gz s3://$S3_BUCKET/database/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup complete!"
```

### 10.9 SSL/TLS Configuration

#### 10.9.1 Nginx SSL Configuration
```nginx
# nginx/sites-available/spike
server {
    listen 80;
    server_name spike.bgu.ac.il;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name spike.bgu.ac.il;

    ssl_certificate /etc/letsencrypt/live/spike.bgu.ac.il/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/spike.bgu.ac.il/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 11. Development Workflow

### 11.1 Git Workflow

#### 11.1.1 Branch Strategy
```mermaid
gitGraph
    commit
    branch develop
    checkout develop
    commit
    branch feature/auth
    checkout feature/auth
    commit
    commit
    checkout develop
    merge feature/auth
    branch feature/dashboard
    checkout feature/dashboard
    commit
    checkout develop
    merge feature/dashboard
    checkout main
    merge develop tag: "v0.1.0"
    checkout develop
    branch hotfix/security
    checkout hotfix/security
    commit
    checkout main
    merge hotfix/security tag: "v0.1.1"
    checkout develop
    merge hotfix/security
```

#### 11.1.2 Commit Convention
```bash
# Format: <type>(<scope>): <subject>

# Types:
feat: New feature
fix: Bug fix
docs: Documentation only
style: Code style changes
refactor: Code refactor
perf: Performance improvement
test: Test additions/changes
chore: Build/tooling changes

# Examples:
feat(auth): implement dual-stage authentication
fix(sync): resolve Hebrew content encoding issue
docs(api): update endpoint documentation
style(dashboard): apply RTL styles to cards
refactor(db): optimize query performance
test(auth): add integration tests for login flow
```

### 11.2 Code Review Process

#### 11.2.1 Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Hebrew/RTL tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No console.logs or debug code
- [ ] Hebrew translations added

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
```

### 11.3 Development Environment Setup

#### 11.3.1 Initial Setup Script
```bash
#!/bin/bash
# scripts/setup-dev.sh

echo "Setting up Spike development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }

# Install dependencies
echo "Installing dependencies..."
npm install

# Setup environment
echo "Setting up environment..."
cp .env.example .env.local
echo "Please update .env.local with your credentials"

# Start services
echo "Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services
sleep 5

# Setup database
echo "Setting up database..."
npm run db:push
npm run db:seed

echo "Development environment ready!"
echo "Run 'npm run dev' to start the application"
```

### 11.4 Code Standards

#### 11.4.1 TypeScript Guidelines
```typescript
// ✅ GOOD: Use interfaces for objects
interface User {
    id: string;
    email: string;
    name: string;
}

// ❌ BAD: Avoid type for objects
type User = {
    id: string;
    email: string;
    name: string;
}

// ✅ GOOD: Use explicit return types
function calculateGrade(score: number, max: number): number {
    return (score / max) * 100;
}

// ✅ GOOD: Use proper error handling
async function fetchData(): Promise<Result<Data, Error>> {
    try {
        const data = await api.getData();
        return { success: true, data };
    } catch (error) {
        return { success: false, error };
    }
}
```

#### 11.4.2 React Component Guidelines
```typescript
// ✅ GOOD: Typed props with interface
interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
}

export function Button({
    children,
    onClick,
    variant = 'primary',
    disabled = false
}: ButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "px-4 py-2 rounded-lg",
                variant === 'primary' && "bg-primary text-white",
                variant === 'secondary' && "bg-secondary text-black"
            )}
        >
            {children}
        </button>
    );
}
```

### 11.5 Debugging Tools

#### 11.5.1 Debug Configuration
```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Next.js: debug server",
            "type": "node",
            "request": "launch",
            "runtimeExecutable": "npm",
            "runtimeArgs": ["run", "dev"],
            "port": 9229,
            "env": {
                "NODE_OPTIONS": "--inspect"
            }
        },
        {
            "name": "Next.js: debug client",
            "type": "chrome",
            "request": "launch",
            "url": "http://localhost:3000",
            "webRoot": "${workspaceFolder}/apps/web"
        }
    ]
}
```

---

## 12. Security Documentation

### 12.1 Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        WAF[Web Application Firewall]
        SSL[SSL/TLS Encryption]
        AUTH[Authentication Layer]
        AUTHZ[Authorization Layer]
        ENCRYPT[Data Encryption]
        AUDIT[Audit Logging]
    end

    USER[User] --> WAF
    WAF --> SSL
    SSL --> AUTH
    AUTH --> AUTHZ
    AUTHZ --> APP[Application]
    APP --> ENCRYPT
    ENCRYPT --> DB[(Database)]
    APP --> AUDIT
```

### 12.2 Authentication Security

#### 12.2.1 Password Security
- Passwords encrypted using AES-256-GCM
- PBKDF2 with 100,000 iterations for key derivation
- Unique salt per credential
- Passwords never stored in plain text
- Automatic credential expiration after 30 days

#### 12.2.2 Session Security
```typescript
// Session configuration
const sessionConfig = {
    secret: process.env.AUTH_SECRET,
    cookie: {
        httpOnly: true,
        secure: true, // HTTPS only
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
    rolling: true, // Reset expiry on activity
};
```

### 12.3 Data Protection

#### 12.3.1 Encryption at Rest
- Database encryption using Supabase's built-in encryption
- Sensitive fields encrypted at application level
- Encryption keys rotated quarterly

#### 12.3.2 Encryption in Transit
- All traffic over HTTPS (TLS 1.2+)
- Certificate pinning for mobile apps (future)
- Secure WebSocket connections for real-time updates

### 12.4 Access Control

#### 12.4.1 Row-Level Security
```sql
-- Example RLS policy
CREATE POLICY "users_own_data" ON user_data
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
```

#### 12.4.2 API Rate Limiting
```typescript
const rateLimiter = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
};
```

### 12.5 Security Headers

```typescript
// Security headers configuration
const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    },
    {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin'
    },
    {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
    }
];
```

### 12.6 Compliance

#### 12.6.1 GDPR Compliance
- User consent for data processing
- Right to data portability
- Right to deletion
- Data minimization principles

#### 12.6.2 Israeli Privacy Protection
- Compliance with Israeli Privacy Protection Law
- Data residency in approved regions
- Notification of data breaches within 72 hours

---

## 13. Performance Optimization

### 13.1 Frontend Optimization

#### 13.1.1 Code Splitting
```typescript
// Dynamic imports for route-based splitting
const DashboardCharts = dynamic(
    () => import('@/components/dashboard/Charts'),
    {
        loading: () => <ChartSkeleton />,
        ssr: false
    }
);
```

#### 13.1.2 Image Optimization
- Next.js Image component with automatic optimization
- WebP format with fallbacks
- Lazy loading by default
- Responsive images with srcset

### 13.2 Database Optimization

#### 13.2.1 Query Optimization
```sql
-- Optimized query with proper indexing
CREATE INDEX CONCURRENTLY idx_assignments_user_course_date
ON assignments(user_id, course_id, due_date DESC)
WHERE status != 'completed';
```

#### 13.2.2 Connection Pooling
```typescript
const poolConfig = {
    min: 2,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
```

### 13.3 Caching Strategy

#### 13.3.1 Redis Caching
```typescript
// Cache implementation
class CacheService {
    async get<T>(key: string): Promise<T | null> {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }

    async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
        await redis.setex(key, ttl, JSON.stringify(value));
    }
}
```

#### 13.3.2 CDN Configuration
- Static assets served from CDN
- Edge caching for API responses
- Geographic distribution for Israeli users

### 13.4 Bundle Size Optimization

```javascript
// next.config.js
module.exports = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                '@sentry/node': '@sentry/browser'
            };
        }
        return config;
    },
    experimental: {
        optimizeCss: true,
        optimizePackageImports: ['@radix-ui/*']
    }
};
```

---

## 14. Troubleshooting Guide

### 14.1 Common Issues

#### 14.1.1 Authentication Issues

**Problem**: User cannot complete dual-stage authentication
```bash
# Debug steps:
1. Check browser console for errors
2. Verify credentials in database:
   SELECT * FROM user_credentials WHERE user_email = 'user@email.com';
3. Check auth logs:
   SELECT * FROM auth_attempts WHERE user_identifier = 'user@email.com' ORDER BY created_at DESC;
4. Test Moodle connectivity:
   curl -X POST https://moodle2.bgu.ac.il/moodle/login/index.php
```

**Solution**:
```typescript
// Clear user session and retry
await clearUserSession(userId);
await invalidateCredentials(userId);
// User must re-authenticate
```

#### 14.1.2 Sync Failures

**Problem**: Moodle sync fails repeatedly
```sql
-- Check sync job status
SELECT * FROM sync_jobs
WHERE user_id = 'user-id'
AND status = 'failed'
ORDER BY created_at DESC;
```

**Solution**:
```bash
# Manual sync trigger
npm run sync:manual -- --user-id=<user-id> --debug
```

#### 14.1.3 Hebrew Display Issues

**Problem**: Hebrew text appears as question marks or boxes
```css
/* Ensure proper font loading */
@font-face {
    font-family: 'Rubik';
    src: url('/fonts/Rubik-Variable.woff2') format('woff2');
    font-display: swap;
    unicode-range: U+0590-05FF;
}
```

### 14.2 Debug Commands

```bash
# Server health check
curl http://localhost:3000/api/health

# Database connection test
npm run db:test

# Check Redis connection
redis-cli ping

# View application logs
docker-compose logs -f spike-web

# Check memory usage
npm run analyze:memory

# Profile performance
npm run profile:cpu
```

### 14.3 Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| AUTH_001 | Invalid credentials | Verify username/password |
| AUTH_002 | Session expired | Re-authenticate |
| SYNC_001 | Sync timeout | Retry with smaller batch |
| SYNC_002 | Invalid Moodle response | Check Moodle availability |
| DB_001 | Connection timeout | Check database status |
| DB_002 | Query timeout | Optimize query or increase timeout |

---

## 15. API Integration Examples

### 15.1 Authentication Flow

```typescript
// Complete authentication example
async function authenticateUser() {
    // Step 1: Google OAuth
    const googleAuth = await signIn('google', {
        redirect: false
    });

    if (!googleAuth?.ok) {
        throw new Error('Google authentication failed');
    }

    // Step 2: University credentials
    const credentialsResponse = await fetch('/api/auth/credentials/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'student123',
            password: 'password',
            universityId: 'bgu',
            googleUserId: googleAuth.user.id
        })
    });

    if (!credentialsResponse.ok) {
        throw new Error('University authentication failed');
    }

    // Step 3: Start sync
    const syncResponse = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'full' })
    });

    return syncResponse.json();
}
```

### 15.2 Data Fetching Examples

```typescript
// Fetch user courses with caching
const useCourses = () => {
    return useQuery({
        queryKey: ['courses'],
        queryFn: async () => {
            const response = await fetch('/api/user/courses');
            if (!response.ok) throw new Error('Failed to fetch courses');
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Fetch assignments with filters
async function fetchAssignments(filters: AssignmentFilters) {
    const params = new URLSearchParams();
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`/api/user/assignments?${params}`);
    return response.json();
}
```

### 15.3 WebSocket Integration

```typescript
// Real-time sync updates
class SyncWebSocket {
    private ws: WebSocket | null = null;

    connect(jobId: string) {
        this.ws = new WebSocket(`wss://api.spike.bgu.ac.il/sync/${jobId}`);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Sync progress:', data.progress);

            if (data.status === 'completed') {
                this.disconnect();
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
```

---

## 16. Appendices

### 16.1 Glossary

| Term | Hebrew | Description |
|------|---------|------------|
| Assignment | מטלה | Academic task or homework |
| Course | קורס | Academic course |
| Credits | נקודות זכות (נ״ז) | Academic credit points |
| Dashboard | לוח בקרה | Main application interface |
| Dual-stage | דו-שלבי | Two-step authentication |
| Enrollment | רישום | Course registration |
| Faculty | פקולטה | Academic faculty |
| Grade | ציון | Academic score |
| Moodle | מודל | Learning Management System |
| Semester | סמסטר | Academic term |
| Sync | סנכרון | Data synchronization |
| Transcript | גיליון ציונים | Grade sheet |

### 16.2 Technology Versions

| Technology | Version | Purpose |
|-----------|---------|----------|
| Node.js | 18.0+ LTS | Runtime environment |
| Next.js | 14.0+ | Web framework |
| React | 18.0+ | UI library |
| TypeScript | 5.0+ | Type safety |
| PostgreSQL | 15.0+ | Database |
| Redis | 7.0+ | Caching |
| Docker | 20.0+ | Containerization |
| Python | 3.11+ | Web scraping |

### 16.3 External Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| Google OAuth | Authentication | https://developers.google.com/identity |
| Supabase | Database hosting | https://supabase.com/docs |
| BGU Moodle | Academic data | Internal documentation |
| Sentry | Error tracking | https://docs.sentry.io |
| Vercel | Hosting (optional) | https://vercel.com/docs |

### 16.4 Configuration Files

#### 16.4.1 TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./apps/web/*"],
      "@/lib/*": ["./apps/web/lib/*"],
      "@/components/*": ["./apps/web/components/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next", "dist"]
}
```

#### 16.4.2 ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // Hebrew/RTL specific rules
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.property.name=/^(marginLeft|marginRight|paddingLeft|paddingRight)$/]',
        message: 'Use logical properties for RTL support'
      }
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn'
  }
};
```

### 16.5 Contributing Guidelines

1. **Code Style**: Follow the established TypeScript and React patterns
2. **Hebrew Support**: All new features must support Hebrew/RTL
3. **Testing**: Minimum 80% test coverage for new code
4. **Documentation**: Update relevant documentation with changes
5. **Commit Messages**: Follow conventional commit format
6. **Pull Requests**: Use the PR template and ensure all checks pass

### 16.6 License

This project is proprietary software. All rights reserved.

### 16.7 Contact Information

- **Technical Lead**: [technical-lead@spike.bgu.ac.il]
- **Support**: [support@spike.bgu.ac.il]
- **Security Issues**: [security@spike.bgu.ac.il]

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2024-09 | Initial documentation |
| 0.1.1 | 2024-10 | Added Hebrew/RTL section |
| 0.1.2 | 2024-11 | Updated API documentation |
| 0.1.3 | 2024-12 | Added troubleshooting guide |

---

*This documentation is maintained by the Spike Platform development team. For updates or corrections, please submit a pull request or contact the technical lead.*

**Last Updated**: September 2025
**Document Version**: 1.0.0
**Status**: Production