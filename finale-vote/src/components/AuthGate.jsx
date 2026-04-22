import { useState } from 'react'
import { validateUnimaEmail } from '../hooks/useAuth'
import EyeIcon from './EyeIcon'
import './AuthGate.css'

export default function AuthGate({ onSignIn, onSignUp, onSignInAdmin }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Unified sign in — tries admin first, falls back to voter
  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')

    const trimmedEmail = email.trim().toLowerCase()
    const isUnimaEmail = trimmedEmail.endsWith('@unima.ac.mw')

    if (!isUnimaEmail) {
      const adminResult = await onSignInAdmin(trimmedEmail, password)
      if (!adminResult.success) {
        setError('Access denied. Only @unima.ac.mw emails or registered admins can sign in.')
      }
      setLoading(false)
      return
    }

    const adminResult = await onSignInAdmin(trimmedEmail, password)
    if (adminResult.success) { setLoading(false); return }

    const voterResult = await onSignIn(trimmedEmail, password)
    if (!voterResult.success) setError(voterResult.error)
    setLoading(false)
  }

  const handleSignUp = async () => {
    const { valid, reason } = validateUnimaEmail(email)
    if (!valid) { setError(reason); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    const result = await onSignUp(email, password)
    if (!result.success) { setError(result.error); setLoading(false); return }
    // Auto signed in — no email verification needed
    setLoading(false)
  }

  const switchMode = (m) => { setMode(m); setError(''); setPassword(''); setConfirmPassword('') }

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

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')}>Sign Up</button>
        </div>

        <div className="auth-heading">
          <h1 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <p className="auth-desc">
            {mode === 'login'
              ? 'Sign in with your email and password.'
              : 'Register with your UNIMA email to access the voting system.'}
          </p>
        </div>

        <div className="auth-form">
          <input
            className="auth-input"
            type="email"
            placeholder="e.g. bsc-com-03-22@unima.ac.mw"
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
              onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()}
              disabled={loading}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button className="auth-eye" type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
              <EyeIcon visible={showPassword} />
            </button>
          </div>

          {mode === 'signup' && (
            <input
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSignUp()}
              disabled={loading}
              autoComplete="new-password"
            />
          )}

          {error && <p className="auth-error">{error}</p>}

          <button
            className="auth-btn"
            onClick={mode === 'login' ? handleLogin : handleSignUp}
            disabled={loading || !email || !password}
          >
            {loading ? <span className="auth-spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>Don't have an account? <button onClick={() => switchMode('signup')}>Sign up</button></p>
          ) : (
            <p>Already have an account? <button onClick={() => switchMode('login')}>Sign in</button></p>
          )}
        </div>

        <p className="auth-note">
          Only <code>@unima.ac.mw</code> emails with year suffix 18–22 are eligible to vote.
        </p>
      </div>
    </div>
  )
}
