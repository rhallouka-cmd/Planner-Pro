# Habit + Task Tracker: Complete System Architecture

## Executive Summary
This document outlines the architecture for an advanced Habit + Task Tracker inspired by gamified productivity systems (Mindset Stack philosophy). The system combines real-time feedback, visual progression, and intelligent streak computation to drive consistency and reduce decision fatigue.

---

## 1. TECH STACK RECOMMENDATIONS

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: React Hooks + Context API (frontend) / Zustand (if scaling)
- **UI Components**: lucide-react for icons, Recharts/Chart.js for analytics
- **Form Handling**: React Hook Form + Zod for validation
- **Real-time Updates**: Optional: WebSockets via Socket.io for multi-device sync

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL (robust, ACID-compliant, excellent for streaks/analytics)
- **ORM**: Prisma (type-safe queries, excellent migrations)
- **Authentication**: NextAuth.js or Auth0 (JWT-based)
- **Caching**: Redis (optional, for real-time streak calculations)

### Deployment
- **Frontend + Backend**: Vercel (zero-config Next.js deployment)
- **Database**: Vercel Postgres or AWS RDS
- **CDN**: Vercel Edge Network (automatic)

---

## 2. DATABASE SCHEMA ARCHITECTURE

### Core Models

#### User Model
Stores user profile and global gamification stats:
```javascript
User {
  id: String (CUID)
  email: String (unique)
  name: String
  
  // Gamification Stats
  streakDays: Int (current consecutive days)
  totalPoints: Int (lifetime accumulated)
  level: Int (calculated from points thresholds)
  lastActiveDate: DateTime (for streak freeze detection)
  
  // Relations
  habits: Habit[]
  tasks: Task[]
  habitLogs: HabitLog[]
  achievements: Achievement[]
  analytics: AnalyticsSnapshot[]
  freezeDays: FreezeDay[]
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Why this structure:**
- Streaks calculated on daily frequency, not per-task
- Global level system motivates across all categories
- lastActiveDate enables automatic streak checks

---

#### Habit Model
Recurring daily habits (e.g., "Drink 3L water", "30min workout"):
```javascript
Habit {
  id: String
  title: String
  description: String?
  category: Enum (UNIVERSITY | PROJECTS | GYM)
  
  // Streak Metrics
  streakCount: Int (current consecutive days)
  maxStreak: Int (personal record)
  isCompletedToday: Boolean
  frequencyGoal: Int (default 7 = daily)
  pointsValue: Int (default 100 points per day)
  
  userId: String (foreign key)
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  user: User
  habitLogs: HabitLog[]
  freezeDays: FreezeDay[]
}
```

**Key Design Decisions:**
- `streakCount` vs `maxStreak` allows showing current + personal record
- `frequencyGoal` (e.g., 5 = 5x per week) enables flexible habits
- `pointsValue` per habit allows weighted gamification
- `category` enables per-category progress tracking

---

#### Task Model
One-time or deadline-based tasks (e.g., "Submit assignment by Friday"):
```javascript
Task {
  id: String
  title: String
  description: String?
  category: Enum (UNIVERSITY | PROJECTS | GYM)
  priority: Int (1-5, where 5 = critical)
  dueDate: DateTime?
  
  // Completion Tracking
  isCompleted: Boolean
  completedAt: DateTime?
  pointsValue: Int (default 50, scales with priority)
  
  userId: String
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  user: User
}
```

**Why separate from Habits:**
- Tasks have deadlines; habits repeat indefinitely
- Different completion semantics
- Allows deadline-based notifications

---

#### HabitLog Model
Transactional record of each habit completion (critical for streak calculation):
```javascript
HabitLog {
  id: String
  habitId: String (foreign key)
  dateCompleted: DateTime (date only, timezone-aware)
  userId: String (denormalized for query speed)
  pointsEarned: Int (100 by default)
  
  Unique: (habitId, dateCompleted)
  Indexes: userId, habitId
  
  // Relations
  habit: Habit
  user: User
}
```

**Critical Design:**
- **Unique constraint on (habitId, dateCompleted)** prevents double-logging same habit on same day
- **Timezone awareness** in dateCompleted prevents edge cases at midnight
- **Indexes on both userId and habitId** for fast queries

---

#### Achievement Model
Gamification badges and milestones:
```javascript
Achievement {
  id: String
  userId: String
  badge: String (emoji + title, e.g., "📚 Scholar")
  title: String (full name)
  description: String?
  category: TaskCategory?
  unlockedAt: DateTime
  
  // Relations
  user: User
}
```

**Achievement Types to Implement:**
- **Streak-based**: 🔥 7-Day Streak, 🔥 30-Day Streak, 🔥 100-Day Streak
- **Point-based**: ⭐ 1K Points, ⭐ 5K Points, 💎 10K Points
- **Category-mastery**: 📚 Scholar (50 uni tasks), 🚀 DevOps (50 projects), 💪 Gym Bro (50 gym tasks)
- **Consistency**: 🎯 Perfect Week (100% daily), 🌟 On Fire (3-week streak)

---

#### AnalyticsSnapshot Model
Daily snapshot for efficient reporting (prevents recalculating every query):
```javascript
AnalyticsSnapshot {
  id: String
  userId: String
  date: DateTime (unique per user, per day)
  
  // Daily Aggregates
  tasksCompleted: Int
  habitsCompleted: Int
  pointsEarned: Int
  completionRate: Float (0-100%)
  
  // Category Breakdown
  universityCompleted: Int
  projectsCompleted: Int
  gymCompleted: Int
  
  // Relations
  user: User
}
```

**Why Snapshots?**
- Reporting queries across weeks/months become O(30) instead of O(1000+)
- Enables trends without expensive JOIN queries
- Historical data audit trail

---

#### FreezeDay Model
Allows users to pause streaks without losing count (premium feature):
```javascript
FreezeDay {
  id: String
  userId: String
  habitId: String
  freezeDate: DateTime
  reason: String?
  
  Unique: (habitId, freezeDate)
  
  // Relations
  user: User
  habit: Habit
}
```

**Use Case:**
- User gets sick, travels, or has valid excuse
- Admin can approve freeze without hard reset
- UI shows "frozen" day in streak calendar

---

## 3. STREAK & GAMIFICATION LOGIC

### Streak Calculation Algorithm

#### Daily Streak Algorithm
```typescript
// Database-driven approach (batch daily)
async function updateStreaks(userId: string, today: Date) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      habits: {
        include: {
          habitLogs: {
            where: { dateCompleted: { gte: oneMonthAgo(today) } },
            orderBy: { dateCompleted: 'desc' }
          }
        }
      }
    }
  });

  // For each habit, calculate streak
  for (const habit of user.habits) {
    const streakDays = calculateStreakDays(habit.habitLogs, today);
    const newMaxStreak = Math.max(habit.maxStreak, streakDays);
    
    await db.habit.update({
      where: { id: habit.id },
      data: {
        streakCount: streakDays,
        maxStreak: newMaxStreak
      }
    });
  }
}

// Helper: Calculate consecutive days
function calculateStreakDays(
  logs: HabitLog[],
  today: Date,
  frequencyGoal: number = 7
): number {
  if (logs.length === 0) return 0;
  
  let streak = 0;
  let currentDate = normalizeDate(today);
  
  // Walk backwards from today
  while (true) {
    // Check if logged on currentDate or freeze applied
    const hasLog = logs.some(
      log => normalizeDate(log.dateCompleted) === currentDate
    );
    
    if (!hasLog) break;
    
    streak++;
    currentDate = addDays(currentDate, -1);
  }
  
  return streak;
}
```

#### Freeze Day Logic
```typescript
function isStreakFrozen(
  freezeDays: FreezeDay[],
  dateToCheck: Date
): boolean {
  return freezeDays.some(
    freeze => normalizeDate(freeze.freezeDate) === normalizeDate(dateToCheck)
  );
}

// In streak calculation, if freeze exists, skip that day:
function calculateStreakDaysWithFreeze(
  logs: HabitLog[],
  freezeDays: FreezeDay[],
  today: Date
): number {
  let streak = 0;
  let currentDate = normalizeDate(today);
  
  while (true) {
    const hasLog = logs.some(
      log => normalizeDate(log.dateCompleted) === currentDate
    );
    
    const isFrozen = isStreakFrozen(freezeDays, currentDate);
    
    // Streak continues if log OR freeze exists
    if (!hasLog && !isFrozen) break;
    
    if (hasLog) streak++; // Only count actual logs, not freezes
    currentDate = addDays(currentDate, -1);
  }
  
  return streak;
}
```

---

### Points & Leveling System

#### Points Calculation
```typescript
const POINTS_TABLE = {
  habitCompletion: 100,           // Each habit per day
  taskCompletion: 50,             // Each task
  taskCompletionBonus: {
    critical: 150,                // Priority = 5
    high: 120,                    // Priority = 4
    medium: 100,                  // Priority = 3
  },
  streakBonus: {
    7days: 50,                    // +50 points at 7-day streak
    14days: 100,
    30days: 500,
    100days: 1000,
  },
  achievementBonus: 250,           // One-time per achievement
};

// On completion:
async function awardPoints(
  userId: string,
  sourceType: 'habit' | 'task',
  sourceId: string,
  basePoints: number
) {
  // Award base points
  let totalPoints = basePoints;
  
  // Check for streak bonuses (if 7, 14, 30, 100-day milestone)
  const habit = await db.habit.findUnique({ where: { id: sourceId } });
  if (POINTS_TABLE.streakBonus[habit.streakCount]) {
    totalPoints += POINTS_TABLE.streakBonus[habit.streakCount];
  }
  
  // Award to user
  await db.user.update({
    where: { id: userId },
    data: { totalPoints: { increment: totalPoints } }
  });
  
  return totalPoints;
}
```

#### Level Progression
```typescript
// Exponential progression: Level N requires 1000 * (1.5^N) points
function calculateLevel(totalPoints: number): number {
  let level = 1;
  let requiredPoints = 1000;
  
  while (totalPoints >= requiredPoints) {
    totalPoints -= requiredPoints;
    level++;
    requiredPoints = Math.floor(1000 * Math.pow(1.5, level - 1));
  }
  
  return level;
}

function getNextLevelThreshold(currentLevel: number): number {
  return Math.floor(1000 * Math.pow(1.5, currentLevel - 1));
}

// Display: "Level 5 • 2,450 / 3,375 points to Level 6"
```

---

### Achievement Unlock Logic

```typescript
async function checkAchievements(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      habits: { include: { habitLogs: true } },
      tasks: true,
      achievements: true
    }
  });

  // Streak achievements
  const maxStreakHabit = Math.max(...user.habits.map(h => h.maxStreak));
  if (maxStreakHabit >= 7 && !hasAchievement('7streak')) {
    await awardAchievement(userId, '🔥 Week Warrior', '7-day streak');
  }
  if (maxStreakHabit >= 30 && !hasAchievement('30streak')) {
    await awardAchievement(userId, '🔥 Month Master', '30-day streak');
  }

  // Points achievements
  if (user.totalPoints >= 1000 && !hasAchievement('1kpoints')) {
    await awardAchievement(userId, '⭐ Rising Star', '1,000 points earned');
  }

  // Category mastery (50+ completions)
  const uniTasks = user.tasks.filter(t => t.category === 'UNIVERSITY');
  const uniCompleted = uniTasks.filter(t => t.isCompleted).length;
  if (uniCompleted >= 50 && !hasAchievement('unimaster')) {
    await awardAchievement(userId, '📚 Scholar', '50 university tasks');
  }

  // Consistency (Perfect week)
  const thisWeekHabits = await countWeeklyHabits(userId);
  const thisWeekLogged = await countWeeklyLogs(userId);
  if (thisWeekLogged === thisWeekHabits * 7) {
    await awardAchievement(userId, '🎯 Perfect Week', '100% weekly completion');
  }
}
```

---

## 4. UI/UX COMPONENT ARCHITECTURE

### Page Structure
```
Dashboard (default tab)
├── Gamification Score Card (4 columns)
│   ├── Streak (days)
│   ├── Points (total)
│   ├── Level (current)
│   └── Today's %-age
├── Hero Progress Section
│   ├── Streak flame badge
│   ├── Daily completion % bar
│   ├── Task stats (total/completed/remaining)
└── Add Task Form + Category Grid
    ├── Input field
    ├── Category dropdown
    ├── Submit button
    └── 3-column (University | Projects | Gym)
        ├── Card header with counts
        ├── Progress bar (mini)
        └── Task list with edit/delete

Analytics Tab
├── Weekly Completion Chart
├── Category Performance breakdown
└── Achievements gallery

Category Tabs (University, Projects, Gym)
└── Detailed view of that category
```

### Dark Mode Design System
```css
/* Color Palette */
Primary BG: slate-950 (rgb(2, 8, 23))
Secondary BG: slate-900/50, slate-800/50
Border: slate-700 (rgb(51, 65, 85))

Accents by Category:
- University: indigo (500-600)
- Projects: purple (500-600)
- Gym: cyan (400-500)

Text:
- Primary: slate-50
- Secondary: slate-400
- Disabled: slate-600

Gradients:
- Progress: indigo → purple → cyan
- Streak: orange → red
```

### Interactive Elements

#### Dropdown Menus (Navigation)
- Notifications: Recent activity, streak alerts, achievement unlocked
- Settings: Theme, notifications, gamification preferences, privacy
- Profile: User level + points, achievements list, stats, logout

#### Task Item Interactions
- Hover: Show edit/delete buttons, highlight background
- Click checkbox: Toggle completion (instant feedback)
- Edit mode: Inline input with Enter to save or X to cancel
- On deletion: Optional confirm modal

#### Progress Animations
- Streak flame: Pulse glow effect when unlocking milestones
- Progress bar: Smooth transition over 700ms when updated
- Points counter: Brief scale animation (+50 popup overlay)
- Level up: Large toast notification with confetti (optional)

---

## 5. API ROUTES ARCHITECTURE

### Required API Endpoints

#### Habits
```
GET    /api/habits              → List all habits for user
POST   /api/habits              → Create new habit
GET    /api/habits/:id          → Get habit detail
PUT    /api/habits/:id          → Update habit
DELETE /api/habits/:id          → Delete habit
POST   /api/habits/:id/complete → Log completion today
POST   /api/habits/:id/freeze   → Freeze streak day
```

#### Tasks
```
GET    /api/tasks               → List all tasks (with filters)
POST   /api/tasks               → Create new task
GET    /api/tasks/:id           → Get task detail
PUT    /api/tasks/:id           → Update task
DELETE /api/tasks/:id           → Delete task
POST   /api/tasks/:id/complete  → Mark task complete
```

#### User / Gamification
```
GET    /api/user/profile        → User + stats
PUT    /api/user/profile        → Update profile
GET    /api/user/achievements   → List earned achievements
GET    /api/user/analytics      → Weekly/monthly breakdown
POST   /api/auth/login          → Sign in
POST   /api/auth/logout         → Sign out
```

#### Admin (Optional)
```
PUT    /api/admin/freeze-day    → Approve freeze request
POST   /api/admin/reset-streak  → Emergency streak reset
```

---

## 6. STATE MANAGEMENT FLOW

### Frontend State (React Hooks - MVP Phase)
```typescript
// Dashboard component
const [habits, setHabits] = useState<Habit[]>([]);
const [tasks, setTasks] = useState<Task[]>([]);
const [user, setUser] = useState<User>(null);
const [stats, setStats] = useState({
  streakDays: 0,
  totalPoints: 0,
  level: 1,
  completionToday: 0
});
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// UI state
const [activeTab, setActiveTab] = useState('dashboard');
const [showDropdowns, setShowDropdowns] = useState({
  notifications: false,
  settings: false,
  profile: false
});
```

### Backend State (Database + Cache)
- **Habits & Tasks**: Prisma queries
- **User Stats**: Cached in Redis for 1 hour (optional optimization)
- **HabitLogs**: Transactional (direct DB)
- **Analytics**: Pre-calculated daily snapshots

---

## 7. REAL-TIME FEATURES (Phase 2)

### Instant Feedback Loop
1. **User clicks "complete" button** → UI optimistically updates
2. **API call sent** → `POST /api/habits/:id/complete`
3. **Server validates** → Checks for duplicates, awards points
4. **Analytics updated** → HabitLog created, user points incremented
5. **Response received** → UI confirms, shows point animation
6. **Background job** → Recalculates streak, checks achievements

### Optional WebSocket Integration (Phase 2)
```typescript
// Real-time sync across devices
socket.on('habit-completed', (habitId) => {
  // Refresh that habit + global stats
  fetchHabitData(habitId);
  fetchUserStats();
});
```

---

## 8. PERFORMANCE OPTIMIZATION STRATEGIES

### Database Indexes (Critical)
```sql
-- Prisma handles, but important queries:
CREATE INDEX idx_habits_userId ON habits(user_id);
CREATE INDEX idx_habitlogs_userId ON habit_logs(user_id);
CREATE INDEX idx_habitlogs_habitId_date ON habit_logs(habit_id, date_completed);
CREATE INDEX idx_tasks_userId_category ON tasks(user_id, category);
```

### Caching Strategy
- **User profile**: Cache 1 hour (Redis)
- **Habit list**: Cache 10 minutes (Redis)
- **Daily analytics**: Cache until next day (Redis)
- **Achievements**: Cache 1 hour (Redis)

### Query Optimization
- Use `include` in Prisma selectively (avoid N+1)
- Batch operations: Update 10 habits in one query instead of 10 separate
- Pre-calculate analytics daily instead of on-demand

### Frontend Optimization
- Code-split dashboard into lazy-loaded tabs
- Memoize category cards (React.memo)
- Debounce rapid task creation
- Use virtual scrolling for 1000+ historical tasks

---

## 9. SECURITY CONSIDERATIONS

### Authentication
- JWT tokens (NextAuth.js)
- Secure HTTP-only cookies
- CSRF protection on mutations

### Data Privacy
- Row-level security: Users can only see their own data
- Email verification for signup
- Password hashing (bcrypt, min 10 rounds)

### API Rate Limiting
```typescript
// 100 requests per 15 minutes per user
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user.id
});
```

### Validation
- Client: Zod schema validation
- Server: Always re-validate (never trust client input)
- Sanitize strings to prevent XSS

---

## 10. ERROR HANDLING & MONITORING

### Error Types
```typescript
// Client Errors (4xx)
- 400 Bad Request (invalid habit data)
- 401 Unauthorized (not logged in)
- 404 Not Found (habit doesn't exist)
- 409 Conflict (duplicate habit completion today)

// Server Errors (5xx)
- 500 Internal Server Error
- 503 Service Unavailable (DB down)

// Client-side error UI:
- Toast notifications for user-facing errors
- Error boundary component for React crashes
- Sentry integration for production monitoring
```

### Logging
```typescript
// Log to console in dev, Datadog in production
logger.info(`User ${userId} completed habit ${habitId}`);
logger.error(`Database connection timeout`, { userId });
logger.warn(`Achievement check took 2.5s for ${userId}`);
```

---

## GLOSSARY

| Term | Definition |
|------|-----------|
| **Streak** | Consecutive days completing a habit without missing |
| **Freeze Day** | Admin-approved skip of a day without breaking streak |
| **Max Streak** | Personal record of longest consecutive streak |
| **Points** | Gamification currency earned from completions |
| **Level** | User progression tier; unlocked by point thresholds |
| **Achievement** | Badge earned for milestones (7-day streak, 1K points) |
| **HabitLog** | Database record of habit completion on specific date |
| **Analytics Snapshot** | Daily pre-calculated aggregates for reporting |
| **Frequency Goal** | Target completion rate (e.g., 7x per week) |

---

## NEXT STEPS

See `IMPLEMENTATION_ROADMAP.md` for Phase-by-Phase execution plan.
