# StudyFlow Mobile — Institute Management App

React Native (Expo) mobile app for institute admins. Same Supabase backend as the web app.

## Features

| Screen | Description |
|--------|-------------|
| Login / Sign Up | Supabase auth with session persistence |
| Onboarding | 2-step institute setup |
| Dashboard | Stats: students, revenue, attendance, assignments |
| Students | Add/search/filter students, auto enrollment numbers |
| Batches | Create & manage course batches with schedule |
| Fee Management | Record payments, view summary, filter by status |
| Attendance | Daily attendance with date navigation, bulk mark |
| Assignments | Create & track assignments per batch |
| Performance | Add exam results, grade tracking with progress bars |
| Communication | Publish announcements with priority & audience |
| Fee Reminders | Generate reminders, send via WhatsApp/Call |
| Bulk Import | CSV import for students & fee payments |
| Settings | Edit institute profile & address |

## Setup

### 1. Install dependencies
```bash
cd studyflow-mobile
npm install
```

### 2. Configure environment
Copy `.env` and fill in your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
> Use the same Supabase project as your web app — no DB changes needed.

### 3. Run the app
```bash
# Start Expo dev server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

### 4. Build for production
```bash
# Install EAS CLI
npm install -g eas-cli

# Build APK (Android)
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios
```

## Project Structure

```
app/
├── (auth)/
│   ├── login.tsx          ← Login & Sign Up
│   └── onboarding.tsx     ← Institute setup
├── (admin)/
│   ├── _layout.tsx        ← Bottom tab navigator
│   ├── index.tsx          ← Dashboard
│   ├── students.tsx       ← Student management
│   ├── batches.tsx        ← Batch management
│   ├── fees.tsx           ← Fee management
│   ├── attendance.tsx     ← Attendance tracker
│   ├── assignments.tsx    ← Assignment management
│   ├── performance.tsx    ← Performance reports
│   ├── communication.tsx  ← Announcements
│   ├── reminders.tsx      ← Fee reminders
│   ├── bulk-import.tsx    ← CSV bulk import
│   ├── settings.tsx       ← Institute settings
│   └── more.tsx           ← More menu
components/
├── ui/                    ← Reusable components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── StatCard.tsx
│   ├── EmptyState.tsx
│   └── ScreenHeader.tsx
lib/
├── supabase/client.ts     ← Supabase client (AsyncStorage)
├── institute-types.ts     ← Shared types
├── enrollment.ts          ← Auto enrollment number
└── store/auth.ts          ← Zustand auth store
```

## Tech Stack

- **Expo SDK 51** — React Native framework
- **Expo Router v3** — File-based navigation
- **Supabase** — Same backend as web app
- **NativeWind v4** — Tailwind CSS for React Native
- **Zustand** — State management
- **AsyncStorage** — Session persistence
