import { useState, useEffect } from 'react'
import { useLocalStorage } from 'usehooks-ts'

/**
 * Custom hook that ensures accountId is only available after component mount
 * and prevents React Query from executing during SSR/hydration with empty values
 */
export const useMountedAccount = () => {
  const [accountId] = useLocalStorage('accountId', '')
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Only return accountId if component is mounted and accountId is valid
  const isReady = isMounted && !!accountId && accountId.trim() !== ''
  
  return {
    accountId: isReady ? accountId : null,
    isReady,
    isMounted
  }
}