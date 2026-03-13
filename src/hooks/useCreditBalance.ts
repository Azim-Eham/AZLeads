import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useCreditBalance() {
  const { user } = useAuth()
  const [credits, setCredits] = useState<number>(0)

  useEffect(() => {
    if (!user) return

    // Fetch initial balance
    supabase.from('buyers')
      .select('credit_balance')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setCredits(data.credit_balance)
      })

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('credit-balance')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'buyers',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        setCredits(payload.new.credit_balance)
      })
      .subscribe()

    return () => {
        subscription.unsubscribe()
    }
  }, [user])

  return credits
}
