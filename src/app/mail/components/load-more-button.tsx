'use client'
import React from 'react'
import { Button } from "@/components/ui/button"
import useThreads from "../use-threads"

const LoadMoreButton = () => {
    const { hasNextPage, fetchNextPage, isFetchingNextPage } = useThreads()

    const handleClick = () => {
        fetchNextPage()
    }

    if (!hasNextPage) {
        return null
    }

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