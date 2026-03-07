'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, X, CheckCircle2, Circle, Flame, Settings, Bell, User } from 'lucide-react';

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
      { id: 1, title: 'ESISA Data Structures Assignment', completed: false },
      { id: 2, title: 'Read Next.js docs for web portfolio', completed: true },
    ],
    projects: [
      { id: 3, title: 'Push Professor Ai commits to GitHub', completed: false },
      { id: 4, title: 'Review digital marketing metrics', completed: true },
    ],
    gym: [
      { id: 5, title: 'Hit new bench PR', completed: false },
      { id: 6, title: 'Drink 3L water', completed: true },
    ],
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'university' | 'projects' | 'gym'>('university');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingCategory, setEditingCategory] = useState<'university' | 'projects' | 'gym'>('university');
  const [nextId, setNextId] = useState(7);

  const toggleHabit = (category: keyof HabitsState, id: number) => {
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

  const deleteHabit = (category: keyof HabitsState, id: number) => {
    setHabits({
      ...habits,
      [category]: habits[category].filter((habit) => habit.id !== id),
    });
  };

  const startEdit = (id: number, title: string, category: keyof HabitsState) => {
    setEditingId(id);
    setEditingTitle(title);
    setEditingCategory(category);
  };

  const saveEdit = () => {
    if (editingTitle.trim() && editingId !== null) {
      setHabits({
        ...habits,
        [editingCategory]: habits[editingCategory].map((habit) =>
          habit.id === editingId ? { ...habit, title: editingTitle } : habit
        ),
      });
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const allItems = [...habits.university, ...habits.projects, ...habits.gym];
  const completedItems = allItems.filter((item) => item.completed).length;
  const completionPercentage = allItems.length > 0 ? Math.round((completedItems / allItems.length) * 100) : 0;

  const categoryConfig = {
    university: { 
      icon: '🎓', 
      label: 'University', 
      borderAccent: 'border-indigo-500/30 hover:border-indigo-500',
      cardBg: 'bg-slate-800/50',
      badgeBg: 'bg-indigo-500/20 text-indigo-300',
    },
    projects: { 
      icon: '💻', 
      label: 'Projects', 
      borderAccent: 'border-purple-500/30 hover:border-purple-500',
      cardBg: 'bg-slate-800/50',
      badgeBg: 'bg-purple-500/20 text-purple-300',
    },
    gym: { 
      icon: '💪', 
      label: 'Gym & Body', 
      borderAccent: 'border-cyan-500/30 hover:border-cyan-500',
      cardBg: 'bg-slate-800/50',
      badgeBg: 'bg-cyan-500/20 text-cyan-300',
    },
  };

  const renderCategoryCard = (category: keyof HabitsState) => {
    const config = categoryConfig[category];
    const items = habits[category];
    const completedCount = items.filter((h) => h.completed).length;

    return (
      <div className={`${config.cardBg} backdrop-blur border border-slate-700 ${config.borderAccent} rounded-2xl p-6 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-50 flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            {config.label}
          </h3>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.badgeBg}`}>
            {completedCount}/{items.length}
          </span>
        </div>

        <div className="space-y-3">
          {items.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center gap-4 p-4 bg-slate-700/40 hover:bg-slate-700/60 rounded-xl transition-all duration-200 group"
            >
              <button
                onClick={() => toggleHabit(category, habit.id)}
                className="flex-shrink-0 focus:outline-none transition-transform hover:scale-110"
              >
                {habit.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-500 group-hover:text-slate-400" />
                )}
              </button>

              {editingId === habit.id ? (
                <div className="flex-grow flex gap-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    className="flex-grow px-3 py-2 bg-slate-800 border border-indigo-500 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className={`flex-grow text-sm font-medium transition-all ${
                      habit.completed
                        ? 'text-slate-400 line-through'
                        : 'text-slate-100'
                    }`}
                  >
                    {habit.title}
                  </span>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(habit.id, habit.title, category)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteHabit(category, habit.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center font-bold text-slate-950">
              P
            </div>
            <h1 className="text-2xl font-black text-slate-50">Planner Pro</h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
            <button className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
              U
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section: Progress & Streaks */}
        <div className="mb-16 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl shadow-indigo-900/20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-black text-slate-50 mb-2">Today's Progress</h2>
              <p className="text-slate-400">March 8, 2026</p>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 rounded-full shadow-lg shadow-orange-500/50">
              <Flame className="w-6 h-6 text-white" />
              <span className="font-black text-white text-lg">12 Days</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-slate-300">Daily Completion</span>
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden shadow-inner shadow-slate-950/50">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full shadow-lg shadow-indigo-500/50 transition-all duration-700 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-sm text-slate-400 mt-4">
              <span className="font-bold text-slate-50">{completedItems}</span> of{' '}
              <span className="font-bold text-slate-50">{allItems.length}</span> tasks completed
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-slate-400 mb-2">TOTAL</p>
              <p className="text-3xl font-black text-slate-50">{allItems.length}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-slate-400 mb-2">COMPLETED</p>
              <p className="text-3xl font-black text-cyan-400">{completedItems}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-slate-400 mb-2">REMAINING</p>
              <p className="text-3xl font-black text-indigo-400">{allItems.length - completedItems}</p>
            </div>
          </div>
        </div>

        {/* Add New Task Section */}
        <div className="mb-12 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-50 mb-4">Add New Task</h3>
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              placeholder="What's your next task?"
              className="flex-grow px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as keyof HabitsState)}
              className="px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            >
              <option value="university">🎓 University</option>
              <option value="projects">💻 Projects</option>
              <option value="gym">💪 Gym</option>
            </select>
            <button
              onClick={addHabit}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderCategoryCard('university')}
          {renderCategoryCard('projects')}
          {renderCategoryCard('gym')}
        </div>
      </div>
    </div>
  );
}
