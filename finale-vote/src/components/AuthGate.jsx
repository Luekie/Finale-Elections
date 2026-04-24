import { useState } from 'react'
import EyeIcon from './EyeIcon'
import './AuthGate.css'

export default function AuthGate({ onSignInAdmin, onSendOtp, onVerifyOtp }) {
  // 'email' → enter email, 'otp' → enter OTP code, 'admin' → admin password login
  const [stage, setStage] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const isUnimaEmail = email.trim().toLowerCase().endsWith('@unima.ac.mw')

  // Detect if non-unima → switch to admin password flow
  const handleEmailContinue = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Enter your email address.'); return }

    if (!isUnimaEmail) {
      // Try admin login path
      setStage('admin')
      setError('')
      return
    }

    setLoading(true); setError('')
    const result = await onSendOtp(trimmed)
    setLoading(false)
    if (!result.success) { setError(result.error); return }
    setStage('otp')
    startCooldown()
  }

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit code.'); return }
    setLoading(true); setError('')
    const result = await onVerifyOtp(email.trim().toLowerCase(), otp.trim())
    setLoading(false)
    if (!result.success) setError(result.error)
    // on success, useAuth listener picks up the session automatically
  }

  const handleAdminLogin = async () => {
    if (!password) { setError('Enter your password.'); return }
    setLoading(true); setError('')
    const result = await onSignInAdmin(email.trim().toLowerCase(), password)
    setLoading(false)
    if (!result.success) setError('Access denied. Only @unima.ac.mw emails or registered admins can sign in.')
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setLoading(true); setError('')
    const result = await onSendOtp(email.trim().toLowerCase())
    setLoading(false)
    if (!result.success) { setError(result.error); return }
    startCooldown()
  }

  const startCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(v => {
        if (v <= 1) { clearInterval(interval); return 0 }
        return v - 1
      })
    }, 1000)
  }

  const reset = () => {
    setStage('email'); setOtp(''); setPassword(''); setError('')
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

        {/* ── Stage: Email entry ── */}
        {stage === 'email' && (
          <>
            <div className="auth-heading">
              <h1 className="auth-title">Sign in</h1>
              <p className="auth-desc">Enter your UNIMA email to receive a one-time code.</p>
            </div>
            <div className="auth-form">
              <input
                className="auth-input"
                type="email"
                placeholder="e.g. bsc-com-09-22@unima.ac.mw"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleEmailContinue()}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn" onClick={handleEmailContinue} disabled={loading || !email.trim()}>
                {loading ? <span className="auth-spinner" /> : 'Continue'}
              </button>
            </div>
            <p className="auth-note">
              Only <code>@unima.ac.mw</code> emails with year suffix 18–22 are eligible to vote.
            </p>
          </>
        )}

        {/* ── Stage: OTP verification ── */}
        {stage === 'otp' && (
          <>
            <div className="auth-heading">
              <h1 className="auth-title">Check your email</h1>
              <p className="auth-desc">
                We sent a 6-digit code to <strong>{email.trim().toLowerCase()}</strong>
              </p>
            </div>
            <div className="auth-form">
              <input
                className="auth-input auth-otp-input"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                disabled={loading}
                autoFocus
              />
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn" onClick={handleVerifyOtp} disabled={loading || otp.length < 6}>
                {loading ? <span className="auth-spinner" /> : 'Verify Code'}
              </button>
              <div className="auth-resend">
                <button onClick={handleResend} disabled={resendCooldown > 0 || loading} className="auth-link-btn">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
                <span className="auth-sep">·</span>
                <button onClick={reset} className="auth-link-btn">Change email</button>
              </div>
            </div>
          </>
        )}

        {/* ── Stage: Admin password login ── */}
        {stage === 'admin' && (
          <>
            <div className="auth-heading">
              <h1 className="auth-title">Admin sign in</h1>
              <p className="auth-desc">Enter your password for <strong>{email.trim().toLowerCase()}</strong></p>
            </div>
            <div className="auth-form">
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
                  autoFocus
                />
                <button className="auth-eye" type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn" onClick={handleAdminLogin} disabled={loading || !password}>
                {loading ? <span className="auth-spinner" /> : 'Sign In'}
              </button>
              <div className="auth-resend">
                <button onClick={reset} className="auth-link-btn">← Back</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
