# Spike Platform - MCP (Model Context Protocol) Setup

This directory contains configurations for MCP servers that enhance Claude's capabilities when working with the Spike academic management platform.

## Overview

MCP servers provide Claude with specialized tools for database operations, file system access, git operations, and more. This setup is optimized for Hebrew RTL development and Israeli university integrations.

## Configured MCP Servers

### 1. PostgreSQL Server (`postgres`)
**Purpose**: Direct access to Supabase PostgreSQL database
**Capabilities**:
- Execute SQL queries with Hebrew text support
- Test Row Level Security (RLS) policies
- Analyze database performance
- Debug Hebrew content encoding
- Query course data in Hebrew and English

**Hebrew/RTL Use Cases**:
- Test Hebrew course names storage: `SELECT name FROM courses WHERE name ~ '[א-ת]'`
- Verify RTL text ordering in search results
- Debug Hebrew character encoding issues
- Test collation for Hebrew sorting

### 2. Filesystem Server (`filesystem`)
**Purpose**: Enhanced file system operations for the monorepo
**Capabilities**:
- Fast navigation across apps/web, apps/scraper, packages/*
- Read/write component files with Hebrew comments
- Analyze RTL-specific CSS and Tailwind classes
- Search for Hebrew strings across the codebase

**Hebrew/RTL Use Cases**:
- Find components missing RTL support
- Search for hardcoded Hebrew text
- Locate RTL-specific styling issues
- Analyze component prop interfaces for Hebrew content

### 3. Git Server (`git`)
**Purpose**: Version control operations
**Capabilities**:
- Check repository status and history
- Create commits with Hebrew commit messages
- Manage branches for feature development
- Review diffs containing Hebrew content

**Hebrew/RTL Use Cases**:
- Commit messages in Hebrew for Israeli team
- Track RTL implementation progress
- Review Hebrew content changes
- Manage translations and RTL fixes

### 4. Fetch Server (`fetch`)
**Purpose**: HTTP requests for external integrations
**Capabilities**:
- Test university Moodle APIs
- Verify Supabase API endpoints
- Mock Hebrew API responses
- Test authentication flows

**Hebrew/RTL Use Cases**:
- Test Moodle APIs returning Hebrew course data
- Verify Hebrew content in API responses
- Test university SSO endpoints
- Mock Hebrew error messages from universities

### 5. Memory Server (`memory`)
**Purpose**: Persistent context between Claude sessions
**Capabilities**:
- Remember project structure and conventions
- Store common Hebrew phrases and translations
- Cache university-specific configurations
- Remember RTL testing patterns

**Hebrew/RTL Use Cases**:
- Store Hebrew UI text conventions
- Remember RTL class mappings (ml-* → ms-*)
- Cache university Hebrew names and domains
- Store common Hebrew validation patterns

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Access to Spike project Supabase instance
- Claude Desktop with MCP support

### 1. Get Supabase Credentials

From your Supabase project dashboard:

1. **Project URL**: Found in Settings > API
   - Format: `https://your-project-ref.supabase.co`

2. **Database Password**: Found in Settings > Database
   - Used for direct PostgreSQL connection

3. **Project Reference**: Found in Settings > General
   - Format: `your-project-ref`

### 2. Configure MCP Settings

1. Copy the example configuration:
   ```bash
   cp .claude/mcp-settings.example.json .claude/mcp-settings.json
   ```

2. Update the PostgreSQL connection string in `mcp-settings.json`:
   ```json
   "postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
   ```
   
   Replace:
   - `YOUR_DB_PASSWORD` with your Supabase database password
   - `YOUR_PROJECT_REF` with your Supabase project reference

### 3. Install MCP Servers

Run the installation script:
```bash
./.claude/install-mcp-servers.sh
```

Or install manually:
```bash
npm install -g \
  @modelcontextprotocol/server-postgres \
  @modelcontextprotocol/server-filesystem \
  @modelcontextprotocol/server-git \
  @modelcontextprotocol/server-fetch \
  @modelcontextprotocol/server-memory
```

### 4. Test Setup

Test database connectivity:
```sql
-- Test Hebrew text support
SELECT 'שלום עולם' as hebrew_text;

-- Check courses table
SELECT name FROM courses WHERE name ~ '[א-ת]' LIMIT 5;

-- Test RTL ordering
SELECT name FROM courses ORDER BY name COLLATE "he_IL" LIMIT 10;
```

## Security Considerations

⚠️ **Important**: Never commit `mcp-settings.json` to version control as it contains sensitive database credentials.

- ✅ `mcp-settings.json` is added to `.gitignore`
- ✅ Use `mcp-settings.example.json` as a template
- ✅ Store credentials in environment variables when possible
- ✅ Rotate database passwords regularly
- ✅ Use read-only database users for development when possible

## Common Tasks

### Hebrew Content Queries
```sql
-- Find all Hebrew course names
SELECT id, name FROM courses WHERE name ~ '[א-ת]';

-- Check Hebrew text encoding
SELECT name, length(name), octet_length(name) FROM courses WHERE name ~ '[א-ת]' LIMIT 5;

-- Test Hebrew collation
SELECT name FROM courses ORDER BY name COLLATE "he_IL.UTF-8";
```

### RTL Component Analysis
```bash
# Find components missing RTL support
grep -r "ml-\|mr-\|pl-\|pr-" components/ --include="*.tsx"

# Find Hebrew strings in components
grep -r "[\u0590-\u05FF]" components/ --include="*.tsx"

# Check for proper RTL attributes
grep -r "dir=\"rtl\"\|direction" components/ --include="*.tsx"
```

### University API Testing
```javascript
// Test BGU Moodle endpoint
const response = await fetch('https://moodle.bgu.ac.il', {
  method: 'GET',
  headers: { 'User-Agent': 'Spike-Platform/1.0' }
});

// Test Hebrew API response
const hebrewResponse = await fetch('/api/courses', {
  headers: { 'Accept-Language': 'he-IL' }
});
```

## Troubleshooting

### PostgreSQL Connection Issues
1. Verify Supabase project is running
2. Check database password is correct
3. Ensure IP is allowlisted in Supabase settings
4. Test connection with `psql` command

### Hebrew Text Issues
1. Verify database uses UTF-8 encoding
2. Check client encoding settings
3. Test with simple Hebrew query
4. Verify collation is set correctly

### File System Access Issues
1. Ensure Claude has file system permissions
2. Check if running in correct directory
3. Verify paths are relative to project root

## MCP Server Versions

Current versions (auto-updated via npx):
- `@modelcontextprotocol/server-postgres`: Latest
- `@modelcontextprotocol/server-filesystem`: Latest  
- `@modelcontextprotocol/server-git`: Latest
- `@modelcontextprotocol/server-fetch`: Latest
- `@modelcontextprotocol/server-memory`: Latest

## Support

For MCP-specific issues:
- [MCP Documentation](https://modelcontextprotocol.io/docs)
- [Claude Desktop MCP Guide](https://claude.ai/mcp)

For Spike project issues:
- See main project README.md
- Check CLAUDE.md for project-specific guidance