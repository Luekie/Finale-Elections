import { useState } from 'react'
import { supabase } from '../supabase'
import EyeIcon from './EyeIcon'
import './AdminLogin.css'

export default function AdminLogin({ onResult }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pin.trim()) return
    setLoading(true)
    setError('')

    try {
      const { data, error: dbError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'admin_pin')
        .single()

      if (dbError || !data) {
        // Fallback to env var if DB fetch fails
        const fallback = import.meta.env.VITE_ADMIN_PIN || 'FINALE2026'
        if (pin.trim() === fallback) { onResult(true); return }
        throw new Error('Could not verify PIN')
      }

      // Case-sensitive comparison — PIN is stored exactly as set
      if (pin.trim() === data.value) {
        onResult(true)
      } else {
        setError('Incorrect PIN')
        setShake(true)
        setPin('')
        setTimeout(() => setShake(false), 500)
      }
    } catch (err) {
      setError(err.message || 'Failed to verify PIN')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-overlay" onClick={() => onResult(false)}>
      <div
        className={`login-modal glass-card ${shake ? 'shake' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="login-icon">🔒</div>
        <h2 className="login-title">Admin Access</h2>
        <p className="login-sub">Enter your admin PIN to continue</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="pin-input-wrap">
            <input
              className="text-input pin-input"
              type={showPin ? 'text' : 'password'}
              placeholder="Enter PIN"
              value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={loading}
              maxLength={20}
            />
            <button
              type="button"
              className="pin-toggle"
              onClick={() => setShowPin(s => !s)}
              tabIndex={-1}
              aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
            >
              <EyeIcon visible={showPin} />
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="btn-primary login-btn"
            disabled={loading || !pin.trim()}
          >
            {loading ? <span className="login-spinner" /> : 'Unlock'}
          </button>
        </form>

        <button className="login-cancel" onClick={() => onResult(false)}>Cancel</button>
      </div>
    </div>
  )
}
