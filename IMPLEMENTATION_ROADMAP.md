# Habit + Task Tracker: Implementation Roadmap

## Phase Overview
```
Phase 1 (MVP - Weeks 1-2): Core UI + Frontend State
  ↓
Phase 2 (Weeks 3-4): Backend API + Database Integration
  ↓
Phase 3 (Weeks 5-6): Gamification + Analytics
  ↓
Phase 4 (Weeks 7-8): Authentication + Advanced Features
  ↓
Phase 5 (Weeks 9+): Deployment + Optimization
```

---

## PHASE 1: CORE UI + FRONTEND STATE (Current - Weeks 1-2)

### Status: ✅ In Progress
The dashboard UI is 90% complete. Focus remaining on state refinement.

### Deliverables
- [x] Premium dark mode SaaS dashboard
- [x] Responsive mobile layout (sm: breakpoints)
- [x] Tab navigation (Dashboard, Analytics, Category tabs)
- [x] Gamification score cards (Streak, Points, Level, Completion%)
- [x] Progress bar with gradient animation
- [x] Task add/edit/delete functionality
- [x] Category-based organization (University, Projects, Gym)
- [x] Dropdown menus (Notifications, Settings, Profile)
- [x] Achievement display
- [ ] Weekly analytics visualization
- [ ] Animations & micro-interactions

### Phase 1 Tasks

#### 1.1: Complete Analytics Tab (1-2 hours)
**File**: `app/page.tsx`

Add Recharts library:
```bash
npm install recharts date-fns
```

Create chart components:
```typescript
// app/components/analytics/WeeklyChart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const WeeklyChart = ({ data }) => (
  <BarChart data={data} width={600} height={300}>
    <XAxis dataKey="day" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="completed" fill="#6366f1" />
  </BarChart>
);
```

**UI Update**: Replace placeholder percentage bars with actual Recharts component.

---

#### 1.2: Add Animations (1 hour)
**File**: `app/page.tsx`

Add CSS animations for smooth transitions:
```css
/* globals.css */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.5); }
  50% { box-shadow: 0 0 40px rgba(249, 115, 22, 0.8); }
}

@keyframes countUp {
  from { transform: scale(0.8); }
  to { transform: scale(1); }
}

.animate-slideIn { animation: slideIn 0.3s ease-out; }
.animate-pulseGlow { animation: pulseGlow 1s infinite; }
.animate-countUp { animation: countUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
```

Apply to UI:
```tsx
<div className="animate-slideIn">
  <button onClick={() => toggleHabit(category, id)} className="animate-countUp">
    {/* button content */}
  </button>
</div>
```

---

#### 1.3: Notification Toast System (2 hours)
**File**: Create `app/components/Toast.tsx`

```typescript
// app/components/Toast.tsx
import { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white animate-slideIn ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {toast.type === 'info' && <Info className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );

  return { addToast, ToastContainer };
}
```

Use in `page.tsx`:
```typescript
export default function Home() {
  const { addToast, ToastContainer } = useToast();

  const toggleHabit = (category, id) => {
    setHabits({ /* logic */ });
    addToast('✅ Task completed! +100 points', 'success');
  };

  return (
    <div>
      <ToastContainer />
      {/* rest of component */}
    </div>
  );
}
```

---

#### 1.4: Mobile Responsiveness Polish (1 hour)
**File**: `app/page.tsx`

Review and improve:
- Button sizes on touch devices (min 44x44px for touch targets)
- Font size scaling (sm:text-sm → md:text-base)
- Spacing adjustments (p-4 sm:p-6 md:p-8)
- Modal/dropdown positioning on mobile (don't cut off screen)

---

### Phase 1 Checkpoint
- [ ] Analytics tab renders charts
- [ ] Animations feel smooth
- [ ] Toast notifications appear on action
- [ ] Mobile UI fully responsive (test on 375px viewport)
- [ ] Git commit: "Phase 1: Complete frontend UI with animations"

---

## PHASE 2: BACKEND API + DATABASE INTEGRATION (Weeks 3-4)

### Setup Database Connection

#### 2.1: Prisma Migrations
**Goal**: Set up PostgreSQL and sync schema

```bash
# In .env.local (DO NOT commit)
DATABASE_URL="postgresql://user:password@localhost:5432/planner_pro"

# Or use Vercel Postgres
DATABASE_URL="postgresql://default:password@ep-xyz.us-east-1.postgres.vercel.sh/verceldb"

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name "init"

# View database
npx prisma studio
```

After running `prisma migrate dev`, your database should have all tables:
- users
- habits
- tasks
- habit_logs
- achievements
- analytics_snapshots
- freeze_days

---

#### 2.2: Create API Route Handlers

**File**: `app/api/habits/route.ts` (GET & POST)
```typescript
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/habits - List all habits
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id'); // From auth middleware
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: { habitLogs: { take: 30 } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(habits);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/habits - Create habit
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { title, description, category } = await request.json();

    const habit = await prisma.habit.create({
      data: {
        title,
        description,
        category,
        userId,
        pointsValue: 100
      }
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

**File**: `app/api/habits/[id]/route.ts` (GET, PUT, DELETE)
```typescript
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  const habit = await prisma.habit.findUnique({
    where: { id: params.id },
    include: { habitLogs: true }
  });
  return NextResponse.json(habit);
}

export async function PUT(request, { params }) {
  const { title, description, category } = await request.json();
  const habit = await prisma.habit.update({
    where: { id: params.id },
    data: { title, description, category }
  });
  return NextResponse.json(habit);
}

export async function DELETE(request, { params }) {
  await prisma.habit.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

**File**: `app/api/habits/[id]/complete/route.ts` (POST - Log completion)
```typescript
export async function POST(request, { params }) {
  const userId = request.headers.get('x-user-id');
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check for existing log today
    const existingLog = await prisma.habitLog.findFirst({
      where: {
        habitId: params.id,
        dateCompleted: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 86400000)
        }
      }
    });

    if (existingLog) {
      return NextResponse.json(
        { error: 'Already logged today' },
        { status: 409 }
      );
    }

    // Create log
    const log = await prisma.habitLog.create({
      data: {
        habitId: params.id,
        userId,
        dateCompleted: new Date(),
        pointsEarned: 100
      }
    });

    // Award points to user
    await prisma.user.update({
      where: { id: userId },
      data: { totalPoints: { increment: 100 } }
    });

    // Recalculate streak
    await updateStreakForHabit(params.id);

    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function
async function updateStreakForHabit(habitId: string) {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { habitLogs: { orderBy: { dateCompleted: 'desc' } } }
  });

  let streakCount = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const log of habit.habitLogs) {
    const logDate = new Date(log.dateCompleted);
    logDate.setHours(0, 0, 0, 0);

    if (logDate.getTime() === currentDate.getTime()) {
      streakCount++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  const newMaxStreak = Math.max(habit.maxStreak, streakCount);
  await prisma.habit.update({
    where: { id: habitId },
    data: { streakCount, maxStreak: newMaxStreak }
  });
}
```

Similar routes needed:
- `POST /api/tasks` (create task)
- `PUT /api/tasks/[id]` (update task)
- `POST /api/tasks/[id]/complete` (mark complete + award points)
- `DELETE /api/tasks/[id]` (delete task)

---

#### 2.3: Update Frontend to Use API

**File**: `app/hooks/useHabits.ts` (New - Custom Hook)
```typescript
import { useEffect, useState } from 'react';

export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      const data = await res.json();
      setHabits(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async (title: string, category: string) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category })
    });
    const newHabit = await res.json();
    setHabits([...habits, newHabit]);
    return newHabit;
  };

  const completeHabit = async (habitId: string) => {
    const res = await fetch(`/api/habits/${habitId}/complete`, {
      method: 'POST'
    });
    const log = await res.json();
    // Update local state
    await fetchHabits();
    return log;
  };

  return {
    habits,
    loading,
    error,
    addHabit,
    completeHabit,
    fetchHabits
  };
}
```

**File**: Update `app/page.tsx` to use hooks
```typescript
'use client';
import { useHabits } from './hooks/useHabits';

export default function Home() {
  const { habits, loading, addHabit, completeHabit } = useHabits();

  if (loading) return <div>Loading...</div>;

  return (
    // Render habits from API instead of local state
  );
}
```

---

### Phase 2 Checkpoint
- [ ] PostgreSQL database created and migrated
- [ ] API routes for habits/tasks created and tested
- [ ] Frontend successfully fetches and displays data from API
- [ ] Create/read/update/delete operations working end-to-end
- [ ] Git commit: "Phase 2: Backend API + Database Integration"

---

## PHASE 3: GAMIFICATION + ANALYTICS (Weeks 5-6)

### 3.1: Implement Streak Calculation

**File**: `app/lib/streakCalculator.ts` (New - Business Logic)
```typescript
import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

export async function calculateUserStreak(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      habitLogs: {
        orderBy: { dateCompleted: 'desc' },
        take: 365
      }
    }
  });

  if (user.habitLogs.length === 0) return 0;

  let consistentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const uniqueDates = Array.from(
    new Set(
      user.habitLogs.map(log => {
        const d = new Date(log.dateCompleted);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    )
  ).sort((a, b) => b - a);

  let currentDate = today.getTime();

  for (const logDate of uniqueDates) {
    const daysDiff = differenceInDays(currentDate, logDate);

    if (daysDiff === 0 || daysDiff === 1) {
      consistentStreak++;
      currentDate = logDate;
    } else {
      break;
    }
  }

  return consistentStreak;
}

export async function updateGlobalStreaks() {
  // Daily batch job - runs at midnight
  const users = await prisma.user.findMany();

  for (const user of users) {
    const streak = await calculateUserStreak(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { streakDays: streak }
    });
  }
}
```

---

### 3.2: Implement Achievement System

**File**: `app/lib/achievementChecker.ts` (New)
```typescript
import { prisma } from '@/lib/prisma';

const ACHIEVEMENTS = {
  '7streak': { badge: '🔥', title: '7-Day Streak', condition: (stats) => stats.maxStreak >= 7 },
  '30streak': { badge: '🔥', title: '30-Day Streak', condition: (stats) => stats.maxStreak >= 30 },
  '1kpoints': { badge: '⭐', title: '1K Points', condition: (stats) => stats.totalPoints >= 1000 },
  '5kpoints': { badge: '⭐', title: '5K Points', condition: (stats) => stats.totalPoints >= 5000 },
  'scholar': { badge: '📚', title: 'Scholar', condition: (stats) => stats.uniCompleted >= 50 },
  'devops': { badge: '🚀', title: 'DevOps', condition: (stats) => stats.projectsCompleted >= 50 },
  'gymbro': { badge: '💪', title: 'Gym Bro', condition: (stats) => stats.gymCompleted >= 50 },
};

export async function checkAchievements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tasks: true,
      achievements: true
    }
  });

  const uniCompleted = user.tasks.filter(t => t.category === 'UNIVERSITY' && t.isCompleted).length;
  const projectsCompleted = user.tasks.filter(t => t.category === 'PROJECTS' && t.isCompleted).length;
  const gymCompleted = user.tasks.filter(t => t.category === 'GYM' && t.isCompleted).length;

  const stats = {
    maxStreak: user.streakDays, // This should be fetched from habits
    totalPoints: user.totalPoints,
    uniCompleted,
    projectsCompleted,
    gymCompleted
  };

  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (achievement.condition(stats)) {
      const hasAchievement = user.achievements.some(a => a.title === achievement.title);

      if (!hasAchievement) {
        await prisma.achievement.create({
          data: {
            userId,
            badge: achievement.badge,
            title: achievement.title,
            unlockedAt: new Date()
          }
        });

        // Award 250 bonus points for achievement
        await prisma.user.update({
          where: { id: userId },
          data: { totalPoints: { increment: 250 } }
        });
      }
    }
  }
}
```

Call in API route after every completion:
```typescript
// In POST /api/habits/[id]/complete
await checkAchievements(userId);
```

---

### 3.3: Daily Analytics Snapshot

**File**: `app/api/cron/daily-snapshot/route.ts` (New - Cron Job)
```typescript
// Runs daily at midnight (via Vercel Cron or external scheduler)
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany();

    for (const user of users) {
      const tasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          completedAt: {
            gte: yesterday,
            lt: new Date(yesterday.getTime() + 86400000)
          }
        }
      });

      const tasksCompleted = tasks.length;
      const pointsEarned = tasks.reduce((sum, t) => sum + t.pointsValue, 0);

      // Count habits per category
      const habits = await prisma.habit.findMany({
        where: { userId: user.id },
        include: { habitLogs: true }
      });

      const categories = { UNIVERSITY: 0, PROJECTS: 0, GYM: 0 };
      for (const habit of habits) {
        const loggedYesterday = habit.habitLogs.some(log => {
          const logDate = new Date(log.dateCompleted);
          return logDate.getTime() >= yesterday.getTime() && 
                 logDate.getTime() < yesterday.getTime() + 86400000;
        });
        if (loggedYesterday) {
          categories[habit.category]++;
        }
      }

      const habitsCompleted = Object.values(categories).reduce((a, b) => a + b, 0);
      const completionRate = (tasksCompleted + habitsCompleted) / (Object.values(categories).length * 7 + tasksCompleted) * 100;

      await prisma.analyticsSnapshot.upsert({
        where: { userId_date: { userId: user.id, date: yesterday } },
        create: {
          userId: user.id,
          date: yesterday,
          tasksCompleted,
          habitsCompleted,
          pointsEarned,
          completionRate,
          universityCompleted: categories.UNIVERSITY,
          projectsCompleted: categories.PROJECTS,
          gymCompleted: categories.GYM
        },
        update: {
          tasksCompleted,
          habitsCompleted,
          pointsEarned,
          completionRate,
          universityCompleted: categories.UNIVERSITY,
          projectsCompleted: categories.PROJECTS,
          gymCompleted: categories.GYM
        }
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/daily-snapshot",
    "schedule": "0 0 * * *"
  }]
}
```

---

### Phase 3 Checkpoint
- [ ] Streaks calculated correctly for habits
- [ ] Achievements unlock when conditions met
- [ ] Daily analytics snapshots created
- [ ] Analytics tab displays weekly/monthly data
- [ ] Git commit: "Phase 3: Gamification + Analytics Engine"

---

## PHASE 4: AUTHENTICATION + ADVANCED FEATURES (Weeks 7-8)

### 4.1: Implement NextAuth.js

```bash
npm install next-auth
```

**File**: `app/api/auth/[...nextauth]/route.ts` (New)
```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) throw new Error('User not found');

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) throw new Error('Invalid password');

        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    }
  },
  pages: {
    signIn: '/login'
  }
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**File**: `app/(auth)/login/page.tsx` (New - Login Page)
```typescript
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await signIn('credentials', {
      email,
      password,
      redirect: true,
      callbackUrl: '/'
    });
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold text-slate-50 mb-6">Login to Planner Pro</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-slate-700 border border-slate-600 rounded text-slate-50"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 bg-slate-700 border border-slate-600 rounded text-slate-50"
        />
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
```

---

### 4.2: Add Freeze Day Feature

**File**: `app/api/habits/[id]/freeze/route.ts` (New)
```typescript
import { prisma } from '@/lib/prisma';

export async function POST(request, { params }) {
  const userId = request.headers.get('x-user-id');
  const { date, reason } = await request.json();

  const freezeDay = await prisma.freezeDay.create({
    data: {
      userId,
      habitId: params.id,
      freezeDate: new Date(date),
      reason
    }
  });

  return NextResponse.json(freezeDay);
}
```

---

### Phase 4 Checkpoint
- [ ] User registration and login working
- [ ] JWT tokens properly managed
- [ ] Protected routes require authentication
- [ ] Freeze day feature functional
- [ ] Git commit: "Phase 4: Authentication + Premium Features"

---

## PHASE 5: DEPLOYMENT + OPTIMIZATION (Weeks 9+)

### 5.1: Prepare for Deployment

```bash
# Build test
npm run build

# Environment variables (Vercel dashboard)
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.com
```

### 5.2: Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel deploy
```

### 5.3: Monitor & Optimize

- **Vercel Analytics**: Monitor page performance
- **Error tracking**: Set up Sentry for error monitoring
- **Database indexing**: Ensure all queries are fast
- **Caching strategy**: Implement Redis cache for frequently accessed data

---

## IMPLEMENTATION CHECKLIST

### Phase 1: UI ✅ nearly complete
- [x] Dashboard layout
- [x] Tab navigation
- [x] Gamification cards
- [ ] Animations
- [ ] Toast notifications

### Phase 2: Backend 🔜 next
- [ ] Database migration
- [ ] API routes (habits/tasks)
- [ ] Habit completion endpoint
- [ ] Fetch data from API

### Phase 3: Gamification
- [ ] Streak calculator
- [ ] Achievement system
- [ ] Daily analytics
- [ ] Charts on analytics tab

### Phase 4: Auth
- [ ] NextAuth setup
- [ ] Login/signup pages
- [ ] Protected routes

### Phase 5: Deployment
- [ ] Build on Vercel
- [ ] Connect PostgreSQL
- [ ] Domain setup
- [ ] Monitor with Sentry

---

## TIME ESTIMATE SUMMARY

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: UI | 2 weeks | 90% complete |
| Phase 2: Backend | 2 weeks | Not started |
| Phase 3: Gamification | 2 weeks | Not started |
| Phase 4: Auth | 2 weeks | Not started |
| Phase 5: Deployment | 1 week | Not started |
| **Total** | **~9 weeks** | **~10%** |

---

## QUICK START: Next Immediate Steps

1. **Today**: Complete Phase 1 UI polish (animations, toasts)
2. **Tomorrow**: Set up PostgreSQL & run Prisma migrations
3. **This week**: Build API routes for habits & tasks
4. **Next week**: Connect frontend to API (replace useState with useAPI hooks)

See `ARCHITECTURE.md` for detailed system design documentation.
