import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useContestants() {
  const [contestants, setContestants] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchContestants = useCallback(async () => {
    const { data, error } = await supabase
      .from('contestants')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (!error) setContestants(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchContestants()

    const ch = supabase
      .channel('contestants-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contestants' }, fetchContestants)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contestants' }, fetchContestants)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'contestants' }, fetchContestants)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vote_log' }, fetchContestants)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vote_log' }, fetchContestants)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'vote_log' }, fetchContestants)
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [fetchContestants])

  const addContestant = async (categoryId, name, imageFile) => {
    const { data, error } = await supabase
      .from('contestants')
      .insert({ category_id: categoryId, name, image_url: null, votes: 0 })
      .select()
      .single()
    if (error) throw error

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const fileName = `${data.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('contestant-photos')
        .upload(fileName, imageFile, { upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('contestant-photos')
          .getPublicUrl(fileName)
        await supabase
          .from('contestants')
          .update({ image_url: publicUrl })
          .eq('id', data.id)
      }
    }

    // Force a fresh fetch after add to ensure UI is in sync
    await fetchContestants()
    return data.id
  }

  const removeContestant = async (id, imageUrl) => {
    await supabase.from('contestants').delete().eq('id', id)
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop()
      await supabase.storage.from('contestant-photos').remove([fileName])
    }
    await fetchContestants()
  }

  const resetVotes = async () => {
    try {
      // Reset all contestant votes to 0
      const { error: updateError } = await supabase
        .from('contestants')
        .update({ votes: 0 })
        .gte('votes', 0) // Match all rows (votes >= 0)
      
      if (updateError) {
        console.error('Error resetting votes:', updateError)
        throw updateError
      }

      // Delete all vote logs
      const { error: deleteError } = await supabase
        .from('vote_log')
        .delete()
        .gte('created_at', '1970-01-01T00:00:00Z') // Match all rows
      
      if (deleteError) {
        console.error('Error deleting vote logs:', deleteError)
        throw deleteError
      }

      await fetchContestants()
    } catch (error) {
      console.error('Reset votes failed:', error)
      throw error
    }
  }

  const updateContestantPhoto = async (id, imageFile) => {
    const ext = imageFile.name.split('.').pop()
    const fileName = `${id}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('contestant-photos')
      .upload(fileName, imageFile, { upsert: true })
    if (upErr) throw upErr
    const { data: { publicUrl } } = supabase.storage
      .from('contestant-photos')
      .getPublicUrl(fileName)
    const { error } = await supabase
      .from('contestants')
      .update({ image_url: publicUrl })
      .eq('id', id)
    if (error) throw error
    await fetchContestants()
  }

  const updateContestantName = async (id, newName) => {
    const { error } = await supabase
      .from('contestants')
      .update({ name: newName.trim() })
      .eq('id', id)
    if (error) throw error
    await fetchContestants()
  }

  const reorderContestants = async (categoryId, reorderedContestants) => {
    // Update display_order for each contestant in the reordered list
    const updates = reorderedContestants.map((contestant, index) => 
      supabase
        .from('contestants')
        .update({ display_order: index })
        .eq('id', contestant.id)
    )
    
    await Promise.all(updates)
    await fetchContestants()
  }

  return { contestants, loading, addContestant, removeContestant, resetVotes, updateContestantPhoto, updateContestantName, reorderContestants }
}
