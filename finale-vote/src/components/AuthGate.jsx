import { useState } from 'react'
import EyeIcon from './EyeIcon'
import './AuthGate.css'

export default function AuthGate({ onSignInWithGoogle, onSignInAdmin }) {
  const [adminMode, setAdminMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    const result = await onSignInWithGoogle()
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  const handleAdminLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    const result = await onSignInAdmin(email.trim().toLowerCase(), password)
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">✦</span>
          <div>
            <span className="auth-logo-title">Class of 2026</span>
            <span className="auth-logo-sub">Double Cohort Voting System</span>
          </div>
        </div>

        {!adminMode ? (
          <>
            <div className="auth-heading">
              <h1 className="auth-title">Welcome</h1>
              <p className="auth-desc">
                Sign in with your <strong>@unima.ac.mw</strong> Google account to access the voting system.
              </p>
            </div>

            <div className="auth-form">
              {error && <p className="auth-error">{error}</p>}

              <button
                className="auth-google-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? <span className="auth-spinner" /> : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>

            <div className="auth-note">
              Only <code>@unima.ac.mw</code> accounts (cohorts 20–22) are eligible to vote.
              <br />
              <button className="auth-admin-link" onClick={() => { setAdminMode(true); setError('') }}>
                Admin sign in
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="auth-heading">
              <h1 className="auth-title">Admin Sign In</h1>
              <p className="auth-desc">Enter your admin credentials.</p>
            </div>

            <div className="auth-form">
              <input
                className="auth-input"
                type="email"
                placeholder="Admin email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
              <div className="auth-input-wrap">
                <input
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button className="auth-eye" type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  <EyeIcon visible={showPassword} />
                </button>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button
                className="auth-btn"
                onClick={handleAdminLogin}
                disabled={loading || !email || !password}
              >
                {loading ? <span className="auth-spinner" /> : 'Sign In'}
              </button>
            </div>

            <div className="auth-note">
              <button className="auth-admin-link" onClick={() => { setAdminMode(false); setError('') }}>
                ← Back to voter sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
