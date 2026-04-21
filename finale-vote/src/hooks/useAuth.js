import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DOMAIN = 'unima.ac.mw'
const ALLOWED_YEARS = ['18', '19', '20', '21', '22']

/**
 * Validates a UNIMA student email.
 * Rules:
 *  - Must end with @unima.ac.mw (case-insensitive)
 *  - Must contain a 2-digit year in ALLOWED_YEARS
 */
export function validateUnimaEmail(email) {
  if (!email) return { valid: false, reason: 'Enter your UNIMA email address.' }

  const lower = email.trim().toLowerCase()

  if (!lower.endsWith(`@${DOMAIN}`)) {
    return { valid: false, reason: 'Only @unima.ac.mw email addresses are allowed.' }
  }

  const local = lower.split('@')[0]
  const parts = local.split(/[-/_]/).filter(Boolean)
  const hasValidYear = parts.some(p => ALLOWED_YEARS.includes(p))

  if (!hasValidYear) {
    return {
      valid: false,
      reason: `Only fourth-year students (cohorts ${ALLOWED_YEARS.join(', ')}) are eligible to vote.`
    }
  }

  return { valid: true, reason: null }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const { valid } = validateUnimaEmail(session.user.email)
        if (valid) {
          setUser({ email: session.user.email })
        } else {
          // Invalid email - sign them out
          setAuthError('Your Google account email does not meet eligibility requirements.')
          supabase.auth.signOut()
        }
      }
      setAuthLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        const { valid, reason } = validateUnimaEmail(session.user.email)
        if (valid) {
          setUser({ email: session.user.email })
          setAuthError(null)
        } else {
          setAuthError(reason)
          setUser(null)
          supabase.auth.signOut()
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }

  const signOut = async () => {
    setAuthError(null)
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, authLoading, authError, signInWithGoogle, signOut }
}
