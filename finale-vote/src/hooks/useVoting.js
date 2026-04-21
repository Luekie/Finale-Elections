import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useVoting(userEmail) {
  const [votes, setVotes] = useState({}) // { categoryId: contestantId }
  const [voteLog, setVoteLog] = useState([])

  const storageKey = userEmail ? `finale_votes_2026_${userEmail}` : null

  const fetchVoteLog = useCallback(async () => {
    const { data } = await supabase
      .from('vote_log').select('*').order('created_at', { ascending: true })
    setVoteLog(data || [])
  }, [])

  useEffect(() => {
    // Load this user's votes from DB (so votes persist across devices)
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vote_log' }, fetchVoteLog)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userEmail, fetchVoteLog])

  const castVote = async (categoryId, contestantId) => {
    if (votes[categoryId]) return

    const { error } = await supabase.rpc('increment_vote', { contestant_id: contestantId })
    if (error) throw error

    await supabase.from('vote_log').insert({
      category_id: categoryId,
      contestant_id: contestantId,
      voter_email: userEmail,
    })

    const updated = { ...votes, [categoryId]: contestantId }
    setVotes(updated)
  }

  const hasVotedInCategory = (categoryId) => !!votes[categoryId]
  const votedForInCategory = (categoryId) => votes[categoryId] || null

  return { votes, voteLog, castVote, hasVotedInCategory, votedForInCategory }
}
