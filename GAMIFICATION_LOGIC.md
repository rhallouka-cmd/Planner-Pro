# Streak & Gamification Logic: Deep Dive

## 1. STREAK CALCULATION ALGORITHM

### Overview
Streaks are the heart of habit formation psychology. A streak represents consecutive days of completing a habit, and the longer the streak, the stronger the motivation to maintain it.

### Architecture Decision: User-Level vs Habit-Level Streaks

We use **BOTH**:
1. **Per-habit streak**: Tracks "I've done this habit for X consecutive days"
2. **User-level streak**: Tracks "I've been productive for X consecutive days" (any habit+task)

**Why both?**
- Per-habit streaks motivate specific behaviors
- User-level streaks create global motivation and sense of momentum
- Achievement unlocks happen at user-level (🔥 7-Day Streak is any activity)

---

### Per-Habit Streak Calculation

```typescript
// Database query structure
async calculateHabitStreak(habitId: string, today: Date): Promise<number> {
  // Get all habit logs sorted by date (newest first)
  const logs = await db.habitLog.findMany({
    where: { habitId },
    orderBy: { dateCompleted: 'desc' },
    select: { dateCompleted: true }
  });

  // Edge case: No logs
  if (logs.length === 0) return 0;

  let streak = 0;
  let expectedDate = normalizeDate(today); // Remove time component

  for (const log of logs) {
    const logDate = normalizeDate(log.dateCompleted);

    // Check if log matches expected date OR freeze day exists
    if (this.isSameDay(logDate, expectedDate)) {
      streak++;
      expectedDate = addDays(expectedDate, -1);
    } 
    else if (this.isFrozenDay(habitId, expectedDate)) {
      // Skip frozen day without breaking streak
      expectedDate = addDays(expectedDate, -1);
    } 
    else {
      // Gap found, streak ends
      break;
    }
  }

  return streak;
}

// Helper: Normalize date to midnight (remove timezone issues)
function normalizeDate(date: Date): Date {
  const d = new Date(date);
  d.setUTC Hours(0, 0, 0, 0);
  return d;
}

// Helper: Check if date is frozen for this habit
async function isFrozenDay(habitId: string, date: Date): Promise<boolean> {
  const freeze = await db.freezeDay.findUnique({
    where: {
      habitId_freezeDate: {
        habitId,
        freezeDate: normalizeDate(date)
      }
    }
  });
  return !!freeze;
}
```

### User-Level Streak Calculation

```typescript
async calculateUserStreak(userId: string, today: Date): Promise<number> {
  // Get all habit + task completions
  const habitLogs = await db.habitLog.findMany({
    where: { userId },
    select: { dateCompleted: true }
  });

  const taskCompletions = await db.task.findMany({
    where: { userId, isCompleted: true },
    select: { completedAt: true }
  });

  // Merge and deduplicate by date
  const dates = new Set<string>();
  
  for (const log of habitLogs) {
    const day = normalizeDate(log.dateCompleted).toISOString().split('T')[0];
    dates.add(day);
  }

  for (const task of taskCompletions) {
    const day = normalizeDate(task.completedAt).toISOString().split('T')[0];
    dates.add(day);
  }

  // Sort descending and calculate streak
  const sortedDates = Array.from(dates).sort().reverse();
  let streak = 0;
  let expectedDate = normalizeDate(today).toISOString().split('T')[0];

  for (const dateStr of sortedDates) {
    if (dateStr === expectedDate) {
      streak++;
      const d = new Date(expectedDate);
      d.setDate(d.getDate() - 1);
      expectedDate = d.toISOString().split('T')[0];
    } else {
      break;
    }
  }

  return streak;
}
```

### Update Streaks: Batch Job

Run **daily at midnight (UTC)** to recalculate all streaks:

```typescript
// app/api/cron/update-streaks/route.ts
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const today = new Date();

    // Update all users' global streak
    const allUsers = await prisma.user.findMany();
    for (const user of allUsers) {
      const streak = await calculateUserStreak(user.id, today);
      await prisma.user.update({
        where: { id: user.id },
        data: { streakDays: streak }
      });
    }

    // Update all habits' streaks
    const allHabits = await prisma.habit.findMany();
    for (const habit of allHabits) {
      const streak = await calculateHabitStreak(habit.id, today);
      const maxStreak = Math.max(habit.maxStreak, streak);
      
      await prisma.habit.update({
        where: { id: habit.id },
        data: { 
          streakCount: streak,
          maxStreak
        }
      });

      // Check for streak milestones and award bonus points
      if (streak > 0 && streak % 7 === 0) {
        // Award 500 bonus points at 7, 14, 21, 30, etc. days
        const bonusPoints = 100 * (streak / 7); // 100, 200, 300, etc.
        await prisma.user.update({
          where: { id: habit.userId },
          data: { totalPoints: { increment: bonusPoints } }
        });
      }
    }

    return Response.json({ success: true, usersUpdated: allUsers.length });
  } catch (error) {
    console.error('Streak update failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-streaks",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 2. POINTS & LEVELING SYSTEM

### Points Table (Customizable)

```typescript
const POINTS_CONFIG = {
  // Base completion points
  completion: {
    habit: 100,              // Per habit per day
    task: 50,                // Per task (base)
  },

  // Priority multiplier (for tasks)
  priority: {
    1: 1.0,                  // Low: 1x | 50 points
    2: 1.2,                  // | 60 points
    3: 1.5,                  // Medium: 1.5x | 75 points
    4: 2.0,                  // High: 2x | 100 points
    5: 3.0,                  // Critical: 3x | 150 points
  },

  // Category boosts (can be configured per user)
  categoryBoost: {
    UNIVERSITY: 1.1,         // +10% (focus on productivity)
    PROJECTS: 1.2,           // +20% (harder work)
    GYM: 1.0,                // 1x
  },

  // Streak bonuses
  streakBonus: {
    7: 25,                   // +25 points at 7-day streak
    14: 50,
    21: 100,
    30: 200,
    60: 500,
    100: 1000,
    365: 5000,
  },

  // Time-based bonuses
  consistency: {
    perfectWeek: 250,        // 100% completion for 7 days
    perfectMonth: 1000,      // 100% completion for 30 days
    earlyCompletion: 25,     // Before 9 AM (if applicable)
  },

  // Milestones
  milestone: {
    firstTask: 50,           // User's first task
    levelUp: 100,            // On each level up
    achievement: 250,        // Per achievement unlocked
  }
};
```

### Points Calculation Function

```typescript
interface PointCalculationInput {
  userId: string;
  sourceType: 'habit' | 'task';
  habitId?: string;
  taskId?: string;
  taskPriority?: number;
  category: 'UNIVERSITY' | 'PROJECTS' | 'GYM';
  completedAt?: Date;
}

async function calculateAndAwardPoints(input: PointCalculationInput): Promise<number> {
  let basePoints = 0;
  let totalBonus = 0;

  // 1. BASE POINTS
  if (input.sourceType === 'habit') {
    basePoints = POINTS_CONFIG.completion.habit;
  } else {
    basePoints = POINTS_CONFIG.completion.task;
    
    // Apply priority multiplier if task
    if (input.taskPriority) {
      const multiplier = POINTS_CONFIG.priority[input.taskPriority] || 1;
      basePoints = Math.floor(basePoints * multiplier);
    }
  }

  // 2. CATEGORY BOOST
  const categoryBoost = POINTS_CONFIG.categoryBoost[input.category] || 1;
  const boostedPoints = Math.floor(basePoints * categoryBoost);

  // 3. STREAK BONUS (if applicable)
  if (input.habitId) {
    const habit = await db.habit.findUnique({ where: { id: input.habitId } });
    if (POINTS_CONFIG.streakBonus[habit.streakCount]) {
      totalBonus += POINTS_CONFIG.streakBonus[habit.streakCount];
    }
  }

  // 4. TIME-BASED BONUS (if completed early)
  if (input.completedAt) {
    const hour = input.completedAt.getHours();
    if (hour < 9) {
      totalBonus += POINTS_CONFIG.consistency.earlyCompletion;
    }
  }

  // 5. UPDATE USER
  const totalPoints = boostedPoints + totalBonus;

  await db.user.update({
    where: { id: input.userId },
    data: { totalPoints: { increment: totalPoints } }
  });

  await db.habitLog.create({
    data: {
      userId: input.userId,
      habitId: input.habitId || 'N/A',
      pointsEarned: totalPoints,
      dateCompleted: new Date()
    }
  });

  return totalPoints;
}
```

### Level System

Exponential progression keeps leveling interesting:

```typescript
// Level thresholds: 1000 * 1.5^(level-1)
const LEVEL_THRESHOLDS = [
  0,      // Level 1: 0
  1000,   // Level 2: 1,000
  1500,   // Level 3: 1,500
  2250,   // Level 4: 2,250
  3375,   // Level 5: 3,375
  5062,   // Level 6: 5,062
  7593,   // Level 7: 7,593
  11390,  // Level 8: 11,390
  17085,  // Level 9: 17,085
  25627,  // Level 10: 25,627
];

function calculateLevel(totalPoints: number): { level: number; nextThreshold: number; progress: number } {
  let level = 1;
  
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  // Calculate progress to next level
  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 1.5;
  
  const pointsInLevel = totalPoints - currentThreshold;
  const pointsNeededForLevel = nextThreshold - currentThreshold;
  const progress = Math.round((pointsInLevel / pointsNeededForLevel) * 100);

  return {
    level,
    nextThreshold,
    progress: Math.min(progress, 100)
  };
}

// Usage:
const userStats = calculateLevel(8450);
// { level: 5, nextThreshold: 3375, progress: 75 }

// UI Display: "Level 5 • 75% to Level 6 • 8,450 / 3,375 points"
```

---

## 3. ACHIEVEMENT SYSTEM

### Achievement Types

```typescript
interface Achievement {
  id: string;
  key: string;              // Unique identifier
  badge: string;            // Emoji
  title: string;
  description: string;
  category?: 'STREAK' | 'POINTS' | 'MASTERY' | 'CONSISTENCY';
  pointsReward: number;
}

const ACHIEVEMENTS: Record<string, Achievement> = {
  'first_task': {
    badge: '🎯',
    title: 'Quick Start',
    description: 'Create your first task',
    category: 'CONSISTENCY',
    pointsReward: 50
  },
  'first_habit': {
    badge: '🌱',
    title: 'Habit Former',
    description: 'Create your first habit',
    category: 'CONSISTENCY',
    pointsReward: 50
  },
  'week_streak': {
    badge: '🔥',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'STREAK',
    pointsReward: 250
  },
  'month_streak': {
    badge: '🔥',
    title: 'Month Master',
    description: 'Maintain a 30-day streak',
    category: 'STREAK',
    pointsReward: 500
  },
  '100_day_streak': {
    badge: '🔥',
    title: 'Century Club',
    description: 'Maintain a 100-day streak',
    category: 'STREAK',
    pointsReward: 1000
  },
  '1k_points': {
    badge: '⭐',
    title: 'Rising Star',
    description: 'Earn 1,000 points',
    category: 'POINTS',
    pointsReward: 100
  },
  '5k_points': {
    badge: '⭐',
    title: 'Shining Star',
    description: 'Earn 5,000 points',
    category: 'POINTS',
    pointsReward: 250
  },
  '10k_points': {
    badge: '💎',
    title: 'Legendary Performer',
    description: 'Earn 10,000 points',
    category: 'POINTS',
    pointsReward: 500
  },
  'uni_master': {
    badge: '📚',
    title: 'Scholar',
    description: 'Complete 50 university tasks',
    category: 'MASTERY',
    pointsReward: 300
  },
  'projects_master': {
    badge: '🚀',
    title: 'DevOps Master',
    description: 'Complete 50 project tasks',
    category: 'MASTERY',
    pointsReward: 300
  },
  'gym_master': {
    badge: '💪',
    title: 'Fitness Beast',
    description: 'Complete 50 gym tasks',
    category: 'MASTERY',
    pointsReward: 300
  },
  'perfect_week': {
    badge: '🎯',
    title: 'Perfect Week',
    description: 'Achieve 100% completion for 7 days',
    category: 'CONSISTENCY',
    pointsReward: 350
  },
  'perfect_month': {
    badge: '👑',
    title: 'Legendary Month',
    description: 'Achieve 100% completion for 30 days',
    category: 'CONSISTENCY',
    pointsReward: 1000
  }
};
```

### Achievement Checker

```typescript
async function checkAndUnlockAchievements(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      tasks: true,
      habits: true,
      achievements: true,
      habitLogs: true
    }
  });

  const alreadyUnlocked = user.achievements.map(a => a.title);

  // Check each achievement condition
  const checks = [
    // Streak achievements
    {
      key: 'week_streak',
      condition: () => user.streakDays >= 7,
      check: !alreadyUnlocked.includes('Week Warrior')
    },
    {
      key: 'month_streak',
      condition: () => user.streakDays >= 30,
      check: !alreadyUnlocked.includes('Month Master')
    },
    {
      key: '100_day_streak',
      condition: () => user.streakDays >= 100,
      check: !alreadyUnlocked.includes('Century Club')
    },

    // Points achievements
    {
      key: '1k_points',
      condition: () => user.totalPoints >= 1000,
      check: !alreadyUnlocked.includes('Rising Star')
    },
    {
      key: '5k_points',
      condition: () => user.totalPoints >= 5000,
      check: !alreadyUnlocked.includes('Shining Star')
    },
    {
      key: '10k_points',
      condition: () => user.totalPoints >= 10000,
      check: !alreadyUnlocked.includes('Legendary Performer')
    },

    // Category mastery
    {
      key: 'uni_master',
      condition: () => user.tasks.filter(t => t.category === 'UNIVERSITY' && t.isCompleted).length >= 50,
      check: !alreadyUnlocked.includes('Scholar')
    },
    {
      key: 'projects_master',
      condition: () => user.tasks.filter(t => t.category === 'PROJECTS' && t.isCompleted).length >= 50,
      check: !alreadyUnlocked.includes('DevOps Master')
    },
    {
      key: 'gym_master',
      condition: () => user.tasks.filter(t => t.category === 'GYM' && t.isCompleted).length >= 50,
      check: !alreadyUnlocked.includes('Fitness Beast')
    }
  ];

  // Unlock achievements
  for (const check of checks) {
    if (check.check && check.condition()) {
      const achievement = ACHIEVEMENTS[check.key];
      
      await db.achievement.create({
        data: {
          userId,
          badge: achievement.badge,
          title: achievement.title,
          description: achievement.description,
          category: achievement.category,
          unlockedAt: new Date()
        }
      });

      // Award bonus points
      await db.user.update({
        where: { id: userId },
        data: { totalPoints: { increment: achievement.pointsReward } }
      });

      // Trigger notification
      console.log(`✨ Achievement unlocked: ${achievement.title}`);
    }
  }
}
```

---

## 4. FREEZE DAY FEATURE

Allows users to pause streaks without resetting:

```typescript
// User gets sick, travels, etc. → Request freeze
// Admin approves → Day is marked as frozen
// Streak calculation treats frozen days as "maintained"

async function freezeDay(habitId: string, date: Date, reason: string) {
  const freeze = await db.freezeDay.create({
    data: {
      habitId,
      freezeDate: normalizeDate(date),
      reason,
      status: 'PENDING'  // Admin approval
    }
  });

  return freeze;
}

// In streak calculator:
if (isFrozenDay(habitId, date)) {
  // Skip this day in streak calculation
  expectedDate = addDays(expectedDate, -1);
  continue;
}
```

---

## 5. REAL-TIME FEEDBACK LOOP

When user completes a habit:

```
1. [UI] Button shows loading spinner
   ↓
2. [Client] API call to POST /api/habits/:id/complete
   ↓
3. [Server] Validate (no duplicate today)
   ↓
4. [Server] Create HabitLog entry
   ↓
5. [Server] Award base points (100)
   ↓
6. [Server] Calculate streak
   ↓
7. [Server] Check streak milestones (7-day bonus: +100 points)
   ↓
8. [Server] Check achievements
   ↓
9. [Server] Return: { pointsEarned: 100, streakDays: 5, ... }
   ↓
10. [UI] Show toast: "+100 points! 🎉"
    ↓
11. [UI] Animate progress bar to 100%
    ↓
12. [UI] Disable button or show "Completed today!"
```

---

## 6. TESTING STREAK CALCULATION

```typescript
import { calculateHabitStreak } from '@/lib/streakCalculator';

describe('Habit Streak Calculator', () => {
  it('returns 0 for new habit with no logs', () => {
    const streak = calculateHabitStreak([], new Date());
    expect(streak).toBe(0);
  });

  it('calculates consecutive streak correctly', () => {
    const today = new Date();
    const yesterday = addDays(today, -1);
    const twoDaysAgo = addDays(today, -2);

    const logs = [
      { dateCompleted: today },
      { dateCompleted: yesterday },
      { dateCompleted: twoDaysAgo }
    ];

    const streak = calculateHabitStreak(logs, today);
    expect(streak).toBe(3);
  });

  it('breaks streak on gap', () => {
    const today = new Date();
    const yesterday = addDays(today, -1);
    const threeDaysAgo = addDays(today, -3);

    const logs = [
      { dateCompleted: today },
      { dateCompleted: yesterday },
      { dateCompleted: threeDaysAgo }  // Gap on 2 days ago
    ];

    const streak = calculateHabitStreak(logs, today);
    expect(streak).toBe(2);  // Only today + yesterday
  });

  it('respects freeze days', () => {
    const today = new Date();
    const yesterday = addDays(today, -1);
    const threeDaysAgo = addDays(today, -3);

    const logs = [
      { dateCompleted: today },
      { dateCompleted: threeDaysAgo }
    ];

    const freezeDays = [normalizeDate(yesterday)];

    const streak = calculateHabitStreak(logs, today, freezeDays);
    expect(streak).toBe(3);  // Frozen day doesn't break it
  });
});
```

---

## Summary: Key Takeaways

1. **Streaks**: Use date normalization to avoid timezone bugs
2. **Points**: Base + category multiplier + streak bonus + time bonus
3. **Levels**: Exponential progression keeps users engaged
4. **Achievements**: Variety of conditions (streaks, points, mastery, consistency)
5. **Freeze Days**: Prevent demotivation from life events
6. **Batch Jobs**: Recalculate streaks daily, not on every completion
7. **Real-time Feedback**: Show points/achievement immediately, recalculate in background

See `ARCHITECTURE.md` for full system design.
