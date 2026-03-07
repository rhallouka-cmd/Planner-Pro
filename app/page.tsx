'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Flame } from 'lucide-react';

export default function Home() {
  const [habits, setHabits] = useState({
    university: [
      { id: 1, title: 'Complete Data Structures assignment', completed: true },
      { id: 2, title: 'Read Chapter 5 of algorithms book', completed: false },
      { id: 3, title: 'Attend morning lecture', completed: true },
    ],
    projects: [
      { id: 4, title: 'Review pull requests', completed: true },
      { id: 5, title: 'Fix bug in auth module', completed: false },
      { id: 6, title: 'Update project documentation', completed: false },
    ],
    gym: [
      { id: 7, title: '30min cardio session', completed: true },
      { id: 8, title: 'Upper body workout', completed: false },
      { id: 9, title: 'Stretch & flexibility routine', completed: true },
    ],
  });

  const toggleHabit = (category: 'university' | 'projects' | 'gym', id: number) => {
    setHabits({
      ...habits,
      [category]: habits[category].map((habit) =>
        habit.id === id ? { ...habit, completed: !habit.completed } : habit
      ),
    });
  };

  const allItems = [...habits.university, ...habits.projects, ...habits.gym];
  const completedItems = allItems.filter((item) => item.completed).length;
  const completionPercentage = Math.round((completedItems / allItems.length) * 100);

  const renderCategoryCard = (
    title: string,
    icon: string,
    items: typeof habits.university,
    category: 'university' | 'projects' | 'gym',
    bgColor: string,
    borderColor: string
  ) => (
    <div className={`${bgColor} rounded-xl shadow-md border ${borderColor} p-6 transition-all hover:shadow-lg`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => toggleHabit(category, habit.id)}
          >
            {habit.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                habit.completed ? 'text-gray-500 line-through' : 'text-gray-700'
              }`}
            >
              {habit.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Today's Plan</h1>
            <p className="text-gray-600">March 7, 2026</p>
          </div>
          <div className="bg-white rounded-full px-6 py-3 shadow-md border border-gray-200 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-lg text-gray-900">12 Days</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-10 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">Daily Completion</h2>
            <span className="text-lg font-bold text-blue-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {completedItems} of {allItems.length} tasks completed
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderCategoryCard(
            'University',
            '🎓',
            habits.university,
            'university',
            'bg-blue-50',
            'border-blue-200'
          )}
          {renderCategoryCard(
            'Projects',
            '💻',
            habits.projects,
            'projects',
            'bg-purple-50',
            'border-purple-200'
          )}
          {renderCategoryCard(
            'Gym & Body Goals',
            '💪',
            habits.gym,
            'gym',
            'bg-green-50',
            'border-green-200'
          )}
        </div>

        {/* Footer Statistics */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 text-center">
            <p className="text-gray-600 text-sm">Total Habits</p>
            <p className="text-3xl font-bold text-gray-900">{allItems.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 text-center">
            <p className="text-gray-600 text-sm">Completed Today</p>
            <p className="text-3xl font-bold text-green-600">{completedItems}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 text-center">
            <p className="text-gray-600 text-sm">Streak</p>
            <p className="text-3xl font-bold text-orange-600">12 🔥</p>
          </div>
        </div>
      </div>
    </div>
  );
}
