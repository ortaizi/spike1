# Spike Dashboard Integration

## Overview
This directory contains the integrated dashboard from the spike-dashboard project. The dashboard is the heart of the Spike platform, providing students with all the academic information they need in one place.

## Files Structure
- `page.tsx` - Main dashboard component with tab navigation
- `layout.tsx` - Special layout with required CSS and fonts
- `globals-dashboard.css` - Dashboard specific styles

## Dashboard Features

### 1. Tab Navigation
- **בית** - Overview with key information
- **קורסים** - Course management and grades
- **מטלות** - Assignment tracking
- **מערכת שעות** - Schedule and timetable
- **מייל** - Email management
- **אירועים** - Events and workshops

### 2. Authentication Integration
- Protected routes requiring login
- User session management
- Sign out functionality
- Automatic redirect to sign-in if not authenticated

### 3. Components
All dashboard components are located in:
- `apps/web/components/dashboard/` - All dashboard components

### 4. Styling
- Uses Rubik font for Hebrew
- RTL support for Hebrew
- Modern UI with Dipy-style design
- Responsive design for all devices

## Usage
The dashboard is automatically shown when users visit `/dashboard` and are authenticated.

## Customization
To modify the dashboard:
1. Edit `apps/web/app/dashboard/page.tsx`
2. Update styles in `apps/web/app/globals-dashboard.css`
3. Modify components in `apps/web/components/dashboard/`

## Dependencies
- framer-motion (for animations)
- lucide-react (for icons)
- next-auth (for authentication)
- tailwindcss (for styling)

## Data Integration
The dashboard is designed to work with:
- Moodle scraping for course data
- Email integration
- Calendar synchronization
- Grade tracking
- Assignment management 