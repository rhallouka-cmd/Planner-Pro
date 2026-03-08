import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/habits - Fetch all habits for a user
export async function GET(request: NextRequest) {
  try {
    // For now, we'll use a default user ID. In production, this would come from session/auth
    const userId = 'default-user-id';

    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

// POST /api/habits - Create a new habit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category, description } = body;

    // Validate required fields
    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    // For now, we'll use a default user ID
    const userId = 'default-user-id';

    // Ensure user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Create a default user if it doesn't exist
      await prisma.user.create({
        data: {
          id: userId,
          email: 'demo@example.com',
          name: 'Demo User',
        },
      });
    }

    const habit = await prisma.habit.create({
      data: {
        title,
        category,
        description: description || '',
        userId,
      },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}
