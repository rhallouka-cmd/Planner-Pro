import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/habits/[id]/toggle - Toggle habit completion status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const today = new Date().toISOString().split('T')[0];

    // Find or create the habit
    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Check if habit was completed today
    const todayLog = await prisma.habitLog.findFirst({
      where: {
        habitId: id,
        dateCompleted: today,
      },
    });

    let isCompletedToday: boolean;
    let habitLog;

    if (todayLog) {
      // Remove the log entry (mark as incomplete)
      await prisma.habitLog.delete({
        where: { id: todayLog.id },
      });
      isCompletedToday = false;
    } else {
      // Create a log entry (mark as complete)
      habitLog = await prisma.habitLog.create({
        data: {
          habitId: id,
          dateCompleted: today,
        },
      });
      isCompletedToday = true;

      // Award points to the user
      await prisma.user.update({
        where: { id: habit.userId },
        data: {
          totalPoints: {
            increment: habit.pointsValue,
          },
        },
      });
    }

    return NextResponse.json(
      {
        message: isCompletedToday ? 'Habit marked complete' : 'Habit marked incomplete',
        isCompletedToday,
        pointsAwarded: isCompletedToday ? habit.pointsValue : 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error toggling habit:', error);
    return NextResponse.json(
      { error: 'Failed to toggle habit' },
      { status: 500 }
    );
  }
}
