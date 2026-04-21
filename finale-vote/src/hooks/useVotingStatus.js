import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useVotingStatus() {
  const [votingOpen, setVotingOpen] = useState(false)
  const [resultsVisible, setResultsVisible] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
    const ch = supabase.channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchStatus)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const fetchStatus = async () => {
    const { data } = await supabase.from('settings').select('key, value')
    const map = Object.fromEntries((data || []).map(r => [r.key, r.value]))
    setVotingOpen(map['voting_open'] === 'true')
    setResultsVisible(map['results_visible'] === 'true')
    setStatusLoading(false)
  }

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

  return { votingOpen, resultsVisible, statusLoading, setVotingOpen: setVotingOpenFn, setResultsVisible: setResultsVisibleFn }
}
