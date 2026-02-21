# Habit Tracker

A modern, habit tracking application with real-time cloud synchronization and social features.

## ✨ Features

- **Personal Habit Grid**: Simple yes/no/blank grid to track daily consistency.
- **Dynamic Streaks**: Automatic calculation of current and best streaks for every habit.
- **Real-time Sync**: Bi-directional synchronization between local state and Firebase Firestore.
- **Offline-First**: Works instantly via localStorage; syncs to the cloud when online.
- **Friends & Social**: Connect with friends via unique invite codes and view their habit grids in real-time.
- **Premium Aesthetics**: Clean, glassmorphic UI with smooth animations and responsive design.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database/Auth**: [Firebase](https://firebase.google.com/) (Firestore & Google Auth)
- **Styling**: Tailwind CSS & Lucide Icons
- **State Management**: Custom React Hooks with local persistence

## 🛠️ Setup

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env.local` file in the root with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. **Deploy Firestore Rules**:
   Ensure your Firestore security rules allow authenticated users to read/write their own data and read friend data. (See `firestore.rules` for reference).

## 💻 Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.
