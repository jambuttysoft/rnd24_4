'use client'
import React from 'react'
import { Button } from "@/components/ui/button"
import useThreads from "../use-threads"

const LoadMoreButton = () => {
    const { hasNextPage, fetchNextPage, isFetchingNextPage } = useThreads()

    if (!hasNextPage) return null

    return (
        <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
        >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
        </Button>
    )
}

export default LoadMoreButton