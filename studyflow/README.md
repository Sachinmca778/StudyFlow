# 📚 StudyFlow - Smart Study Planner for Indian Students

An all-in-one AI-powered study planner and tracker built specifically for Indian students preparing for JEE, NEET, Board exams, and college semesters.

**Price Point:** ₹100/month  
**Target Market:** 30M+ Indian students  

---

## ✨ Features

### 🎯 Smart Study Planner
- AI-generated weekly study plans
- Subject allocation by difficulty & marks
- Spaced repetition revision schedule
- Manual plan creation

### ⏱️ Time Tracker
- One-click start/stop timer
- Automatic session logging
- Subject + topic tagging
- Weekly study hours dashboard

### 📅 Calendar View
- Class schedule
- Assignment deadlines
- Exam dates
- Study sessions visualization

### 📝 Assignment & Exam Manager
- Track assignments with due dates
- Exam scheduling with marks tracking
- Smart reminders
- Grade calculator

### 🎯 Focus Timer
- Pomodoro technique (25/5)
- Customizable duration
- Session tracking
- Sound notifications

### 📊 Performance Dashboard
- Total study hours (weekly/monthly)
- Consistency score
- Subject-wise time allocation
- Assignment completion rate
- Visual progress charts

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 + React 18 + TypeScript
- **Styling:** TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Hosting:** Vercel (free tier)
- **Charts:** Recharts
- **State Management:** Zustand
- **Date Handling:** date-fns
- **Icons:** Lucide React

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager

---

## 🚀 Getting Started

### Step 1: Install Node.js

If you haven't installed Node.js yet:

**On macOS (using Homebrew):**
```bash
brew install node
```

**On macOS (using official installer):**
1. Download from https://nodejs.org/
2. Run the installer
3. Verify installation:
```bash
node --version
npm --version
```

### Step 2: Set Up Supabase

1. **Create a Supabase account:**
   - Go to https://supabase.com
   - Sign up for free account

2. **Create a new project:**
   - Click "New Project"
   - Choose your organization
   - Set database password
   - Select region (closest to India: Singapore or Asia Pacific)

3. **Get your API keys:**
   - Go to Project Settings > API
   - Copy these values:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

4. **Run the database schema:**
   - Go to SQL Editor in Supabase dashboard
   - Copy the contents of `supabase-schema.sql`
   - Paste and run it
   - This will create all tables and security policies

5. **Enable Google Authentication (optional but recommended):**
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials
   - Add authorized redirect URL: `https://your-project-url.supabase.co/auth/v1/callback`

### Step 3: Clone and Setup Project

1. **Navigate to the project:**
```bash
cd /Users/sachin/study_planner/studyflow
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

4. **Edit `.env.local` with your Supabase credentials:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Firebase (optional - for push notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
studyflow/
├── app/
│   ├── layout.tsx              # Root layout with auth provider
│   ├── page.tsx                # Main page (routes to landing/dashboard)
│   └── globals.css             # Global styles
├── components/
│   ├── AuthProvider.tsx        # Authentication context provider
│   ├── LandingPage.tsx         # Public landing page
│   ├── Onboarding.tsx          # User onboarding flow
│   ├── Dashboard.tsx           # Main dashboard layout
│   ├── auth/
│   │   └── Login.tsx           # Login/Signup modal
│   └── dashboard/
│       ├── PerformanceDashboard.tsx  # Analytics dashboard
│       ├── StudyPlanner.tsx          # AI study planner
│       ├── TimeTracker.tsx           # Study time tracker
│       ├── CalendarView.tsx          # Calendar view
│       ├── AssignmentManager.tsx     # Assignments & exams
│       ├── FocusTimer.tsx            # Pomodoro timer
│       └── Settings.tsx              # User settings
├── lib/
│   ├── types.ts                # TypeScript type definitions
│   ├── planner-algorithm.ts    # AI planning algorithm
│   ├── store/
│   │   └── auth.ts             # Auth state management
│   └── supabase/
│       ├── client.ts           # Supabase client setup
│       └── server.ts           # Supabase server client
├── supabase-schema.sql         # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

---

## 🎨 Customization

### Change Color Theme

Edit `tailwind.config.js`:

```javascript
colors: {
  primary: {
    // Your primary color palette
  },
  accent: {
    // Your accent color palette
  },
}
```

### Modify AI Planning Algorithm

Edit `lib/planner-algorithm.ts` to customize how study plans are generated based on:
- Subject difficulty
- Available hours
- Exam dates
- Weak subjects

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push code to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/studyflow.git
git push -u origin main
```

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables from `.env.local`
   - Click "Deploy"

3. **Configure custom domain (optional):**
   - Buy domain from GoDaddy/Namecheap
   - Add domain in Vercel settings
   - Update DNS records

---

## 💰 Monetization Setup

### Stripe Integration (for payments)

1. Create Stripe account at https://stripe.com
2. Add Stripe environment variables:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...  # ₹100/month price ID
```

3. Implement payment routes (can be added later)

---

## 📊 Database Schema Overview

### Main Tables:
- **profiles** - User profiles and preferences
- **subjects** - User's subjects with difficulty/targets
- **study_sessions** - Logged study time
- **study_plans** - Generated/manual study plans
- **class_schedules** - Recurring class timetable
- **assignments** - Homework/assignments tracking
- **exams** - Exam scheduling and marks
- **focus_sessions** - Pomodoro/focus timer logs
- **achievements** - Gamification badges
- **referrals** - Referral program tracking

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

---

## 🔐 Security

- ✅ Row Level Security on all tables
- ✅ JWT authentication via Supabase
- ✅ Environment variables for sensitive data
- ✅ Google OAuth support
- ✅ Email verification for signups

---

## 📱 Mobile Responsiveness

The app is fully responsive and works on:
- ✅ Mobile phones (320px+)
- ✅ Tablets (768px+)
- ✅ Desktops (1024px+)
- ✅ Large screens (1280px+)

---

## 🎯 Next Steps (Post-MVP)

### Month 4-6:
- [ ] AI-powered insights
- [ ] Leaderboards
- [ ] Referral program
- [ ] Android app (React Native)

### Month 7-9:
- [ ] iOS app
- [ ] Parent portal
- [ ] Group study features
- [ ] Advanced analytics

### Month 10-12:
- [ ] B2B coaching center platform
- [ ] Premium analytics
- [ ] Corporate training courses
- [ ] Partner integrations

---

## 🐛 Troubleshooting

### Issue: "Module not found" errors
**Solution:** Run `npm install` to install all dependencies

### Issue: Supabase connection error
**Solution:** 
- Check your `.env.local` file
- Verify Supabase URL and keys are correct
- Ensure Supabase project is active

### Issue: Authentication not working
**Solution:**
- Check browser console for errors
- Verify redirect URLs in Supabase dashboard
- Enable required auth providers in Supabase

### Issue: Database queries failing
**Solution:**
- Ensure you've run the SQL schema
- Check RLS policies are set correctly
- Verify user is authenticated before queries

---

## 📞 Support

For issues or questions:
- Check this README
- Review Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs

---

## 📄 License

This is a commercial SaaS product. All rights reserved.

---

## 🙏 Credits

Built with ❤️ for Indian students

**Tech Stack:**
- Next.js - React framework
- Supabase - Backend as a Service
- TailwindCSS - Utility-first CSS
- Lucide Icons - Beautiful icons
- date-fns - Date utilities

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run linter
npm run lint
```

---

**Good luck with StudyFlow! 🎓🚀**

*Start studying smarter, not harder.*
