'use client'
import React from 'react'
import { Button } from "@/components/ui/button"
import useThreads from "../use-threads"

const LoadMoreButton = () => {
    const { hasNextPage, fetchNextPage, isFetchingNextPage } = useThreads()

    // Диагностическое логирование
    React.useEffect(() => {
        console.log('🔍 DIAGNOSTIC: LoadMoreButton component mounted', {
            timestamp: new Date().toISOString(),
            component: 'LoadMoreButton',
            state: { hasNextPage, isFetchingNextPage }
        })
        
        return () => {
            console.log('🔍 DIAGNOSTIC: LoadMoreButton component unmounted', {
                timestamp: new Date().toISOString(),
                component: 'LoadMoreButton'
            })
        }
    }, [])

    React.useEffect(() => {
        console.log('🔍 DIAGNOSTIC: LoadMoreButton state changed', {
            timestamp: new Date().toISOString(),
            component: 'LoadMoreButton',
            state: { hasNextPage, isFetchingNextPage }
        })
    }, [hasNextPage, isFetchingNextPage])

    const handleClick = () => {
        console.log('🔍 DIAGNOSTIC: LoadMoreButton clicked', {
            timestamp: new Date().toISOString(),
            component: 'LoadMoreButton',
            state: { hasNextPage, isFetchingNextPage },
            action: 'fetchNextPage'
        })
        fetchNextPage()
    }

    if (!hasNextPage) {
        console.log('🔍 DIAGNOSTIC: LoadMoreButton not rendered (no next page)', {
            timestamp: new Date().toISOString(),
            component: 'LoadMoreButton',
            state: { hasNextPage, isFetchingNextPage }
        })
        return null
    }

    console.log('🔍 DIAGNOSTIC: LoadMoreButton rendering', {
        timestamp: new Date().toISOString(),
        component: 'LoadMoreButton',
        state: { hasNextPage, isFetchingNextPage }
    })

    return (
        <div className="w-full">
            <Button 
                variant="destructive" 
                size="lg"
                onClick={handleClick}
                disabled={isFetchingNextPage}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 text-base shadow-lg border-2 border-red-800 hover:border-red-900 transition-all duration-200"
            >
                {isFetchingNextPage ? '⏳ Загружаю письма...' : '📧 ЗАГРУЗИТЬ ЕЩЁ ПИСЬМА'}
            </Button>
        </div>
    )
}

export default LoadMoreButton