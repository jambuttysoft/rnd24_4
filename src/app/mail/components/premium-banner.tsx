'use client'
import { motion } from 'framer-motion'
import React from 'react'
import { api } from '@/trpc/react'
import { FREE_CREDITS_PER_DAY } from '@/app/constants'

const PremiumBanner = () => {
    const { data: chatbotInteraction } = api.mail.getChatbotInteraction.useQuery()
    const remainingCredits = chatbotInteraction?.remainingCredits || 0

    return (
        <motion.div layout className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border flex items-center justify-center">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Запросы:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {remainingCredits} / {FREE_CREDITS_PER_DAY}
                </span>
            </div>
        </motion.div>
    )
}

export default PremiumBanner