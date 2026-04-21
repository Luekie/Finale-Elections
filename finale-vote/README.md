# Class of 2026 - Double Cohort Voting System

A modern, secure voting platform for the 2026 Finale Dinner Awards, built with React, Vite, and Supabase.

## Features

- **Google OAuth Authentication** - Secure sign-in with UNIMA institutional accounts
- **Email Validation** - Automatic verification of `@unima.ac.mw` emails with year suffix validation (18-22)
- **Category-Based Voting** - 30 award categories with individual contestants
- **Real-time Updates** - Live vote counts and contestant management
- **Admin Panel** - Manage categories, contestants, and voting status
- **Analytics Dashboard** - View voting statistics and trends
- **Light/Dark Theme** - Toggle between themes with persistent preference
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- Google Cloud Console access for OAuth setup

### 2. Database Setup

1. Create a new project in Supabase
2. Run the SQL migrations in order:
   - `SUPABASE_MIGRATION.sql` - Creates tables and initial data
   - `SUPABASE_AUTH_MIGRATION.sql` - Adds voter email tracking
   - `SUPABASE_PIN_MIGRATION.sql` - Sets up admin PIN authentication

### 3. Google OAuth Setup

Follow the detailed guide in `GOOGLE_AUTH_SETUP.md` to:
- Enable Google authentication in Supabase
- Create OAuth credentials in Google Cloud Console
- Configure redirect URIs and consent screen

### 4. Environment Configuration

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 5. Install and Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Admin Access

1. Click the lock icon (🔒) in the header
2. Enter the admin PIN (default: `COMMITTEENYAMA2026`)
3. Access the Manage and Analytics tabs

To change the admin PIN:
- Go to Supabase Dashboard → SQL Editor
- Run: `UPDATE settings SET value = 'YOUR_NEW_PIN' WHERE key = 'admin_pin';`

## Email Validation Rules

Users must sign in with a Google account that meets these criteria:
- Email domain: `@unima.ac.mw`
- Year suffix: Must contain 18, 19, 20, 21, or 22
- Valid formats:
  - `bsc-com-03-22@unima.ac.mw`
  - `bsc/com/03/21@unima.ac.mw`
  - `bsc_com_03_20@unima.ac.mw`
  - Case-insensitive

## Tech Stack

- **Frontend**: React 19, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Authentication**: Google OAuth with custom email validation
- **Styling**: CSS with CSS Variables for theming

## Project Structure

```
finale-vote/
├── src/
│   ├── components/     # React components
│   ├── context/        # Theme context
│   ├── hooks/          # Custom hooks (auth, voting, etc.)
│   ├── App.jsx         # Main app component
│   └── supabase.js     # Supabase client
├── public/             # Static assets
├── SUPABASE_*.sql      # Database migrations
└── GOOGLE_AUTH_SETUP.md # OAuth setup guide
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Update Google OAuth redirect URIs with your Vercel URL
5. Deploy!

### Other Platforms

The app can be deployed to any static hosting platform (Netlify, Cloudflare Pages, etc.). Just ensure:
- Environment variables are configured
- Google OAuth redirect URIs include your production URL
- Supabase URL configuration includes your production domain

## Credits

- **© 2026 Finale Electoral Committee**
- **Supported by Finale Dinner Committee**
- **Developed by Lusekero Mwanjoka**

## License

Private project for UNIMA Class of 2026
