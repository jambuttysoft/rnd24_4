'use client'
import React from 'react'
import { Button } from "@/components/ui/button"

const DiagnosticButtons = () => {
    const handleClick = (location: string) => {
        console.log(`🔍 DIAGNOSTIC: Button clicked at ${location}`, {
            timestamp: new Date().toISOString(),
            location,
            userAgent: navigator.userAgent,
            url: window.location.href
        })
        alert(`Диагностическая кнопка: ${location}`)
    }

    React.useEffect(() => {
        console.log('🔍 DIAGNOSTIC: DiagnosticButtons component mounted', {
            timestamp: new Date().toISOString(),
            component: 'DiagnosticButtons'
        })
        
        return () => {
            console.log('🔍 DIAGNOSTIC: DiagnosticButtons component unmounted', {
                timestamp: new Date().toISOString(),
                component: 'DiagnosticButtons'
            })
        }
    }, [])

    return (
        <>
            {/* Верхний правый угол */}
            <div className="fixed top-4 right-4 z-50">
                <Button 
                    onClick={() => handleClick('Верхний правый угол')}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold"
                    size="sm"
                >
                    🔴 ВП
                </Button>
            </div>

            {/* Центр экрана */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                <Button 
                    onClick={() => handleClick('Центр экрана')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
                    size="lg"
                >
                    🔵 ЦЕНТР
                </Button>
            </div>

            {/* Нижний левый угол */}
            <div className="fixed bottom-4 left-4 z-50">
                <Button 
                    onClick={() => handleClick('Нижний левый угол')}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold"
                    size="sm"
                >
                    🟢 НЛ
                </Button>
            </div>

            {/* Под основным контентом */}
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
                <Button 
                    onClick={() => handleClick('Под основным контентом')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    size="default"
                >
                    🟡 ПОК
                </Button>
            </div>

            {/* В навигационной панели (будет добавлена отдельно) */}
        </>
    )
}

export default DiagnosticButtons