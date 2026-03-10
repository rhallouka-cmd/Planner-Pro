# Planner Pro - Deployment Guide

## Phase 5: Deployment to Vercel

This guide will help you deploy the Planner Pro habit tracker application to Vercel.

---

## Prerequisites

- GitHub account with the repository pushed (✅ Already done)
- Vercel account (create at https://vercel.com if needed)
- Optional: Database service for production (Supabase, Neon, or Vercel Postgres)

---

## Deployment Steps

### Option 1: Deploy with SQLite (Development Database)

This is the quickest way to get your app running on Vercel. SQLite will work but is not recommended for production with multiple concurrent users.

**Steps:**

1. Go to [https://vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repository `Planner-Pro`
4. Click "Import"
5. In **Project Settings**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: Leave empty
6. In **Environment Variables**, add:
   ```
   NEXTAUTH_SECRET=<generate-secure-key>
   NEXTAUTH_URL=https://your-app.vercel.app
   DATABASE_URL=file:./prisma/dev.db
   ```

7. To generate NEXTAUTH_SECRET, run in your terminal:
   ```bash
   openssl rand -base64 32
   ```
   
8. Click "Deploy"
9. Wait 2-3 minutes for deployment to complete

**After Deployment:**
- Vercel will provide your app URL (e.g., `https://planner-pro-xyz.vercel.app`)
- Update `NEXTAUTH_URL` environment variable if needed
- Run database migrations:
  ```bash
  vercel env pull  # Pull environment variables
  npm run prisma:migrate
  ```

---

### Option 2: Deploy with PostgreSQL (Production Database - Recommended)

For better production performance with multiple users.

**Steps A: Set up Supabase PostgreSQL**

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for it to initialize
4. Go to **Settings** → **Database**
5. Copy the PostgreSQL connection string (looks like: `postgresql://[user]:[password]@[host]:5432/[database]`)
6. Update your `.env.local` with PostgreSQL URL:
   ```
   DATABASE_URL="postgresql://username:password@host:5432/database"
   ```

**Steps B: Deploy to Vercel**

1. Go to [https://vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your `Planner-Pro` GitHub repository
4. In **Environment Variables**, add:
   ```
   NEXTAUTH_SECRET=<your-generated-secret>
   NEXTAUTH_URL=https://your-app.vercel.app
   DATABASE_URL=postgresql://username:password@host:5432/database
   ```
5. Click "Deploy"
6. After deployment succeeds, run migrations in Vercel's deployment logs

---

## Post-Deployment Testing

### 1. Test Signup (Create a new account)
- Navigate to `https://your-app.vercel.app/signup`
- Create an account with:
  - Full Name
  - Email
  - Password (min 6 characters)
- Should redirect to dashboard after successful signup

### 2. Test Login
- Log out using the profile dropdown
- Go to `/login`
- Login with your email and password
- Should redirect to dashboard

### 3. Test Adding Habits
- Click "Add Habit" button
- Create a habit with:
  - Title: "Morning Jog"
  - Category: Gym
  - Description: (optional)
- Should appear in the dashboard

### 4. Test Completing Tasks
- Create a task
- Click the checkbox to complete it
- Should earn points and update stats

### 5. Test Gamification
- Check profile dropdown to see:
  - Current Level
  - Total Points
  - Achievements earned

---

## Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql://...` or `file:./prisma/dev.db` | Database connection string |
| `NEXTAUTH_SECRET` | Yes | `abc123def456` | Secret for JWT signing (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | `https://app.vercel.app` | Production URL for redirects |

---

## Troubleshooting

### Build Fails with TypeScript Errors
- Ensure all environment variables are set in Vercel dashboard
- Delete `.next` folder locally and rebuild: `npm run build`

### Database Errors After Deployment
- Run Prisma migrations:
  ```bash
  npx prisma migrate deploy
  ```
- Or reset database (warning: deletes data):
  ```bash
  npx prisma migrate reset
  ```

### Login/Signup Not Working
- Verify `NEXTAUTH_URL` matches your Vercel deployment URL
- Check that `NEXTAUTH_SECRET` is set in environment variables
- Review Vercel deployment logs for error details

### Session Expires Immediately
- Ensure `NEXTAUTH_SECRET` is at least 32 characters
- Verify the secret is properly URL-encoded if it contains special characters

---

## Database Schema

Your app uses SQLite/PostgreSQL with these main tables:
- **users**: User accounts with gamification stats
- **habits**: Recurring daily habits
- **tasks**: One-time tasks with deadlines
- **habitLogs**: Daily completion records
- **achievements**: Unlocked badges for users
- **analyticsSnapshots**: Daily analytics data

Migrations are automatically applied during build process.

---

## Next Steps

After successful deployment:

1. **Monitor Performance**: Check Vercel dashboard for analytics
2. **Set Up Custom Domain**: In Vercel project settings
3. **Enable Analytics**: Monitor app usage and performance
4. **Set Up Error Tracking**: Consider Sentry integration
5. **Regular Backups**: If using PostgreSQL, enable automated backups

---

## Support

For deployment issues:
- Check Vercel deployment logs
- Review environment variables are correctly set
- Ensure GitHub repo is properly connected
- Test locally with `npm run dev` first

