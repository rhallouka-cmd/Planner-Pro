import { prisma } from './prisma';

// Achievement definitions with unlock requirements
export const ACHIEVEMENTS = {
  FIRST_HABIT: {
    id: 'first_habit',
    name: '🚀 Getting Started',
    description: 'Complete your first habit',
    icon: '🚀',
  },
  STREAK_7: {
    id: 'streak_7',
    name: '🔥 Week Warrior',
    description: 'Achieve a 7-day streak',
    icon: '🔥',
  },
  STREAK_30: {
    id: 'streak_30',
    name: '💪 Month Master',
    description: 'Achieve a 30-day streak',
    icon: '💪',
  },
  STREAK_100: {
    id: 'streak_100',
    name: '👑 Century King',
    description: 'Achieve a 100-day streak',
    icon: '👑',
  },
  POINTS_100: {
    id: 'points_100',
    name: '💰 Century Collector',
    description: 'Earn 100 points',
    icon: '💰',
  },
  POINTS_500: {
    id: 'points_500',
    name: '💎 Wealthy Warrior',
    description: 'Earn 500 points',
    icon: '💎',
  },
  POINTS_1000: {
    id: 'points_1000',
    name: '👸 Point Royalty',
    description: 'Earn 1000 points',
    icon: '👸',
  },
  ALL_CATEGORIES: {
    id: 'all_categories',
    name: '🎯 Balanced Life',
    description: 'Complete habits in all 3 categories',
    icon: '🎯',
  },
  LEVEL_5: {
    id: 'level_5',
    name: '⭐ Productivity Ninja',
    description: 'Reach level 5',
    icon: '⭐',
  },
} as const;

// Points to level conversion
export const LEVEL_THRESHOLDS = {
  1: 0,
  2: 200,
  3: 500,
  4: 1000,
  5: 2000,
  6: 3500,
  7: 5000,
  8: 7500,
  9: 10000,
  10: 15000,
} as const;

/**
 * Calculate the current streak for a habit based on HabitLog entries
 */
export async function calculateStreak(habitId: string, userId: string): Promise<number> {
  const logs = await prisma.habitLog.findMany({
    where: { habitId, userId },
    orderBy: { dateCompleted: 'desc' },
    take: 100,
  });

  if (logs.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i < logs.length; i++) {
    const logDate = new Date(logs[i].dateCompleted);
    logDate.setUTCHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setUTCDate(expectedDate.getUTCDate() - i);

    if (logDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate user's overall streak (minimum streak across all habits)
 */
export async function calculateUserStreak(userId: string): Promise<number> {
  const habits = await prisma.habit.findMany({
    where: { userId },
    select: { id: true },
  });

  if (habits.length === 0) return 0;

  const streaks = await Promise.all(
    habits.map((habit) => calculateStreak(habit.id, userId))
  );

  // User's streak is the minimum (they must maintain all habits)
  return Math.min(...streaks);
}

/**
 * Calculate level based on total points
 */
export function calculateLevel(points: number): number {
  const thresholds = Object.entries(LEVEL_THRESHOLDS)
    .sort(([levelA], [levelB]) => Number(levelB) - Number(levelA));

  for (const [level, threshold] of thresholds) {
    if (points >= threshold) {
      return Number(level);
    }
  }

  return 1;
}

/**
 * Check and unlock achievements for a user
 */
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { achievements: true, habitLogs: true, habits: true },
  });
  if (!user) return [];

  const unlockedAchievements: string[] = [];
  const existingAchievementIds = (user.achievements || []).map((a) => a.id);

  // Check each achievement
  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (existingAchievementIds.includes(achievement.id)) {
      continue; // Already unlocked
    }

    let shouldUnlock = false;

    switch (achievement.id) {
      case 'first_habit':
        const habitCount = await prisma.habit.count({
          where: { userId, habitLogs: { some: {} } },
        });
        shouldUnlock = habitCount > 0;
        break;

      case 'streak_7':
        shouldUnlock = user.streakDays >= 7;
        break;

      case 'streak_30':
        shouldUnlock = user.streakDays >= 30;
        break;

      case 'streak_100':
        shouldUnlock = user.streakDays >= 100;
        break;

      case 'points_100':
        shouldUnlock = user.totalPoints >= 100;
        break;

      case 'points_500':
        shouldUnlock = user.totalPoints >= 500;
        break;

      case 'points_1000':
        shouldUnlock = user.totalPoints >= 1000;
        break;

      case 'all_categories':
        const logsByCategory = await prisma.habitLog.findMany({
          where: { userId },
          include: { habit: { select: { category: true } } },
          distinct: ['habitId'],
        });
        const categories = new Set(
          logsByCategory.map((log) => log.habit.category)
        );
        shouldUnlock = categories.size === 3;
        break;

      case 'level_5':
        shouldUnlock = calculateLevel(user.totalPoints) >= 5;
        break;
    }

    if (shouldUnlock) {
      unlockedAchievements.push(achievement.id);
    }
  }

  // Update user with new achievements (connect them via relation)
  if (unlockedAchievements.length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        achievements: {
          connect: unlockedAchievements.map((id) => ({ id })),
        },
      },
    });
  }

  return unlockedAchievements;
}

/**
 * Create an analytics snapshot for the current day
 */
export async function createAnalyticsSnapshot(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { habits: true, habitLogs: true },
  });

  if (!user) return;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Check if snapshot already exists for today
  const existingSnapshot = await prisma.analyticsSnapshot.findFirst({
    where: {
      userId,
      date: today,
    },
  });

  if (existingSnapshot) return;

  // Get today's completions
  const todaysLogs = await prisma.habitLog.findMany({
    where: {
      userId,
      dateCompleted: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  await prisma.analyticsSnapshot.create({
    data: {
      userId,
      date: today,
      habitsCompleted: todaysLogs.length,
      tasksCompleted: 0,
      pointsEarned: todaysLogs.reduce((sum, log) => sum + (log.pointsEarned || 0), 0),
      completionRate: user.habits.length > 0 ? (todaysLogs.length / user.habits.length) * 100 : 0,
    },
  });
}

/**
 * Update user's overall stats after habit completion
 */
export async function updateUserStats(userId: string): Promise<{
  streakDays: number;
  level: number;
  newAchievements: string[];
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { streakDays: 0, level: 1, newAchievements: [] };
  }

  // Calculate new streak
  const newStreak = await calculateUserStreak(userId);
  const newLevel = calculateLevel(user.totalPoints);
  const newAchievements = await checkAndUnlockAchievements(userId);

  // Update user with new stats
  await prisma.user.update({
    where: { id: userId },
    data: {
      streakDays: newStreak,
      level: newLevel,
    },
  });

  // Create analytics snapshot
  await createAnalyticsSnapshot(userId);

  return {
    streakDays: newStreak,
    level: newLevel,
    newAchievements,
  };
}

/**
 * Get formatted achievement display with emoji and description
 */
export function getAchievementDisplay(achievementId: string) {
  const achievement = Object.values(ACHIEVEMENTS).find((a) => a.id === achievementId);
  return achievement ? `${achievement.icon} ${achievement.name}` : null;
}
