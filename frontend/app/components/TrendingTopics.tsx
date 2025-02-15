"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { socket, connectSocket } from "../utils/socket"
import { fetchAnalytics } from "../utils/api"

interface TrendingTopic {
  word: string;
  count: number;
}

interface AnalyticsUpdate {
  trending_words: TrendingTopic[];
}

export default function TrendingTopics() {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])

  useEffect(() => {
    const loadTrendingTopics = async () => {
      const data = await fetchAnalytics()
      setTrendingTopics(data.trending_words || [])
    }

    connectSocket()
    socket.on('analytics_update', (data: AnalyticsUpdate) => {
      setTrendingTopics(data.trending_words || [])
    })

    loadTrendingTopics()

    return () => {
      socket.off('analytics_update')
    }
  }, [])

  return (
    <div className="grid grid-cols-2 gap-4">
      {trendingTopics.map(({ word, count }, index) => (
        <motion.div
          key={word}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-primary/10 p-4 rounded-lg flex justify-between items-center"
        >
          <span className="font-medium">#{word}</span>
          <span className="text-accent">{count}</span>
        </motion.div>
      ))}
    </div>
  )
}

