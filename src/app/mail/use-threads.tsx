import { api } from '@/trpc/react'
import { getQueryKey } from '@trpc/react-query'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { toast } from 'sonner'

const useThreads = () => {
    const { data: accounts, error: accountsError } = api.mail.getAccounts.useQuery()
    const [accountId] = useLocalStorage('accountId', '')
    const [tab] = useLocalStorage('normalhuman-tab', 'inbox')
    const [done] = useLocalStorage('normalhuman-done', false)
    const queryKey = getQueryKey(api.mail.getThreads, { accountId, tab, done }, 'query')
    const { data: threads, isFetching, refetch, error: threadsError } = api.mail.getThreads.useQuery({
        accountId,
        done,
        tab
    }, { enabled: !!accountId && accountId.trim() !== '' && !!tab, placeholderData: (e) => e, refetchInterval: 1000 * 5 })

    // Handle authentication errors
    React.useEffect(() => {
        if (accountsError?.message === 'Unauthorized' || threadsError?.message === 'Unauthorized') {
            toast.error('Please sign in to continue', {
                action: {
                    label: 'Sign In',
                    onClick: () => {
                        window.location.href = '/sign-in'
                    }
                }
            })
        }
    }, [accountsError, threadsError])

    return {
        threads,
        isFetching,
        account: accounts?.find((account) => account.id === accountId),
        refetch,
        accounts,
        queryKey,
        accountId
    }
}

export default useThreads