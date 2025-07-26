# Deployment Guide - MMC Scheduler

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Repository**: Push your code to GitHub

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and enter project details:
   - **Name**: `mmc-scheduler`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users

### 1.2 Configure Database
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `database.sql`
3. Click "Run" to execute the schema

### 1.3 Get API Keys
1. Go to Settings → API
2. Copy your **Project URL**
3. Copy your **anon/public** key
4. Save these for environment variables

### 1.4 Configure Authentication (Optional)
1. Go to Authentication → Settings
2. Configure email providers or enable email/password auth
3. Set site URL to your domain (e.g., `https://your-app.vercel.app`)

## Step 2: Vercel Deployment

### 2.1 Connect Repository
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the root directory

### 2.2 Configure Environment Variables
In Vercel deployment settings, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2.3 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployed application

## Step 3: Local Development

### 3.1 Environment Setup
1. Copy `.env.local.example` to `.env.local`
2. Add your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3.2 Install and Run
```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to test locally.

## Step 4: Testing Migration

### 4.1 Login Test
- Visit your deployed app
- Login with password: `mmc_pulmo`
- Verify redirect to scheduler page

### 4.2 Functionality Test
- Test employee management
- Generate a schedule
- Save and load schedules
- Test leave requests
- Verify all modals work

### 4.3 Data Migration
If you have existing localStorage data:
1. Visit the old application
2. Export your data
3. The new app will automatically migrate localStorage data on first visit

## Step 5: Production Considerations

### 5.1 Security
- Replace legacy password with proper Supabase Auth
- Set up Row Level Security policies
- Configure proper CORS settings

### 5.2 Performance
- Enable Vercel Analytics
- Monitor Supabase usage
- Consider upgrading plans for production traffic

### 5.3 Monitoring
```bash
# Check application health
curl https://your-app.vercel.app/api/health

# Monitor Supabase metrics in dashboard
```

## Troubleshooting

### Common Issues

**Build Failures:**
- Check environment variables are set
- Verify Supabase credentials
- Check Next.js version compatibility

**Runtime Errors:**
- Check browser console for errors
- Verify Supabase connection
- Check RLS policies

**Authentication Issues:**
- Verify Supabase Auth settings
- Check redirect URLs
- Verify API keys

### Support
- Check Vercel logs in dashboard
- Monitor Supabase logs
- Review application console logs

## Rollback Plan

If issues occur:
1. Keep original HTML/JS files in `backup/` folder
2. Can quickly revert to static hosting
3. Export Supabase data before major changes

## Cost Estimation

**Free Tier Limits:**
- **Supabase**: 500MB database, 2GB bandwidth
- **Vercel**: 100GB bandwidth, 10k function invocations
- **Total**: $0/month for small teams

**Paid Upgrades:**
- **Supabase Pro**: $25/month for unlimited projects
- **Vercel Pro**: $20/month for enhanced performance