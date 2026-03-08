import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLevel, getAchievementDisplay } from '@/lib/gamification';

// GET /api/user - Get current user stats
export async function GET(request: NextRequest) {
  try {
    const userId = 'default-user-id';

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        habits: {
          select: { id: true, category: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate achievements display
    const achievementDisplays = (user.achievements || [])
      .map((id) => getAchievementDisplay(id))
      .filter(Boolean);

    // Count habits by category
    const categoryCounts = {
      university: user.habits.filter((h) => h.category === 'UNIVERSITY').length,
      projects: user.habits.filter((h) => h.category === 'PROJECTS').length,
      gym: user.habits.filter((h) => h.category === 'GYM').length,
    };

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      totalPoints: user.totalPoints,
      streakDays: user.streakDays,
      level: calculateLevel(user.totalPoints),
      achievements: achievementDisplays,
      habitCounts: {
        total: user.habits.length,
        ...categoryCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
