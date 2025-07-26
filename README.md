# MMC Scheduler - Supabase Migration

Healthcare Staff Scheduler for Makati Medical Center with Supabase backend and Vercel deployment.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Run the SQL from `database.sql` in your Supabase SQL Editor
   - Copy `.env.local.example` to `.env.local` and add your Supabase credentials

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Environment Variables

Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm start
```

## Features

- ✅ Employee management with role-based scheduling
- ✅ Automated schedule generation with business rule compliance
- ✅ Leave request management
- ✅ Schedule saving/loading with version history
- ✅ Export functionality for schedule data
- ✅ Real-time validation and conflict detection
- ✅ Responsive design for mobile and desktop
- ✅ Supabase backend with Row Level Security
- ✅ One-click Vercel deployment

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Deployment**: Vercel with automatic GitHub integration
- **Testing**: Vitest with comprehensive test coverage

## Migration from Legacy System

The application automatically migrates data from localStorage on first load. All existing functionality is preserved with the same UI/UX.

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run test:run     # Run tests once
npm run typecheck    # TypeScript checking
npm run lint         # ESLint
npm run prettier     # Format code
```