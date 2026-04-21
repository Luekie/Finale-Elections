# Next Steps - Google OAuth Integration

The app has been updated to use Google OAuth authentication with UNIMA email validation. Here's what you need to do:

## ✅ What's Already Done

- ✅ Updated `useAuth.js` to use Supabase Auth with Google OAuth
- ✅ Updated `AuthGate.jsx` with Google sign-in button
- ✅ Updated `App.jsx` to handle OAuth flow
- ✅ Added email validation that automatically checks for `@unima.ac.mw` and year suffixes
- ✅ Added Google button styling with official Google branding
- ✅ Created comprehensive setup documentation

## 🔧 What You Need to Do

### 1. Run Database Migration (If Not Done)

Open Supabase SQL Editor and run:
```sql
-- From SUPABASE_AUTH_MIGRATION.sql
alter table vote_log add column if not exists voter_email text;
create index if not exists vote_log_voter_email_idx on vote_log(voter_email);
alter table vote_log drop constraint if exists one_vote_per_category;
alter table vote_log add constraint one_vote_per_category unique (voter_email, category_id);
```

### 2. Configure Google OAuth in Supabase

Follow the detailed guide in `GOOGLE_AUTH_SETUP.md`:

**Quick Steps:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Note the callback URL shown (you'll need this for Google Cloud Console)

### 3. Set Up Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173`
     - Your production URL
   - **Authorized redirect URIs**: 
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret

### 4. Add Credentials to Supabase

1. Back in Supabase → Authentication → Providers → Google
2. Paste Client ID
3. Paste Client Secret
4. Save

### 5. Test the Integration

```bash
npm run dev
```

Then:
1. Open http://localhost:5173
2. Click "Sign in with Google"
3. Sign in with a `@unima.ac.mw` email (with year suffix 18-22)
4. You should be logged in and able to vote

## 🔍 How It Works

1. **User clicks "Sign in with Google"**
   - Redirects to Google OAuth consent screen
   
2. **User signs in with Google**
   - Google redirects back to Supabase with auth token
   
3. **Supabase creates session**
   - App receives user data including email
   
4. **Email validation runs automatically**
   - Checks for `@unima.ac.mw` domain
   - Checks for valid year suffix (18, 19, 20, 21, 22)
   - If invalid: user is signed out with error message
   - If valid: user can access voting system

5. **Votes are tracked by email**
   - Each vote is stored with `voter_email`
   - Database constraint prevents duplicate votes per category
   - Users can see their voting history

## 🚨 Important Notes

- **Testing**: You'll need actual `@unima.ac.mw` Google accounts to test, or add test users in Google Cloud Console
- **Security**: The email validation happens client-side AND is enforced by database constraints
- **One Vote Per Category**: The database ensures each email can only vote once per category
- **Session Persistence**: Users stay logged in across browser sessions via Supabase Auth

## 📝 Valid Email Examples

✅ **These will work:**
- `bsc-com-03-22@unima.ac.mw`
- `BSC-COM-03-22@unima.ac.mw` (case-insensitive)
- `bsc/com/03/21@unima.ac.mw`
- `bsc_com_03_20@unima.ac.mw`
- `john-doe-19@unima.ac.mw`

❌ **These will be rejected:**
- `student@gmail.com` (wrong domain)
- `bsc-com-03-23@unima.ac.mw` (year 23 not allowed)
- `test@unima.ac.mw` (no year suffix)
- `bsc-com-03-17@unima.ac.mw` (year 17 not allowed)

## 🐛 Troubleshooting

See `GOOGLE_AUTH_SETUP.md` for detailed troubleshooting steps.

Common issues:
- **"Redirect URI mismatch"**: Check Google Cloud Console redirect URIs match Supabase exactly
- **"Access blocked"**: Complete OAuth consent screen in Google Cloud Console
- **User signed out immediately**: Email doesn't meet validation requirements
- **"Invalid client"**: Double-check Client ID and Secret in Supabase

## 📚 Documentation Files

- `GOOGLE_AUTH_SETUP.md` - Detailed OAuth setup guide
- `README.md` - Updated with full project documentation
- `SUPABASE_AUTH_MIGRATION.sql` - Database migration for email tracking
- This file - Quick reference for next steps
