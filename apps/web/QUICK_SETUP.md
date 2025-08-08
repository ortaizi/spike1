# 🚀 Quick Setup - CockroachDB + Prisma

## ⚡ 5-Minute Setup

### 1. Environment Setup
```bash
# Copy environment template
cp env.example .env.local

# Edit with your CockroachDB details
nano .env.local
```

### 2. Install & Generate
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate
```

### 3. Database Setup
```bash
# Push schema to CockroachDB
npm run db:push

# Seed with sample data (optional)
npm run db:seed
```

### 4. Start Development
```bash
# Start the server
npm run dev
```

## 🔗 Your Connection String Format

Replace in `.env.local`:
```env
DATABASE_URL="postgresql://spike-ad:YOUR_PASSWORD@YOUR_CLUSTER.cockroachlabs.cloud:26257/defaultdb?sslmode=require&sslrootcert=~/.postgresql/root.crt"
DIRECT_URL="postgresql://spike-ad:YOUR_PASSWORD@YOUR_CLUSTER.cockroachlabs.cloud:26257/defaultdb?sslmode=require&sslrootcert=~/.postgresql/root.crt"
```

## ✅ Verification

1. **Health Check**: http://localhost:3000/api/health
2. **Users API**: http://localhost:3000/api/users
3. **Courses API**: http://localhost:3000/api/courses

## 🛠️ Available Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database
npm run dev            # Start development
```

## 🚨 Common Issues

- **SSL Error**: Download certificate from CockroachDB Cloud
- **Connection Failed**: Check password and cluster URL
- **Prisma Error**: Run `npm run db:generate`

---

**Need help?** See `COCKROACHDB_SETUP.md` for detailed instructions. 