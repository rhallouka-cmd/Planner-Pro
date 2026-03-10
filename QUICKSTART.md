# Quick Start Guide

Get Planner Pro running in 5 minutes!

## 1️⃣ Prerequisites
- Node.js >= 20 installed
- Git installed
- A terminal/command prompt

## 2️⃣ Clone & Setup (2 minutes)

```bash
# Clone repository
git clone https://github.com/rhallouka-cmd/Planner-Pro.git
cd Planner-Pro/habit-tracker

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Generate secret key
openssl rand -base64 32
# (Copy the output and paste it as NEXTAUTH_SECRET in .env.local)
```

## 3️⃣ Configure Environment

Edit `.env.local` and update:
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="<paste-your-generated-secret-here>"
NEXTAUTH_URL="http://localhost:3000"
```

## 4️⃣ Setup Database (1 minute)

```bash
npx prisma migrate dev --name init
```

## 5️⃣ Start Development Server (instant!)

```bash
npm run dev
```

Open browser: **http://localhost:3000** 🎉

---

## 🎮 First Steps

### 1. Create Account
- Click "Sign Up"
- Enter: Name, Email, Password
- Click "Create Account"

### 2. Create Your First Habit
- Click "Add Habit" button
- Fill in:
  - **Title**: "Morning Jog"
  - **Category**: "Gym"
  - Click "Add"

### 3. Complete the Habit
- Click ✓ checkbox next to the habit
- Earn 100 points!
- Watch your level increase

### 4. Check Your Stats
- Click profile dropdown (top-right)
- See your level, points, achievements

---

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub
```bash
git push origin master
```

### Step 2: Deploy
1. Go to https://vercel.com
2. Click "New Project"
3. Select your repo
4. Add environment variables:
   - `NEXTAUTH_SECRET`: (same as local)
   - `NEXTAUTH_URL`: https://your-app.vercel.app
5. Click "Deploy"

**That's it!** Your app is live in ~2 minutes

---

## 📚 Useful Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# View database in browser
npx prisma studio

# Run migrations
npx prisma migrate dev

# Reset database (⚠️ WARNING: Deletes all data!)
npx prisma migrate reset
```

---

## 🆘 Common Issues

**Port 3000 already in use?**
```bash
npm run dev -- -p 3001
```

**Database locked error?**
```bash
# Delete database file and recreate
rm prisma/dev.db
npx prisma migrate dev --name init
```

**Login not working?**
- Clear browser cookies (Ctrl+Shift+Delete)
- Make sure NEXTAUTH_SECRET is set
- Restart dev server: Ctrl+C then `npm run dev`

---

## 📖 Full Documentation

- **Detailed Setup**: See [README_EXTENDED.md](./README_EXTENDED.md)
- **API Docs**: See [README_EXTENDED.md](./README_EXTENDED.md#-api-endpoints)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🎯 Next Steps

1. ✅ Get it running locally
2. ✅ Create habits and earn points
3. ✅ Deploy to Vercel
4. ✅ Share with friends
5. ✅ Track habits forever! 🎉

---

**Questions?** Check the full docs or GitHub Issues!

