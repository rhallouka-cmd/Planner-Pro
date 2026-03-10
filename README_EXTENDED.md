# Planner Pro - Advanced Habit & Task Tracker

A full-featured habit and task tracking application with gamification, built with Next.js, Prisma, and NextAuth.js.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

---

## 🚀 Features

### 📊 Dashboard
- Real-time status overview with gradient UI
- Daily habits and tasks visualization
- Achievement showcase with unlock notifications
- Category-based breakdown (University, Projects, Gym)
- Dark mode premium design

### 🎮 Gamification System
- **Point System**: Earn points for completed habits/tasks
- **Level Progression**: 10 levels from 1-15,000 points
- **Streak Tracking**: Track daily streaks per habit and overall
- **9 Achievement Types**:
  - 🔥 Streak Learner (7-day streak)
  - 🏃 Streak Master (30-day streak)
  - 🏆 Streak Legend (100-day streak)
  - ⭐ Point Collector (100+ points)
  - 🎯 Point Hoarder (500+ points)
  - 💎 Point Champion (1000+ points)
  - 🎓 All Categories (Complete all 3 categories)
  - 🚀 Speed Racer (Level 5)
  - 🌟 Legend Status (Level 10)

### 📝 Habit Management
- Create daily recurring habits
- Track completion streaks
- Set custom point values
- Assign to categories (University, Projects, Gym)
- View habit history and analytics

### ✅ Task Management
- Create one-time or deadline-based tasks
- Set priority levels (1-5)
- Assign deadlines
- Track completion status
- Categorize tasks

### 🔐 Authentication
- Secure signup with email verification
- Password hashing with bcryptjs
- Session-based authentication with NextAuth.js
- Protected API routes
- Automatic logout and session management

### 📈 Analytics
- Daily completion snapshots
- Category-based statistics
- Habit completion rates
- Points earned tracking
- Historical data visualization

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Authentication**: NextAuth.js v5 (beta)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma v6.19.2
- **Password Security**: bcryptjs
- **UI Components**: Lucide React Icons
- **Styling**: Tailwind CSS with dark mode
- **Version Control**: Git + GitHub

---

## 📦 Installation

### Prerequisites
- Node.js >= 20
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rhallouka-cmd/Planner-Pro.git
   cd Planner-Pro/habit-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```
   
   Generate a secure NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

4. **Set up database**
   ```bash
   npx prisma migrate dev --name init
   ```
   
   This will:
   - Create SQLite database
   - Run all migrations
   - Generate Prisma Client

5. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser

---

## 🚀 Deployment

### Quick Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your `Planner-Pro` repository
5. Add environment variables:
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your Vercel URL)
   - `DATABASE_URL` (if using PostgreSQL)
6. Click "Deploy"

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📁 Project Structure

```
habit-tracker/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # NextAuth routes
│   │   ├── habits/            # Habit CRUD endpoints
│   │   ├── tasks/             # Task CRUD endpoints
│   │   └── user/              # User stats endpoint
│   ├── layout.tsx             # Root layout with SessionProvider
│   ├── page.tsx               # Main dashboard
│   ├── login/                 # Login page
│   ├── signup/                # Signup page
│   └── globals.css            # Global styles
├── lib/
│   ├── prisma.ts              # Prisma singleton
│   ├── gamification.ts        # Achievement/level/streak logic
│   └── toast.ts               # Toast notification helpers
├── prisma/
│   ├── schema.prisma          # Database models
│   └── migrations/            # Database migrations
├── auth.ts                    # NextAuth configuration
├── middleware.ts              # Route protection middleware
├── .env.example               # Environment template
├── vercel.json                # Vercel configuration
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signin` - Login with credentials
- `POST /api/auth/signout` - Logout current user
- `GET /api/auth/session` - Get current session

### Habits
- `GET /api/habits` - Fetch all habits (current user)
- `POST /api/habits` - Create new habit
- `GET /api/habits/[id]` - Fetch single habit
- `PUT /api/habits/[id]` - Update habit
- `DELETE /api/habits/[id]` - Delete habit
- `POST /api/habits/[id]/toggle` - Toggle completion for today

### Tasks
- `GET /api/tasks` - Fetch all tasks (current user)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/[id]` - Fetch single task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### User
- `GET /api/user` - Get user stats (level, points, achievements)

---

## 🗄️ Database Schema

### User
Stores user profile and gamification stats
- `id`, `email`, `name`, `password` (optional)
- `streakDays`, `totalPoints`, `level`
- `lastActiveDate`, `createdAt`, `updatedAt`

### Habit
Recurring daily habits
- `id`, `title`, `description`, `category`
- `streakCount`, `maxStreak`, `pointsValue`
- `isCompletedToday`, `frequencyGoal`
- `userId` (FK), `createdAt`, `updatedAt`

### Task
One-time or deadline tasks
- `id`, `title`, `description`, `category`
- `priority`, `dueDate`, `isCompleted`, `completedAt`
- `pointsValue`, `userId` (FK)
- `createdAt`, `updatedAt`

### HabitLog
Daily completion records
- `id`, `habitId` (FK), `userId` (FK)
- `dateCompleted`, `pointsEarned`
- `createdAt`

### Achievement
Unlocked badges
- `id`, `userId` (FK)
- `title`, `description`, `badge`, `category`
- `unlockedAt`, `createdAt`

### AnalyticsSnapshot
Daily analytics data
- `id`, `userId` (FK), `date`
- `tasksCompleted`, `habitsCompleted`, `pointsEarned`
- `completionRate`, category breakdowns
- `createdAt`

---

## 🎯 Usage Examples

### Create a Habit
```bash
curl -X POST http://localhost:3000/api/habits \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Morning Run",
    "category": "GYM",
    "description": "5k morning jog",
    "pointsValue": 100
  }'
```

### Complete a Habit Today
```bash
curl -X POST http://localhost:3000/api/habits/[habit-id]/toggle \
  -H "Content-Type: application/json"
```

### Get User Stats
```bash
curl http://localhost:3000/api/user
```

---

## 🔐 Security

- Passwords hashed with bcryptjs
- NextAuth.js JWT-based sessions
- CSRF protection with NextAuth
- Protected API routes requiring authentication
- Secure environment variable management
- SQL injection prevention with Prisma ORM

---

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset database (⚠️ WARNING: deletes all data)
npx prisma migrate reset

# Sync schema with database
npx prisma db push

# View database in browser
npx prisma studio
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set and >= 32 characters
- Check `NEXTAUTH_URL` matches your application URL
- Clear browser cookies and try again

---

## 📊 Performance Metrics

- **Build Time**: ~4-6 seconds (Turbopack)
- **Page Load**: ~1-2 seconds (optimized with Next.js)
- **API Response**: <100ms (average)
- **Database Queries**: Optimized with Prisma relations

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For issues or questions:
1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review GitHub Issues
3. Check error logs in Vercel dashboard

---

## 🎉 Phases Completed

✅ **Phase 1**: Premium UI Dashboard with Gamification Cards
✅ **Phase 2**: Backend API with SQLite Database
✅ **Phase 3**: Gamification Engine (Streaks, Achievements, Levels)
✅ **Phase 4**: Authentication System with NextAuth.js
✅ **Phase 5**: Vercel Deployment Ready

---

**Built with ❤️ using Next.js and Prisma**

