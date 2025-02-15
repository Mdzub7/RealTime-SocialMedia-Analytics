"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Masonry from "react-masonry-css"
import TweetCard from "../components/TweetCard"
import { useInView } from "react-intersection-observer"

const breakpointColumnsObj = {
  default: 3,
  1100: 2,
  700: 1,
}

export default function TweetsPage() {
  const [tweets, setTweets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [ref, inView] = useInView({
    threshold: 0,
  })

  useEffect(() => {
    const fetchHistoricalTweets = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/tweets/live')
        const data = await response.json()
        setTweets(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching historical tweets:', error)
        setLoading(false)
      }
    }

    fetchHistoricalTweets()
  }, [])

  useEffect(() => {
    if (inView) {
      loadMoreTweets()
    }
  }, [inView])

  const loadMoreTweets = () => {
    const newTweets = Array.from({ length: 10 }, (_, i) => ({
      id: tweets.length + i + 1,
      content: `This is tweet number ${tweets.length + i + 1}. #trending`,
      likes: Math.floor(Math.random() * 1000),
      retweets: Math.floor(Math.random() * 500),
    }))
    setTweets([...tweets, ...newTweets])
    setPage(page + 1)
  }

  if (loading) {
    return <div className="text-center py-4">Loading tweets...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold text-center mb-8 text-grey"
      >
        Tweet Feed
      </motion.h1>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </Masonry>
      <div ref={ref} className="h-10" />
    </div>
  )
}

