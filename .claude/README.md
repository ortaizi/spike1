# Spike Platform - Claude Development Configuration

This directory contains configurations that enhance Claude's capabilities when working with the Spike academic management platform, optimized for Hebrew RTL development and Israeli university integrations.

## 🔧 Development Tools

### Hooks (`.claude/hooks.json`)
**Purpose**: Automated validation for Hebrew/RTL compliance and academic platform standards
**Key Features**:
- Hebrew text RTL direction validation
- Forbidden directional CSS blocking (`margin-left`, `padding-right` → use logical properties)
- Academic context validation (Hebrew labels for courses/assignments)
- Automatic test running after component changes
- Build validation after major edits

### Slash Commands (`.claude/slash-commands.json`)
**Purpose**: Quick development shortcuts for common Hebrew/RTL and academic platform tasks
**Categories**:
- 🌍 **Hebrew Development**: RTL-focused dev server and testing
- 🧪 **Hebrew Testing**: Comprehensive RTL test suites
- 🔧 **RTL Fixes**: Auto-fix directional CSS issues
- 🗄️ **Database**: Type generation and Hebrew data operations
- 🏫 **University Integration**: Moodle scraper testing
- 📸 **Visual Testing**: RTL screenshot verification

### Custom Commands (`.claude/commands.md`)
**Purpose**: Detailed implementation guides for complex development tasks
**Includes**:
- Hebrew/RTL component testing workflows
- University integration scaffolding
- Authentication testing procedures
- Moodle scraper debugging tools

## 🎯 Quick Start

### Essential Commands
```bash
# Hebrew development focus
/dev-hebrew                 # Start dev with Hebrew RTL
/test-rtl                  # Run Hebrew/RTL test suite
/hebrew-check              # Validate Hebrew content
/validate-all              # Complete pre-commit validation

# Database operations
/db-sync                   # Sync types after schema changes

# University testing
/moodle-test              # Test university integrations
/debug-scraper            # Debug Moodle scrapers
```

### RTL Development Guidelines
- ❌ **Never use**: `ml-*`, `mr-*`, `pl-*`, `pr-*` classes
- ✅ **Always use**: `ms-*`, `me-*`, `ps-*`, `pe-*` (logical properties)
- ✅ **Required**: `dir="rtl"` for Hebrew content containers
- ✅ **Test**: All components with Hebrew content using `/test-rtl`

## 🛡️ Security & Best Practices

### Hooks Validation
The hooks system automatically prevents:
- Committing credentials or secrets
- Using forbidden directional CSS properties
- Hebrew content without proper RTL attributes
- Academic content missing Hebrew localization

### File Management
- All sensitive configuration files are excluded from version control
- Only development tools and validation scripts are version controlled
- Database credentials should use environment variables

## 🎓 Academic Platform Focus

### Hebrew/RTL Requirements
- All course names, assignments, and academic content support Hebrew
- RTL layout compliance for all UI components
- Israeli academic calendar integration (Hebrew months, terms)
- BGU-specific course code formats and terminology

### University Integration
- BGU Moodle scraping and authentication
- Multi-university support framework
- Hebrew error message handling
- Academic data validation with Hebrew content

## 📁 File Structure
```
.claude/
├── hooks.json           # ✅ KEEP - Hebrew/RTL validation hooks
├── slash-commands.json  # ✅ KEEP - Development shortcuts  
├── commands.md         # ✅ KEEP - Implementation guides
├── settings.local.json # User-specific settings
└── README.md          # This file
```

## 🔍 Troubleshooting

### Common Issues
- **Hook failures**: Check Hebrew content has `dir="rtl"`
- **RTL validation errors**: Replace directional classes with logical properties
- **Database type errors**: Run `/db-sync` after schema changes
- **Hebrew rendering issues**: Verify UTF-8 encoding and RTL CSS

### Debugging Commands
```bash
/hebrew-check           # Quick RTL compliance check
/fix-rtl               # Auto-fix common RTL issues
/screenshot-rtl        # Visual verification of RTL layout
/debug-scraper         # University scraper debugging
```

## 📚 Resources

### Project Documentation
- See main `CLAUDE.md` for comprehensive development guidelines
- Check `README.md` for project setup and architecture
- Review `TESTING_INFRASTRUCTURE.md` for testing strategies

### Hebrew/RTL Development
- [RTL CSS Guidelines](https://rtlstyling.com/)
- [Hebrew Web Typography](https://hebrew-typography.com/)
- [Israeli Academic Standards](https://www.israeli-academic-standards.org/)