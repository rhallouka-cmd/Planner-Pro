'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Plus, Pencil, Trash2, X, CheckCircle2, Circle, Flame, Settings, Bell, TrendingUp, Award, Zap, Calendar, Check, AlertCircle, Loader, LogOut } from 'lucide-react';

interface APIHabit {
  id: string;
  title: string;
  description?: string;
  category: 'UNIVERSITY' | 'PROJECTS' | 'GYM';
  streakCount: number;
  maxStreak: number;
  pointsValue: number;
}

interface Habit {
  id: string;
  title: string;
  completed: boolean;
}

interface HabitsState {
  university: Habit[];
  projects: Habit[];
  gym: Habit[];
}

interface GamificationStats {
  streakDays: number;
  totalPoints: number;
  level: number;
  achievements: string[];
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
}

interface APIResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [habits, setHabits] = useState<HabitsState>({
    university: [],
    projects: [],
    gym: [],
  });

  const [gamification, setGamification] = useState<GamificationStats>({
    streakDays: 12,
    totalPoints: 0,
    level: 1,
    achievements: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'university' | 'projects' | 'gym'>('university');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingCategory, setEditingCategory] = useState<'university' | 'projects' | 'gym'>('university');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'university' | 'projects' | 'gym'>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  // Fetch habits from API on mount
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch habits
        const habitsResponse = await fetch('/api/habits');
        if (!habitsResponse.ok) throw new Error('Failed to fetch habits');
        const apiHabits: APIHabit[] = await habitsResponse.json();
        
        // Map API habits to component state, organized by category
        const categorized: HabitsState = {
          university: [],
          projects: [],
          gym: [],
        };

        apiHabits.forEach((apiHabit) => {
          const habit: Habit = {
            id: apiHabit.id,
            title: apiHabit.title,
            completed: false,
          };
          
          const categoryKey = apiHabit.category.toLowerCase() as keyof HabitsState;
          categorized[categoryKey].push(habit);
        });

        setHabits(categorized);

        // Fetch user stats
        const userResponse = await fetch('/api/user');
        if (userResponse.ok) {
          const userStats = await userResponse.json();
          setGamification({
            streakDays: userStats.streakDays,
            totalPoints: userStats.totalPoints,
            level: userStats.level,
            achievements: userStats.achievements || [],
          });
        }

        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(message);
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [status]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type, timestamp: Date.now() };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const categoryConfig = {
    university: {
      icon: '🎓',
      label: 'University',
      borderAccent: 'border-indigo-500/30 hover:border-indigo-500',
      cardBg: 'bg-slate-800/50',
      badgeBg: 'bg-indigo-500/20 text-indigo-300',
      description: 'Manage ESISA coursework, deadlines, and study habits',
    },
    projects: {
      icon: '💻',
      label: 'Projects',
      borderAccent: 'border-purple-500/30 hover:border-purple-500',
      cardBg: 'bg-slate-800/50',
      badgeBg: 'bg-purple-500/20 text-purple-300',
      description: 'Track milestones, GitHub commits, and project tasks',
    },
    gym: {
      icon: '💪',
      label: 'Gym & Body',
      borderAccent: 'border-cyan-500/30 hover:border-cyan-500',
      cardBg: 'bg-slate-800/50',
      badgeBg: 'bg-cyan-500/20 text-cyan-300',
      description: 'Workout splits, PRs, consistency, and daily metrics',
    },
  };

  const toggleHabit = async (category: keyof HabitsState, id: string) => {
    try {
      const response = await fetch(`/api/habits/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to toggle habit');
      
      const result = await response.json();
      
      // Update local state
      setHabits({
        ...habits,
        [category]: habits[category].map((habit) =>
          habit.id === id ? { ...habit, completed: result.isCompletedToday } : habit
        ),
      });

      // Update gamification with real stats and achievements
      if (result.isCompletedToday && result.pointsAwarded) {
        setGamification((prev) => {
          const updated = {
            ...prev,
            totalPoints: prev.totalPoints + result.pointsAwarded,
          };
          
          // Update with new stats if provided
          if (result.stats) {
            updated.streakDays = result.stats.streakDays;
            updated.level = result.stats.level;
          }
          
          // Add achievements if unlocked
          if (result.newAchievements && result.newAchievements.length > 0) {
            updated.achievements = [...prev.achievements, ...result.newAchievements];
            result.newAchievements.forEach((achievement: string) => {
              showToast(`🏆 Achievement Unlocked! ${achievement}`, 'success');
            });
          }

          return updated;
        });
        
        showToast(`🎉 Task completed! +${result.pointsAwarded} points`, 'success');
      } else {
        showToast('↩️ Task marked incomplete', 'info');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle habit';
      showToast(message, 'error');
    }
  };

  const addHabit = async () => {
    if (!newTaskTitle.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }

    try {
      const categoryMap: Record<string, string> = {
        university: 'UNIVERSITY',
        projects: 'PROJECTS',
        gym: 'GYM',
      };

      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          category: categoryMap[selectedCategory],
          description: '',
        }),
      });

      if (!response.ok) throw new Error('Failed to create habit');
      
      const newHabit = await response.json();

      // Add to appropriate category
      setHabits({
        ...habits,
        [selectedCategory]: [
          ...habits[selectedCategory],
          {
            id: newHabit.id,
            title: newHabit.title,
            completed: false,
          },
        ],
      });

      showToast(`✅ Task added to ${categoryConfig[selectedCategory].label}`);
      setNewTaskTitle('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add task';
      showToast(message, 'error');
    }
  };

  const deleteHabit = async (category: keyof HabitsState, id: string) => {
    try {
      const deletedHabit = habits[category].find((h) => h.id === id);
      
      const response = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to delete habit');

      setHabits({
        ...habits,
        [category]: habits[category].filter((habit) => habit.id !== id),
      });

      showToast(`🗑️ "${deletedHabit?.title}" deleted`, 'info');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete habit';
      showToast(message, 'error');
    }
  };

  const startEdit = (id: string, title: string, category: keyof HabitsState) => {
    setEditingId(id);
    setEditingTitle(title);
    setEditingCategory(category);
  };

  const saveEdit = async () => {
    if (!editingTitle.trim() || editingId === null) {
      showToast('Task title cannot be empty', 'error');
      return;
    }

    try {
      const categoryMap: Record<string, string> = {
        university: 'UNIVERSITY',
        projects: 'PROJECTS',
        gym: 'GYM',
      };

      const response = await fetch(`/api/habits/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTitle,
          category: categoryMap[editingCategory],
        }),
      });

      if (!response.ok) throw new Error('Failed to update habit');
      
      const updatedHabit = await response.json();

      setHabits({
        ...habits,
        [editingCategory]: habits[editingCategory].map((habit) =>
          habit.id === editingId ? { ...habit, title: updatedHabit.title } : habit
        ),
      });

      showToast('✏️ Task updated');
      setEditingId(null);
      setEditingTitle('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      showToast(message, 'error');
    }
  };

  const calculateStats = (category: keyof HabitsState) => {
    const items = habits[category];
    const completedCount = items.filter((h) => h.completed).length;
    const totalCount = items.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return { completedCount, totalCount, percentage };
  };

  const allItems = [...habits.university, ...habits.projects, ...habits.gym];
  const completedItems = allItems.filter((item) => item.completed).length;
  const completionPercentage = allItems.length > 0 ? Math.round((completedItems / allItems.length) * 100) : 0;

  const renderCategoryCard = (category: keyof HabitsState) => {
    const config = categoryConfig[category];
    const items = habits[category];
    const stats = calculateStats(category);

    return (
      <div className={`${config.cardBg} backdrop-blur border border-slate-700 ${config.borderAccent} rounded-2xl p-6 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-slate-50 flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            {config.label}
          </h3>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.badgeBg}`}>
            {stats.completedCount}/{stats.totalCount}
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">{config.description}</p>

        {/* Progress Bar by Category */}
        <div className="mb-4 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
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
                  <button onClick={saveEdit} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className={`flex-grow text-sm font-medium transition-all ${
                      habit.completed ? 'text-slate-400 line-through' : 'text-slate-100'
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
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center font-bold text-slate-950 text-sm sm:text-base">
              P
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-50 truncate">Planner Pro</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowSettings(false);
                setShowProfile(false);
              }}
              className="p-2 sm:p-2.5 hover:bg-slate-800 rounded-lg transition-colors active:bg-slate-700" 
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            </button>
            <button 
              onClick={() => {
                setShowSettings(!showSettings);
                setShowNotifications(false);
                setShowProfile(false);
              }}
              className="p-2 sm:p-2.5 hover:bg-slate-800 rounded-lg transition-colors active:bg-slate-700" 
              title="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            </button>
            <button 
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
                setShowSettings(false);
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-indigo-500/50 transition-all active:scale-95" 
              title="Profile"
            >
              U
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="font-bold text-slate-50">Notifications</h3>
                </div>
                <div className="space-y-3 p-4 max-h-64 overflow-y-auto">
                  <div className="p-3 bg-slate-700/50 rounded-lg border-l-2 border-indigo-500">
                    <p className="text-sm text-slate-100 font-medium">Great streak! 🔥</p>
                    <p className="text-xs text-slate-400">You've completed 5 tasks today</p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg border-l-2 border-cyan-500">
                    <p className="text-sm text-slate-100 font-medium">Reminder: Gym time</p>
                    <p className="text-xs text-slate-400">You haven't logged your workout yet</p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg border-l-2 border-purple-500">
                    <p className="text-sm text-slate-100 font-medium">New achievement unlocked! 🏆</p>
                    <p className="text-xs text-slate-400">Level 5: Productivity Ninja</p>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="font-bold text-slate-50">Settings</h3>
                </div>
                <div className="space-y-2 p-4">
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-100 text-sm font-medium">
                    📊 Theme
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-100 text-sm font-medium">
                    🔔 Notifications
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-100 text-sm font-medium">
                    🎮 Gamification
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-100 text-sm font-medium">
                    ⚙️ Preferences
                  </button>
                  <hr className="border-slate-700 my-2" />
                  <button className="w-full text-left px-4 py-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 text-sm font-medium">
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      U
                    </div>
                    <div>
                      <p className="font-bold text-slate-50">Level {gamification.level}</p>
                      <p className="text-xs text-slate-400">{gamification.totalPoints} points</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-100 text-sm font-medium">
                    👤 My Profile
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-100 text-sm font-medium">
                    ⭐ Achievements ({gamification.achievements.length})
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-100 text-sm font-medium">
                    📈 Stats
                  </button>
                  <hr className="border-slate-700 my-2" />
                  <button onClick={() => signOut({ redirect: true, callbackUrl: '/login' })} className="w-full text-left px-4 py-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 text-sm font-medium">
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
            { id: 'analytics', label: '📈 Analytics', icon: '📈' },
            { id: 'university', label: '🎓 University', icon: '🎓' },
            { id: 'projects', label: '💻 Projects', icon: '💻' },
            { id: 'gym', label: '💪 Gym', icon: '💪' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Loading your habits...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-300 font-medium">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content - Only show if not loading */}
        {!loading && (
          <>

        {activeTab === 'dashboard' && (
          <>
            {/* Gamification Score Card */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/50 border border-indigo-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Flame className="w-6 h-6 text-orange-400" />
                  <span className="text-xs font-semibold text-slate-400">STREAK</span>
                </div>
                <p className="text-3xl font-black text-slate-50">{gamification.streakDays}</p>
                <p className="text-xs text-slate-400 mt-1">days consistent</p>
              </div>

              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <span className="text-xs font-semibold text-slate-400">POINTS</span>
                </div>
                <p className="text-3xl font-black text-slate-50">{gamification.totalPoints}</p>
                <p className="text-xs text-slate-400 mt-1">total earned</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/50 border border-cyan-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-6 h-6 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-400">LEVEL</span>
                </div>
                <p className="text-3xl font-black text-slate-50">{gamification.level}</p>
                <p className="text-xs text-slate-400 mt-1">productivity ninja</p>
              </div>

              <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/50 border border-pink-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-6 h-6 text-pink-400" />
                  <span className="text-xs font-semibold text-slate-400">COMPLETED</span>
                </div>
                <p className="text-3xl font-black text-slate-50">{completionPercentage}%</p>
                <p className="text-xs text-slate-400 mt-1">today's tasks</p>
              </div>
            </div>

            {/* Hero Section: Progress & Streaks */}
            <div className="mb-16 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl shadow-indigo-900/20">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-black text-slate-50 mb-2">Today's Progress</h2>
                  <p className="text-slate-400">March 8, 2026</p>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 rounded-full shadow-lg shadow-orange-500/50">
                  <Flame className="w-6 h-6 text-white" />
                  <span className="font-black text-white text-lg">{gamification.streakDays} Days</span>
                </div>
              </div>

              {/* Main Progress Bar */}
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

              {/* Category Stats */}
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
            <div className="mb-12 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-50 mb-4">Add New Task</h3>
              <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                  placeholder="What's your next task?"
                  className="flex-grow px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg sm:rounded-xl text-sm sm:text-base text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as keyof HabitsState)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg sm:rounded-xl text-sm sm:text-base text-slate-50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                >
                  <option value="university">🎓 University</option>
                  <option value="projects">💻 Projects</option>
                  <option value="gym">💪 Gym</option>
                </select>
                <button
                  onClick={addHabit}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Add Task</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderCategoryCard('university')}
              {renderCategoryCard('projects')}
              {renderCategoryCard('gym')}
            </div>
          </>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl shadow-indigo-900/20">
            <h2 className="text-3xl font-black text-slate-50 mb-8">Your Analytics Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Weekly Completion
                </h3>
                <div className="space-y-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-12 text-sm font-semibold text-slate-400">{day}</span>
                      <div className="flex-grow h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                          style={{ width: `${60 + idx * 5}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400">{60 + idx * 5}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Category Performance
                </h3>
                <div className="space-y-4">
                  {(['university', 'projects', 'gym'] as const).map((cat) => {
                    const stats = calculateStats(cat);
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="w-20 text-sm font-semibold text-slate-400">{categoryConfig[cat].label}</span>
                        <div className="flex-grow h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-400">{stats.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-50 mb-4">Achievements Unlocked</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gamification.achievements.map((ach, idx) => (
                  <div key={idx} className="bg-slate-700/40 border border-slate-600 rounded-xl p-4 text-center hover:border-indigo-500 transition-all">
                    <p className="text-2xl mb-2">{ach.split(' ')[0]}</p>
                    <p className="text-xs text-slate-300 font-semibold">{ach}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY-SPECIFIC TABS */}
        {['university', 'projects', 'gym'].includes(activeTab) && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-50 mb-2">
                {categoryConfig[activeTab as keyof typeof categoryConfig].icon} {categoryConfig[activeTab as keyof typeof categoryConfig].label}
              </h2>
              <p className="text-slate-400">{categoryConfig[activeTab as keyof typeof categoryConfig].description}</p>
            </div>
            {renderCategoryCard(activeTab as keyof HabitsState)}
          </div>
        )}
          </>
        )}

        {/* Toast Notification Container */}
        <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg backdrop-blur border shadow-lg animate-in fade-in slide-in-from-bottom-4 transition-all pointer-events-auto ${
                toast.type === 'success'
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : toast.type === 'error'
                  ? 'bg-red-500/20 border-red-500/50 text-red-300'
                  : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
              }`}
            >
              {toast.type === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Zap className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm sm:text-base font-medium">{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
