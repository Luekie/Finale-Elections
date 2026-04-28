import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useVotingStatus() {
  const [votingOpen, setVotingOpen] = useState(false)
  const [resultsVisible, setResultsVisible] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)
  const [scheduledTime, setScheduledTime] = useState(null)

  const fetchStatus = useCallback(async () => {
    const { data } = await supabase.from('settings').select('key, value')
    const map = Object.fromEntries((data || []).map(r => [r.key, r.value]))
    setVotingOpen(map['voting_open'] === 'true')
    setResultsVisible(map['results_visible'] === 'true')
    setScheduledTime(map['scheduled_voting_time'] || null)
    setStatusLoading(false)
  }, [])

  useEffect(() => {
    fetchStatus()
    const ch = supabase.channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchStatus)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchStatus])

  // Check scheduled open time every minute
  useEffect(() => {
    if (!scheduledTime || votingOpen) return

    const checkSchedule = async () => {
      const now = new Date()
      const scheduled = new Date(scheduledTime)
      
      if (now >= scheduled) {
        console.log('Scheduled voting time reached, opening voting...')
        await setVotingOpenFn(true)
        await supabase.from('settings')
          .upsert({ key: 'scheduled_voting_time', value: '' }, { onConflict: 'key' })
      }
    }

    checkSchedule()
    const interval = setInterval(checkSchedule, 60000)
    return () => clearInterval(interval)
  }, [scheduledTime, votingOpen])

  const setVotingOpenFn = async (open) => {
    setVotingOpen(open)
    await supabase.from('settings')
      .upsert({ key: 'voting_open', value: open ? 'true' : 'false' }, { onConflict: 'key' })
  }

  const setResultsVisibleFn = async (visible) => {
    setResultsVisible(visible)
    await supabase.from('settings')
      .upsert({ key: 'results_visible', value: visible ? 'true' : 'false' }, { onConflict: 'key' })
  }

  const setScheduledVotingTime = async (isoTime) => {
    setScheduledTime(isoTime)
    await supabase.from('settings')
      .upsert({ key: 'scheduled_voting_time', value: isoTime || '' }, { onConflict: 'key' })
  }

  const invalidateAllSessions = async () => {
    const token = Date.now().toString()
    await supabase.from('settings')
      .upsert({ key: 'session_token', value: token }, { onConflict: 'key' })
  }

  return { 
    votingOpen, 
    resultsVisible, 
    statusLoading, 
    scheduledTime,
    setVotingOpen: setVotingOpenFn, 
    setResultsVisible: setResultsVisibleFn,
    setScheduledVotingTime,
    invalidateAllSessions
  }
}
