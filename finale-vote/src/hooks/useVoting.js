import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase'

// Retry a Supabase call up to `maxAttempts` times with exponential backoff
async function withRetry(fn, maxAttempts = 3) {
  let lastError
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn()
      if (result?.error) throw result.error
      return result
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 300 * 2 ** attempt)) // 300ms, 600ms, 1200ms
      }
    }
  }
  throw lastError
}

export function useVoting(userEmail) {
  const [votes, setVotes] = useState({}) // { categoryId: contestantId } — last saved to DB
  const [voteLog, setVoteLog] = useState([])
  const inflightRef = useRef(new Set()) // track in-flight category saves to prevent duplicates

  const fetchVoteLog = useCallback(async () => {
    const { data } = await supabase
      .from('vote_log').select('*').order('created_at', { ascending: true })
    setVoteLog(data || [])
  }, [])

  useEffect(() => {
    if (userEmail) {
      supabase
        .from('vote_log')
        .select('category_id, contestant_id')
        .eq('voter_email', userEmail)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const restored = {}
            data.forEach(v => { restored[v.category_id] = v.contestant_id })
            setVotes(restored)
          }
        })
    }
    fetchVoteLog()
    const ch = supabase.channel('vlog-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vote_log' }, fetchVoteLog)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userEmail, fetchVoteLog])

  // Save a vote — handles both new votes and changes to existing votes
  // Idempotent: skips if already in-flight for this category
  const saveVote = async (categoryId, contestantId) => {
    const previousId = votes[categoryId]
    if (previousId === contestantId) return // no change

    // Prevent concurrent saves for the same category
    if (inflightRef.current.has(categoryId)) return
    inflightRef.current.add(categoryId)

    try {
      if (previousId) {
        // Decrement old contestant's vote count
        await withRetry(() => supabase.rpc('decrement_vote', { contestant_id: previousId }))
        // Update existing vote_log row
        await withRetry(() =>
          supabase
            .from('vote_log')
            .update({ contestant_id: contestantId, created_at: new Date().toISOString() })
            .eq('voter_email', userEmail)
            .eq('category_id', categoryId)
        )
      } else {
        // First time voting in this category
        await withRetry(() =>
          supabase.from('vote_log').insert({
            category_id: categoryId,
            contestant_id: contestantId,
            voter_email: userEmail,
          })
        )
      }

      // Increment new contestant
      await withRetry(() => supabase.rpc('increment_vote', { contestant_id: contestantId }))

      setVotes(prev => ({ ...prev, [categoryId]: contestantId }))
    } finally {
      inflightRef.current.delete(categoryId)
    }
  }

  // Save multiple votes in parallel with per-vote error tracking
  const saveAllVotes = async (selections) => {
    const entries = Object.entries(selections)
    const results = await Promise.allSettled(
      entries.map(([categoryId, contestantId]) => saveVote(categoryId, contestantId))
    )

    const failed = results
      .map((r, i) => (r.status === 'rejected' ? entries[i][0] : null))
      .filter(Boolean)

    if (failed.length > 0) {
      throw new Error(`Failed to save votes for ${failed.length} categor${failed.length > 1 ? 'ies' : 'y'}. Please try again.`)
    }
  }

  // Admin: delete a specific vote by vote_log id
  const deleteVote = async (voteLogId, contestantId) => {
    await withRetry(() => supabase.rpc('decrement_vote', { contestant_id: contestantId }))
    await withRetry(() => supabase.from('vote_log').delete().eq('id', voteLogId))
  }

  const hasVotedInCategory = (categoryId) => !!votes[categoryId]
  const votedForInCategory = (categoryId) => votes[categoryId] || null

  return { votes, voteLog, saveVote, saveAllVotes, deleteVote, hasVotedInCategory, votedForInCategory }
}
