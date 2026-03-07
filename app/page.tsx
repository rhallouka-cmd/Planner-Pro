'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Flame, Plus, Pencil, Trash2, X } from 'lucide-react';

interface Habit {
  id: number;
  title: string;
  completed: boolean;
}

interface HabitsState {
  university: Habit[];
  projects: Habit[];
  gym: Habit[];
}

export default function Home() {
  const [habits, setHabits] = useState<HabitsState>({
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

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'university' | 'projects' | 'gym'>('university');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [nextId, setNextId] = useState(10);

  const toggleHabit = (category: 'university' | 'projects' | 'gym', id: number) => {
    setHabits({
      ...habits,
      [category]: habits[category].map((habit) =>
        habit.id === id ? { ...habit, completed: !habit.completed } : habit
      ),
    });
  };

  const addHabit = () => {
    if (newTaskTitle.trim()) {
      setHabits({
        ...habits,
        [selectedCategory]: [
          ...habits[selectedCategory],
          { id: nextId, title: newTaskTitle, completed: false },
        ],
      });
      setNewTaskTitle('');
      setNextId(nextId + 1);
    }
  };

  const deleteHabit = (category: 'university' | 'projects' | 'gym', id: number) => {
    setHabits({
      ...habits,
      [category]: habits[category].filter((habit) => habit.id !== id),
    });
  };

  const startEdit = (id: number, title: string) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const saveEdit = (category: 'university' | 'projects' | 'gym', id: number) => {
    if (editingTitle.trim()) {
      setHabits({
        ...habits,
        [category]: habits[category].map((habit) =>
          habit.id === id ? { ...habit, title: editingTitle } : habit
        ),
      });
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const allItems = [...habits.university, ...habits.projects, ...habits.gym];
  const completedItems = allItems.filter((item) => item.completed).length;
  const completionPercentage = allItems.length > 0 ? Math.round((completedItems / allItems.length) * 100) : 0;

  const categoryConfig = {
    university: { icon: '🎓', label: 'University', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', accentColor: 'text-blue-600' },
    projects: { icon: '💻', label: 'Projects', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', accentColor: 'text-purple-600' },
    gym: { icon: '💪', label: 'Gym & Body Goals', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', accentColor: 'text-emerald-600' },
  };

  const renderCategoryCard = (category: 'university' | 'projects' | 'gym') => {
    const config = categoryConfig[category];
    const items = habits[category];

    return (
      <div className={`${config.bgColor} rounded-2xl shadow-lg border ${config.borderColor} p-8 transition-all hover:shadow-xl`}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          {config.label}
          <span className="ml-auto text-sm font-semibold text-gray-600 bg-white px-3 py-1 rounded-full">
            {items.filter((h) => h.completed).length}/{items.length}
          </span>
        </h3>
        <div className="space-y-3">
          {items.map((habit) => (
            <div key={habit.id} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all group">
              <button
                onClick={() => toggleHabit(category, habit.id)}
                className="flex-shrink-0 transition-transform hover:scale-110"
              >
                {habit.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />
                )}
              </button>

              {editingId === habit.id ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="flex-grow px-3 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <span
                  className={`flex-grow text-sm font-medium ${
                    habit.completed ? 'text-gray-500 line-through' : 'text-gray-700'
                  }`}
                >
                  {habit.title}
                </span>
              )}

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingId === habit.id ? (
                  <button
                    onClick={() => saveEdit(category, habit.id)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(habit.id, habit.title)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {editingId === habit.id ? (
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => deleteHabit(category, habit.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-black text-gray-900 mb-2 tracking-tight">Today's Plan</h1>
            <p className="text-lg text-gray-600">Stay focused. Stay productive.</p>
          </div>
          <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-full px-6 py-3 shadow-lg flex items-center gap-2 text-white font-bold text-lg">
            <Flame className="w-6 h-6" />
            12 Days
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Daily Completion</h2>
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 h-full rounded-full shadow-lg transition-all duration-700 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-4">
            <span className="font-semibold text-gray-900">{completedItems}</span> of{' '}
            <span className="font-semibold text-gray-900">{allItems.length}</span> tasks completed today
          </p>
        </div>

        {/* Add New Task Section */}
        <div className="mb-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Task</h3>
          <div className="flex gap-4 flex-col sm:flex-row">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              placeholder="Enter a new task or habit..."
              className="flex-grow px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'university' | 'projects' | 'gym')}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium bg-white"
            >
              <option value="university">🎓 University</option>
              <option value="projects">💻 Projects</option>
              <option value="gym">💪 Gym</option>
            </select>
            <button
              onClick={addHabit}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {renderCategoryCard('university')}
          {renderCategoryCard('projects')}
          {renderCategoryCard('gym')}
        </div>

        {/* Statistics Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center hover:shadow-xl transition-all">
            <p className="text-gray-600 text-sm font-semibold mb-2">TOTAL TASKS</p>
            <p className="text-4xl font-black text-gray-900">{allItems.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center hover:shadow-xl transition-all">
            <p className="text-gray-600 text-sm font-semibold mb-2">COMPLETED</p>
            <p className="text-4xl font-black text-green-600">{completedItems}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center hover:shadow-xl transition-all">
            <p className="text-gray-600 text-sm font-semibold mb-2">REMAINING</p>
            <p className="text-4xl font-black text-blue-600">{allItems.length - completedItems}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
