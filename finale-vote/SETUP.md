# Finale Vote — Setup Guide

A modern voting app with Firebase backend, light/dark themes, admin controls, contestant photos, and rich analytics.

## Features

- 🔐 **Admin PIN protection** — only you can manage contestants
- 📸 **Contestant photos** — upload images for each contestant
- 🌓 **Light/dark mode** — smooth theme toggle
- 📊 **Rich analytics** — pie charts, bar charts, vote timeline
- 🔥 **Real-time sync** — all devices see live updates via Firebase
- 📱 **Responsive** — works on phones, tablets, desktops

---

## 1. Firebase Setup

### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Name it (e.g., "finale-vote")
4. Disable Google Analytics (optional)
5. Click **Create project**

### Enable Firestore Database

1. In your project, go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for now)
4. Select a region close to you
5. Click **Enable**

### Enable Storage

1. Go to **Build → Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Click **Next** → **Done**

### Get Your Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** → Click the **</>** (Web) icon
3. Register your app (name it anything)
4. Copy the `firebaseConfig` object

---

## 2. Local Setup

### Install Dependencies

```bash
cd finale-vote
npm install
```

### Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_ADMIN_PIN=1234
   ```

3. **Change the `VITE_ADMIN_PIN`** to your own secret PIN (4-8 digits)

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 3. Deploy Online

### Option A: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **New Project** → Import your repo
4. Add environment variables (all `VITE_*` vars from your `.env`)
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

### Option B: Netlify

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click **Add new site** → Import from Git
4. Select your repo
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Add environment variables in **Site settings → Environment variables**
8. Deploy

### Option C: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Choose your project, set public dir to "dist", configure as SPA
npm run build
firebase deploy
```

---

## 4. Firestore Security Rules (Production)

Once deployed, update your Firestore rules for security:

1. Go to **Firestore Database → Rules**
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read contestants and vote log
    match /contestants/{id} {
      allow read: if true;
      allow write: if false; // Only via admin panel (client-side PIN check)
    }
    match /voteLog/{id} {
      allow read: if true;
      allow create: if true; // Anyone can vote
      allow update, delete: if false;
    }
  }
}
```

3. **Storage Rules** (Build → Storage → Rules):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /contestants/{imageId} {
      allow read: if true;
      allow write: if false; // Only via admin panel
    }
  }
}
```

**Note:** The admin PIN is client-side only. For true security, you'd need Firebase Auth + Cloud Functions. This setup is fine for trusted dinner events.

---

## 5. Usage

### Admin Panel

1. Click **🔒 Manage** in the header
2. Enter your PIN
3. Add contestants with names and photos
4. Remove contestants or reset votes

### Voting

1. Go to **Vote** tab
2. Click a contestant card
3. Vote is recorded (one per device via localStorage)

### Results

1. Go to **Results** tab
2. See live leaderboard, stats, charts, and timeline

---

## 6. Customization

### Change Theme Colors

Edit `src/index.css` — look for `:root` and `[data-theme="light"]` CSS variables.

### Change Admin PIN

Update `VITE_ADMIN_PIN` in your `.env` file (locally) or in your hosting platform's environment variables.

### Adjust Layout

- Max width: Edit `.main { max-width: 960px }` in `src/App.css`
- Grid columns: Edit `.vote-grid` in `src/components/VotingPanel.css`

---

## 7. Troubleshooting

**"Firebase not configured"**
- Make sure `.env` exists and all `VITE_FIREBASE_*` vars are set
- Restart dev server after changing `.env`

**"Permission denied" errors**
- Check Firestore rules (see step 4)
- Make sure you're in test mode during development

**Images not uploading**
- Check Storage rules
- Verify Storage is enabled in Firebase Console
- Check browser console for errors

**Votes not syncing**
- Check Firestore rules allow read/write
- Open browser console for errors
- Verify internet connection

---

## Tech Stack

- **React 18** + **Vite 5**
- **Firebase** (Firestore + Storage)
- **Recharts** for analytics
- Pure CSS with glassmorphism design

---

## Support

For issues or questions, check:
- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Docs](https://vitejs.dev)
- [Recharts Docs](https://recharts.org)

Enjoy your finale dinner! 🎉
