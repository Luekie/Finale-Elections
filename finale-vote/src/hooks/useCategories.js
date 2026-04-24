import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
    setCategories(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCategories()

    const ch = supabase
      .channel('categories-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'categories' }, fetchCategories)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'categories' }, fetchCategories)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'categories' }, fetchCategories)
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [fetchCategories])

  const addCategory = async (name) => {
    const maxOrder = categories.length
      ? Math.max(...categories.map(c => c.display_order))
      : 0
    const { error } = await supabase
      .from('categories')
      .insert({ name: name.trim(), display_order: maxOrder + 1 })
    if (error) throw error
    await fetchCategories()
  }

  const removeCategory = async (id) => {
    await supabase.from('categories').delete().eq('id', id)
    await fetchCategories()
  }

  const reorderCategories = async (reordered) => {
    setCategories(reordered) // optimistic update
    const updates = reordered.map((cat, i) =>
      supabase.from('categories').update({ display_order: i + 1 }).eq('id', cat.id)
    )
    await Promise.all(updates)
  }

  return { categories, loading, addCategory, removeCategory, reorderCategories }
}
