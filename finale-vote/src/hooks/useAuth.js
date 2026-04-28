import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getDeviceFingerprint } from './useFingerprint'

const DOMAIN = 'unima.ac.mw'
const ALLOWED_YEARS = ['20', '21', '22']
const ALLOWED_PREFIXES = new Set([
  'bsc', 'bsc-com', 'bah', 'ba-eco', 'bsc-inf', 'bsc-com-ne',
  'law', 'ess', 'me-ess', 'bed-com', 'ba-soc', 'ba-seh', 'ba-mfd',
  'ba-dec', 'ba-psy', 'bsoc-gen', 'bsc-ele', 'bed-phy', 'bed-hec',
  'bed-che', 'bed-bio', 'bed-mat', 'bed-sed', 'bed-led', 'bsc-inf-me',
  'bsc-che-hon', 'bsc-mat', 'bsc-bio', 'bsc-phy', 'bsc-act-hon',
  'bsc-fn', 'ba-com', 'bsc-sta', 'bsc-geo', 'bsoc', 'bsoc-sw',
  'ps','pa','el','bth', 'becd',
           
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
  if (num < 1 || num > 100) {
    return { valid: false, reason: 'Student number must be between 01 and 100.' }
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

    // Watch for session invalidation by admin
    let lastToken = null
    const sessionChannel = supabase.channel('session-invalidation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, async (payload) => {
        if (payload.new?.key === 'session_token') {
          const newToken = payload.new?.value
          if (lastToken && lastToken !== newToken) {
            await supabase.auth.signOut()
          }
          lastToken = newToken
        }
      })
      .subscribe()

    // Fetch initial token
    supabase.from('settings').select('value').eq('key', 'session_token').maybeSingle()
      .then(({ data }) => { if (data) lastToken = data.value })

    return () => {
      mounted = false
      subscription.unsubscribe()
      supabase.removeChannel(sessionChannel)
      window.removeEventListener('pagehide', handleUnload)
    }
  }, [])

  const signIn = async (email, password) => {
    const trimmed = email.trim().toLowerCase()
    const { error } = await supabase.auth.signInWithPassword({ email: trimmed, password })
    if (error) return { success: false, error: 'Incorrect email or password.' }
    return { success: true }
  }

  const signUp = async (email, password) => {
    const trimmed = email.trim().toLowerCase()
    const { valid, reason } = validateUnimaEmail(trimmed)
    if (!valid) return { success: false, error: reason }
    if (password.length < 8) return { success: false, error: 'Password must be at least 8 characters.' }

    // Check device fingerprint — block if this device has already registered 2 or more accounts
    let fingerprint
    try {
      fingerprint = await getDeviceFingerprint()
    } catch {
      return { success: false, error: 'Unable to verify your device. Please try a different browser.' }
    }

    const { count, error: countError } = await supabase
      .from('device_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('fingerprint', fingerprint)

    if (countError) {
      return { success: false, error: 'Verification failed. Please try again.' }
    }

    if (count >= 2) {
      return { success: false, error: 'possible fraud detected' }
    }

    // Check failed signup attempts in the last 2 hours
    const cutoff = new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString()
    const { count: recentFails } = await supabase
      .from('signup_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('fingerprint', fingerprint)
      .gte('created_at', cutoff)

    if (recentFails >= 3) {
      return { success: false, error: 'Too many sign-up attempts from this device. Try again in 16 hours.' }
    }

    const { error } = await supabase.auth.signUp({ email: trimmed, password, options: { emailRedirectTo: undefined } })
    if (error) {
      await supabase.from('signup_attempts').insert({ fingerprint, email: trimmed })
      return { success: false, error: error.message || 'Sign up failed.' }
    }

    // Record the fingerprint — if this fails, roll back by signing out
    const { error: regError } = await supabase
      .from('device_registrations')
      .insert({ fingerprint, email: trimmed })

    if (regError) {
      await supabase.auth.signOut()
      return { success: false, error: 'Registration could not be completed. Please try again.' }
    }

    return { success: true }
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

  return { user, authLoading, signIn, signUp, signInAdmin, signOut }
}
