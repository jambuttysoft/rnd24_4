'use client'
import React from 'react'
import useThreads from "../use-threads"

const NavigationDiagnosticButton = () => {
    const { hasNextPage, fetchNextPage, isFetchingNextPage } = useThreads()
    const [clickCount, setClickCount] = React.useState(0)

    // Диагностическое логирование
    React.useEffect(() => {
        console.log('🔍 DIAGNOSTIC: NavigationDiagnosticButton component mounted', {
            timestamp: new Date().toISOString(),
            component: 'NavigationDiagnosticButton',
            state: { hasNextPage, isFetchingNextPage, clickCount }
        })
        
        return () => {
            console.log('🔍 DIAGNOSTIC: NavigationDiagnosticButton component unmounted', {
                timestamp: new Date().toISOString(),
                component: 'NavigationDiagnosticButton'
            })
        }
    }, [])

    React.useEffect(() => {
        console.log('🔍 DIAGNOSTIC: NavigationDiagnosticButton state changed', {
            timestamp: new Date().toISOString(),
            component: 'NavigationDiagnosticButton',
            state: { hasNextPage, isFetchingNextPage, clickCount }
        })
    }, [hasNextPage, isFetchingNextPage, clickCount])

    const handleClick = () => {
        const newClickCount = clickCount + 1
        setClickCount(newClickCount)
        
        console.log('🔍 DIAGNOSTIC: NavigationDiagnosticButton clicked', {
            timestamp: new Date().toISOString(),
            component: 'NavigationDiagnosticButton',
            location: 'Навигационная панель',
            clickCount: newClickCount,
            state: { hasNextPage, isFetchingNextPage },
            action: 'fetchNextPage'
        })
        
        // Выполняем запрос только если есть следующие страницы и не идет загрузка
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
        
        alert(`Диагностическая кнопка: Навигационная панель (клик #${newClickCount})`)
    }

    return (
        <div className="px-2 py-1">
            <button 
                onClick={handleClick}
                disabled={isFetchingNextPage}
                className={`w-full font-bold py-2 px-4 rounded text-sm transition-all duration-200 ${
                    isFetchingNextPage 
                        ? 'bg-purple-300 text-purple-700 cursor-not-allowed' 
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
            >
                {isFetchingNextPage ? '⏳ НАВ' : '🟣 НАВ'}
            </button>
        </div>
    )
}

export default NavigationDiagnosticButton