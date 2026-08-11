import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Password-recovery links sign the user in and fire a PASSWORD_RECOVERY event.
 * Depending on the configured redirect they can land on any route, so we listen
 * globally and send them to the set-a-new-password screen wherever they arrive.
 */
export default function RecoveryRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') navigate('/reset', { replace: true })
    })
    return () => data.subscription.unsubscribe()
  }, [navigate])
  return null
}
