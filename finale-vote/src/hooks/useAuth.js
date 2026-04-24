import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const OTP_SERVER = import.meta.env.VITE_OTP_SERVER_URL || 'http://localhost:3001'
const DOMAIN = 'unima.ac.mw'
const ALLOWED_YEARS = ['18', '19', '20', '21', '22']
const ALLOWED_PREFIXES = new Set([
  'bsc', 'bsc-com', 'bah', 'ba-eco', 'bsc-inf', 'bsc-com-ne',
  'law', 'ess', 'me-ess', 'bed-com', 'ba-soc', 'ba-seh', 'ba-mfd',
  'ba-dec', 'ba-psy', 'bsoc-gen', 'bsc-ele', 'bed-phy', 'bed-hec',
  'bed-che', 'bed-bio', 'bed-mat', 'bed-sed', 'bed-led', 'bsc-inf-me',
  'bsc-che-hon', 'bsc-mat', 'bsc-bio', 'bsc-phy', 'bsc-act-hon',
  'bsc-fn', 'ba-com', 'bsc-sta', 'bsc-geo', 'bsoc', 'bsoc-sw',
])

export function validateUnimaEmail(email) {
  if (!email) return { valid: false, reason: 'Enter your UNIMA email address.' }
  const lower = email.trim().toLowerCase()
  if (!lower.endsWith(`@${DOMAIN}`)) {
    return { valid: false, reason: 'Only @unima.ac.mw email addresses are allowed.' }
  }
  const local = lower.split('@')[0]

  // Only hyphens allowed as separators — no underscores, dots, etc.
  if (!/^[a-z0-9-]+$/.test(local)) {
    return { valid: false, reason: 'Use hyphens only as separators (e.g. bsc-com-09-22@unima.ac.mw).' }
  }

  // Format: <prefix>-<number>-<year>  OR  <prefix>-me-<number>-<year>
  const parts = local.split('-')
  if (parts.length < 3) {
    return { valid: false, reason: 'Invalid registration format. Use e.g. bsc-com-09-22@unima.ac.mw.' }
  }

  const year = parts[parts.length - 1]
  const numStr = parts[parts.length - 2]

  // Check if "me" sits just before the number (mature entry)
  const isME = parts.length >= 4 && parts[parts.length - 3] === 'me'
  const prefix = isME
    ? parts.slice(0, -3).join('-')
    : parts.slice(0, -2).join('-')

  // Year check
  if (!ALLOWED_YEARS.includes(year)) {
    return {
      valid: false,
      reason: `Only fourth-year students (cohorts ${ALLOWED_YEARS.join(', ')}) are eligible to vote.`
    }
  }

  // Number check: 2+ digits, 01–200
  if (!/^\d{2,}$/.test(numStr)) {
    return { valid: false, reason: 'Student number must be at least 2 digits (e.g. 09, not 9).' }
  }
  const num = parseInt(numStr, 10)
  if (num < 1 || num > 200) {
    return { valid: false, reason: 'Student number must be between 01 and 200.' }
  }

  // Prefix check
  if (!ALLOWED_PREFIXES.has(prefix)) {
    return {
      valid: false,
      reason: 'Unrecognised programme code. Please use your institutional email (e.g. bsc-com-09-22@unima.ac.mw).'
    }
  }

  return { valid: true, reason: null }
}

async function checkIsAdmin(email) {
  if (!email) return { isAdmin: false, name: null, role: null }
  try {
    const { data } = await supabase
      .from('admins')
      .select('email, name, role')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    return { isAdmin: !!data, name: data?.name || null, role: data?.role || null }
  } catch {
    return { isAdmin: false, name: null, role: null }
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const resolveUser = async (session) => {
      if (!session?.user?.email) {
        if (mounted) { setUser(null); setAuthLoading(false) }
        return
      }
      const email = session.user.email.toLowerCase()
      const { isAdmin, name, role } = await checkIsAdmin(email)

      if (!mounted) return

      if (isAdmin) {
        setUser({ email, isAdmin: true, name, role })
      } else {
        const { valid } = validateUnimaEmail(email)
        if (valid) {
          setUser({ email, isAdmin: false, name: null })
        } else {
          supabase.auth.signOut()
          setUser(null)
        }
      }
      setAuthLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveUser(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveUser(session)
    })

    const handleUnload = () => { supabase.auth.signOut() }
    window.addEventListener('pagehide', handleUnload)

    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener('pagehide', handleUnload)
    }
  }, [])

  // Send OTP via our Nodemailer server
  const sendOtp = async (email) => {
    const trimmed = email.trim().toLowerCase()
    const { valid, reason } = validateUnimaEmail(trimmed)
    if (!valid) return { success: false, error: reason }
    try {
      const res = await fetch(`${OTP_SERVER}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Failed to send code.' }
      return { success: true }
    } catch {
      return { success: false, error: 'Could not reach the server. Try again.' }
    }
  }

  // Verify OTP via our server, then sign into Supabase using returned session
  const verifyOtp = async (email, otp) => {
    const trimmed = email.trim().toLowerCase()
    try {
      const res = await fetch(`${OTP_SERVER}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, otp }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Invalid code.' }

      // Use token_hash with type magiclink
      const { error } = await supabase.auth.verifyOtp({
        token_hash: data.token,
        type: 'magiclink',
      })
      if (error) {
        console.error('verifyOtp error:', error.message, 'token was:', data.token, 'action_link:', data.action_link)
        return { success: false, error: 'Session error. Try again.' }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Could not reach the server. Try again.' }
    }
  }

  const signInAdmin = async (email, password) => {
    try {
      const { data } = await supabase
        .from('admins')
        .select('email, name')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()

      if (!data) return { success: false, error: 'Not an admin email.' }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password,
      })
      if (error) return { success: false, error: 'Incorrect password.' }
      return { success: true }
    } catch {
      return { success: false, error: 'Login failed. Try again.' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, authLoading, sendOtp, verifyOtp, signInAdmin, signOut }
}
