import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DOMAIN = 'unima.ac.mw'
const ALLOWED_YEARS = ['18', '19', '20', '21', '22']

export function validateUnimaEmail(email) {
  if (!email) return { valid: false, reason: 'Enter your UNIMA email address.' }
  const lower = email.trim().toLowerCase()
  if (!lower.endsWith(`@${DOMAIN}`)) {
    return { valid: false, reason: 'Only @unima.ac.mw email addresses are allowed.' }
  }
  const local = lower.split('@')[0]
  const parts = local.split(/[-/_]/).filter(Boolean)
  // The LAST segment must be the year (18-22), anything before is flexible
  const year = parts[parts.length - 1]
  if (!ALLOWED_YEARS.includes(year)) {
    return {
      valid: false,
      reason: `Only fourth-year students (cohorts ${ALLOWED_YEARS.join(', ')}) are eligible to vote.`
    }
  }
  return { valid: true, reason: null }
}

async function checkIsAdmin(email) {
  if (!email) return { isAdmin: false, name: null }
  try {
    const { data } = await supabase
      .from('admins')
      .select('email, name')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    return { isAdmin: !!data, name: data?.name || null }
  } catch {
    return { isAdmin: false, name: null }
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
      const { isAdmin, name } = await checkIsAdmin(email)

      if (!mounted) return

      if (isAdmin) {
        setUser({ email, isAdmin: true, name })
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

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password) => {
    const { valid, reason } = validateUnimaEmail(email)
    if (!valid) return { success: false, error: reason }
    const { error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password })
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  const signIn = async (email, password) => {
    const { valid, reason } = validateUnimaEmail(email)
    if (!valid) return { success: false, error: reason }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  const signInAdmin = async (email, password) => {
    try {
      // Check if this email is in the admins table first
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

  return { user, authLoading, signUp, signIn, signInAdmin, signOut }
}
