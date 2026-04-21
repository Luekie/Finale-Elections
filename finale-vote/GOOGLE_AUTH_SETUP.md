# Google OAuth Setup Guide

This guide will help you configure Google OAuth authentication for the voting system.

## Step 1: Enable Google Auth in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Providers** in the left sidebar
4. Find **Google** in the list of providers
5. Toggle **Enable Sign in with Google** to ON

## Step 2: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: **Class of 2026 Voting System**
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Finale Vote App**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
     - Replace `YOUR_SUPABASE_PROJECT_REF` with your actual project reference
     - You can find this in Supabase under Authentication → Providers → Google

7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Step 3: Configure Supabase with Google Credentials

1. Go back to Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Paste your **Client ID** from Google
3. Paste your **Client Secret** from Google
4. Click **Save**

## Step 4: Configure Redirect URLs (Optional)

If you're deploying to production:

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add your production URL to **Site URL**
3. Add your production URL to **Redirect URLs**

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the app in your browser
3. Click "Sign in with Google"
4. You should be redirected to Google's sign-in page
5. Sign in with a `@unima.ac.mw` email address
6. You should be redirected back to the app and logged in

## Important Notes

- **Email Validation**: The app automatically validates that the Google account email:
  - Ends with `@unima.ac.mw`
  - Contains a valid year suffix (18, 19, 20, 21, or 22)
  - If validation fails, the user is automatically signed out with an error message

- **Security**: Users can only vote once per category, tracked by their email address in the database

- **Testing**: For testing, you'll need actual `@unima.ac.mw` Google accounts or configure test users in Google Cloud Console

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Google Cloud Console exactly matches the one shown in Supabase
- Check for trailing slashes or http vs https

### "Access blocked: This app's request is invalid"
- Complete the OAuth consent screen configuration in Google Cloud Console
- Add your email as a test user if the app is in testing mode

### User gets signed out immediately after login
- Check that their email meets the validation requirements
- Look for error messages in the browser console
- Verify the email domain is exactly `@unima.ac.mw`

### "Invalid client" error
- Double-check that Client ID and Client Secret are correctly copied to Supabase
- Make sure there are no extra spaces or characters
