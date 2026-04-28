import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useVoterCount() {
  const [uniqueVoters, setUniqueVoters] = useState(0)

  const fetchCount = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_unique_voter_count')
    if (!error && data != null) setUniqueVoters(data)
  }, [])

  useEffect(() => {
    fetchCount()
    const ch = supabase.channel('voter-count-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vote_log' }, fetchCount)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchCount])

  return uniqueVoters
}
