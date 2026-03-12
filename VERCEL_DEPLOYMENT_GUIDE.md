# Planner Pro - Live Vercel Deployment Guide

## 🚀 One-Click Deployment Steps

Your app is ready to deploy! Follow these steps to go live on Vercel.

---

## Step 1: Prepare Your Deployment Secret

Your unique deployment secret has been generated:

```
NEXTAUTH_SECRET=ByC9E3+EV2GZ8a6oKh4Y7iQl762vmNn1rOXVq/R1qlg=
```

**Note:** Keep this secret safe. Don't share it publicly.

---

## Step 2: Go to Vercel and Create New Project

1. Visit **[https://vercel.com](https://vercel.com)**
2. Sign in with GitHub (or create account)
3. Click **"New Project"**
4. Search for **"Planner-Pro"** repository
5. Click **"Import"**

---

## Step 3: Configure Project Settings

After clicking Import, you'll see the project configuration page:

### Framework & Settings
- **Framework Preset**: Should auto-detect as "Next.js" ✓
- **Root Directory**: Leave empty (default)
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Start Command**: (Leave empty - Vercel uses default)

### Environment Variables
Click **"Environment Variables"** and add these THREE variables:

| Variable Name | Value | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | `ByC9E3+EV2GZ8a6oKh4Y7iQl762vmNn1rOXVq/R1qlg=` | Authentication secret (already generated) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your app's Vercel URL |
| `DATABASE_URL` | `file:./prisma/dev.db` | SQLite database (for quick start) |

**⚠️ For Production:** If you want to use PostgreSQL, get a free database from:
- **Supabase**: https://supabase.com (Free tier: 2GB database)
- **Neon**: https://neon.tech (Free tier: 3GB)
- **Vercel Postgres**: Coming soon in Vercel dashboard

---

## Step 4: Deploy

1. Click the **"Deploy"** button (bottom right)
2. Wait 2-3 minutes for build & deployment
3. You'll see checkmarks appear as deployment progresses:
   - ✓ Building
   - ✓ Production Deployment
   - ✓ Ready

4. Click **"Visit"** to open your live app! 🎉

---

## Step 5: Update NEXTAUTH_URL (if needed)

After deployment, Vercel will show your app URL (e.g., `https://planner-pro-abc123.vercel.app`)

1. Go to **Vercel Dashboard** → Your Project → **Settings**
2. Click **"Environment Variables"**
3. Update `NEXTAUTH_URL` to match your actual Vercel URL
4. Trigger a redeployment:
   - Go to **Deployments** tab
   - Click the three dots on latest deployment
   - Select **"Redeploy"**

---

## Step 6: Test Your Live App

### Create a Test Account

1. Visit `https://your-app.vercel.app/signup`
2. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123" (min 6 chars)
3. Click **"Create Account"**
4. Should redirect to dashboard 🎯

### Create Test Data

1. **Add a Habit** (e.g., "Morning Jog" - GYM category)
2. **Add a Task** (e.g., "Study TypeScript" - UNIVERSITY category)
3. **Complete Habit** (click checkbox) - Should see points awarded
4. **Complete Task** (click checkbox) - Should see points awarded
5. Check **Profile** → See level and achievements

### Test Logout & Login

1. Click **Profile dropdown** → **"🚪 Logout"**
2. Should redirect to login page
3. Login with `test@example.com` / `password123`
4. Should see your habits and tasks still there ✓

---

## 🔧 Production Database Setup (Optional but Recommended)

For a real app with multiple users, use PostgreSQL instead of SQLite:

### Using Supabase (Easiest)

1. Go to **[https://supabase.com](https://supabase.com)**
2. Click **"New project"**
3. Fill in:
   - Project name: "Planner-Pro"
   - Password: Generate secure password
   - Region: Choose closest to you
4. Click **"Create new project"** (wait 2 min)
5. Go to **Settings** → **Database**
6. Copy the **PostgreSQL connection string**
7. In **Vercel Project Settings**:
   - Update `DATABASE_URL` with Supabase connection string
   - Redeploy
8. Run migrations:
   ```bash
   vercel env pull
   npm run prisma:migrate
   ```

---

## 📊 Monitoring & Logs

### View Deployment Logs
- Go to **Vercel Dashboard** → Project → **Deployments**
- Click on any deployment to see detailed logs
- Helps debug if something goes wrong

### Monitor Production Errors
- Go to **Project Settings** → **Monitoring**
- Set up error notifications

### Database Queries
- If using Supabase, view queries in Supabase dashboard
- Check for slow queries or connection issues

---

## 🆘 Troubleshooting

### 1. Build Fails
**Error**: `ERR_MODULE_NOT_FOUND`
- **Solution**: Push latest changes to GitHub and redeploy

### 2. "NextAuth configuration is invalid"
**Error**: `Error: NEXTAUTH_SECRET not provided`
- **Solution**: Verify NEXTAUTH_SECRET is set in Vercel environment variables
- Redeploy after updating variables

### 3. Database Connection Error
**Error**: `PrismaSQLiteBuildError` or `connection refused`
- **Solution**: 
  - For SQLite: Use `file:./prisma/dev.db`
  - For Postgres: Verify connection string format
  - Check database service is running (if using Supabase/Neon)

### 4. "Habit not loading" on Vercel (but works locally)
**Error**: User sees blank dashboard
- **Solution**: 
  1. Check browser console for errors
  2. Verify session is authenticated (Network tab → /api/user should return 200)
  3. Run Prisma migrations on production database
  4. Redeploy after db changes

### 5. Login Redirect Loop
**Error**: Gets redirected to /login endlessly
- **Solution**:
  1. Verify NEXTAUTH_URL matches actual Vercel domain
  2. Clear browser cookies
  3. Check middleware.ts is being served
  4. Redeploy

---

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] GitHub account connected to Vercel
- [ ] NEXTAUTH_SECRET copied to Vercel env vars
- [ ] NEXTAUTH_URL matches Vercel app URL
- [ ] DATABASE_URL set (SQLite or PostgreSQL)
- [ ] Project deployed successfully (green checkmark)
- [ ] Can visit app URL in browser
- [ ] Signup works (can create new account)
- [ ] Login works (can authenticate)
- [ ] Habits/Tasks load and save
- [ ] Logout works
- [ ] Gamification points awarded

---

## 🎉 Success!

Your app is now live! Share the URL with others or continue building features.

### Next Steps
1. Add more gamification features
2. Set up email notifications
3. Add social sharing
4. Create mobile app
5. Add advanced analytics

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. View Vercel deployment logs for error messages
3. Check browser DevTools → Console tab
4. Review DEPLOYMENT.md for more details
5. Check GitHub repository issues

---

Generated: March 12, 2026
