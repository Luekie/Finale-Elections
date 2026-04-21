import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useVotingStatus() {
  const [votingOpen, setVotingOpen] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
    const ch = supabase.channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchStatus)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const fetchStatus = async () => {
    const { data } = await supabase
      .from('settings').select('value').eq('key', 'voting_open').single()
    setVotingOpen(data?.value === 'true')
    setStatusLoading(false)
  }

  const setVotingOpenFn = async (open) => {
    // Optimistic update — instant UI response
    setVotingOpen(open)
    await supabase.from('settings')
      .upsert({ key: 'voting_open', value: open ? 'true' : 'false' }, { onConflict: 'key' })
  }

  return { votingOpen, statusLoading, setVotingOpen: setVotingOpenFn }
}
