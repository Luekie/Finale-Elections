# Supabase Email Auth Setup

## 1. Enable Email Confirmations

In Supabase Dashboard → Authentication → Providers → Email:
- ✅ Enable Email provider (should already be on)
- ✅ Enable "Confirm email" toggle ON
- Save

## 2. Set Redirect URL

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: your deployed URL (e.g. https://finale-elections.pages.dev)
- Add to Redirect URLs: https://finale-elections.pages.dev

For local dev also add: http://localhost:5173

## 3. Customize Email Template (Optional)

In Supabase Dashboard → Authentication → Email Templates → Confirm signup:
You can customize the email subject and body to match your branding.

Suggested subject: "Verify your Class of 2026 Voting Account"

## 4. SMTP (Important for Production)

Supabase's built-in email has a limit of 3 emails/hour on the free plan.
For production, configure a custom SMTP provider:

In Supabase Dashboard → Project Settings → Auth → SMTP Settings:
- Use a free service like Resend (https://resend.com) or Brevo
- Resend free tier: 3,000 emails/month — more than enough

## Flow Summary

1. User enters UNIMA email + password on Sign Up screen
2. App validates email format (must be @unima.ac.mw with year 18-22)
3. Supabase sends verification email to the address
4. User clicks link in email → redirected back to app
5. User logs in with email + password
6. App checks email_confirmed_at before granting access
