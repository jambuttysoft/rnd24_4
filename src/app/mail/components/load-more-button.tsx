'use client'
import React from 'react'
import { Button } from "@/components/ui/button"
import useThreads from "../use-threads"

const LoadMoreButton = () => {
    const { hasNextPage, fetchNextPage, isFetchingNextPage } = useThreads()

    if (!hasNextPage) return null

    return (
        <Button 
            variant="destructive" 
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 shadow-md"
        >
            {isFetchingNextPage ? '⏳ Загружаю...' : '📧 Загрузить ещё'}
        </Button>
    )
}

export default LoadMoreButton