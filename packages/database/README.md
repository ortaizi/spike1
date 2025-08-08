# @spike/database

Database package for the Spike platform using Prisma ORM with PostgreSQL.

## 🗄️ Database Schema

The schema includes all academic management entities:

- **Users**: Students with BGU-specific fields (studentId, faculty, department)
- **Courses**: Academic courses with Hebrew/English names, credits, semesters
- **Assignments**: Course assignments with due dates, priorities, status
- **Grades**: Student grades with percentage calculations
- **CourseEnrollments**: Student-course relationships
- **Teams**: Collaboration teams for assignments
- **TeamMembers**: Team membership with roles
- **AssignmentSubmissions**: Student submissions
- **Reminders**: Assignment reminders and notifications

## 🚀 Quick Start

### 1. Set up Database URL

Copy `env.local.example` to `.env.local` and configure your database:

```bash
cp env.local.example .env.local
```

### 2. Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Seed database with test data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### 3. Local Development with Docker

```bash
# Start PostgreSQL and Redis
npm run docker:up

# Seed the database
npm run db:seed
```

## 📊 Sample Data

The seed script creates:

- **2 Test Users**: יוסי כהן, שרה לוי
- **3 BGU Courses**: מבוא למדעי המחשב, מבני נתונים, אלגוריתמים
- **3 Assignments**: תרגיל 1, תרגיל 2, פרויקט סיום
- **1 Team**: צוות פרויקט סיום
- **2 Reminders**: Assignment reminders

## 🔧 Usage in Apps

```typescript
import { db } from '@spike/database';

// Query users
const users = await db.user.findMany();

// Query courses with enrollments
const courses = await db.course.findMany({
  include: {
    students: {
      include: {
        user: true
      }
    }
  }
});
```

## 🎓 BGU-Specific Features

- **Hebrew Support**: All text fields support Hebrew content
- **Student IDs**: Unique BGU student identification
- **Faculty/Department**: Academic structure mapping
- **Semester System**: א/ב/קיץ (A/B/Summer) semesters
- **Course Codes**: BGU format (e.g., 201-1-1234)

## 🔒 Security

- **Row Level Security**: Implemented for multi-tenant access
- **Input Validation**: All inputs validated with Zod
- **SQL Injection Protection**: Parameterized queries via Prisma
- **Audit Trail**: Created/updated timestamps on all entities 