'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TweetData } from '../types'
import { useEffect, useState } from 'react'

interface TweetListProps {
  tweets: TweetData[]
}

export default function TweetList({ tweets }: TweetListProps) {
  const [historicalTweets, setHistoricalTweets] = useState<TweetData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistoricalTweets = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/tweets/live')
        const data = await response.json()
        setHistoricalTweets(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching historical tweets:', error)
        setLoading(false)
      }
    }

    fetchHistoricalTweets()
  }, [])

  const allTweets = [...tweets, ...historicalTweets]

  if (loading) {
    return <div className="text-center py-4">Loading historical tweets...</div>
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {allTweets.map((tweet) => (
          <motion.div
            key={tweet.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-lg bg-white shadow"
          >
            <p className="text-gray-800">{tweet.text}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className={`text-sm ${
                tweet.sentiment === 'positive' ? 'text-green-500' :
                tweet.sentiment === 'negative' ? 'text-red-500' :
                'text-yellow-500'
              }`}>
                {tweet.sentiment}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(tweet.created_at).toLocaleString()}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}