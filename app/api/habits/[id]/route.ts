import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/habits/[id] - Fetch a single habit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { id } = await params;
    const userId = session.user.id;

    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit || habit.userId !== userId) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(habit);
  } catch (error) {
    console.error('Error fetching habit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
      { status: 500 }
    );
  }
}

// PUT /api/habits/[id] - Update a habit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { id } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { title, description, category } = body;

    // Verify the habit belongs to the user
    const existingHabit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!existingHabit || existingHabit.userId !== userId) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
      },
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error('Error updating habit:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    );
  }
}

// DELETE /api/habits/[id] - Delete a habit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { id } = await params;
    const userId = session.user.id;

    // Verify the habit belongs to the user
    const existingHabit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!existingHabit || existingHabit.userId !== userId) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    await prisma.habit.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Habit deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting habit:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}
