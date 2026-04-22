import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useVoting(userEmail) {
  const [votes, setVotes] = useState({}) // { categoryId: contestantId } — last saved to DB
  const [voteLog, setVoteLog] = useState([])

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
  const saveVote = async (categoryId, contestantId) => {
    const previousId = votes[categoryId]

    if (previousId === contestantId) return // no change

    if (previousId) {
      // Decrement old contestant's vote count
      await supabase.rpc('decrement_vote', { contestant_id: previousId })
      // Update existing vote_log row
      await supabase
        .from('vote_log')
        .update({ contestant_id: contestantId, created_at: new Date().toISOString() })
        .eq('voter_email', userEmail)
        .eq('category_id', categoryId)
    } else {
      // First time voting in this category
      await supabase.from('vote_log').insert({
        category_id: categoryId,
        contestant_id: contestantId,
        voter_email: userEmail,
      })
    }

    // Increment new contestant
    const { error } = await supabase.rpc('increment_vote', { contestant_id: contestantId })
    if (error) throw error

    setVotes(prev => ({ ...prev, [categoryId]: contestantId }))
  }

  // Save multiple votes at once
  const saveAllVotes = async (selections) => {
    for (const [categoryId, contestantId] of Object.entries(selections)) {
      await saveVote(categoryId, contestantId)
    }
  }

  const hasVotedInCategory = (categoryId) => !!votes[categoryId]
  const votedForInCategory = (categoryId) => votes[categoryId] || null

  return { votes, voteLog, saveVote, saveAllVotes, hasVotedInCategory, votedForInCategory }
}
