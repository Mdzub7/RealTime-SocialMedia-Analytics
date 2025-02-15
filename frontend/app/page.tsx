"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import SearchBar from "./components/SearchBar"
import StatCard from "./components/StatCard"
import TweetCard from "./components/TweetCard"
import TrendingTopics from "./components/TrendingTopics"
import { socket, connectSocket } from "./utils/socket"
import { fetchAnalytics, fetchTweets } from "./utils/api"
import LiveTweets from './components/LiveTweets';
import RealTimeAnalytics from './components/RealTimeAnalytics';

interface Tweet {
  id: string;
  text: string;
  sentiment: string;
  created_at: string;
}

interface Stats {
  title: string;
  value: string;
}

interface AnalyticsUpdate {
  total_tweets: number;
  sentiment_counts: {
    Positive?: number;
    Negative?: number;
    Neutral?: number;
  };
  trending: Array<{ tag: string; count: number }>;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState<Stats[]>([
    { title: "Total Tweets", value: "0" },
    { title: "Positive Sentiment", value: "0%" },
    { title: "Trending Topics", value: "0" },
  ])
  const [recentTweets, setRecentTweets] = useState<Tweet[]>([])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [analyticsData, tweetsData] = await Promise.all([
          fetchAnalytics(),
          fetchTweets()
        ])

        const totalTweets = analyticsData.total_tweets
        const positiveTweets = analyticsData.sentiment_distribution?.Positive || 0
        const positivePercentage = ((positiveTweets / totalTweets) * 100).toFixed(1)

        setStats([
          { title: "Total Tweets", value: totalTweets.toString() },
          { title: "Positive Sentiment", value: `${positivePercentage}%` },
          { title: "Trending Topics", value: analyticsData.trending_words.length.toString() }
        ])
        setRecentTweets(tweetsData.slice(0, 5))
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }

    connectSocket()
    
    socket.on('analytics_update', (data: AnalyticsUpdate) => {
      try {
        const totalTweets = data.total_tweets
        const positiveTweets = data.sentiment_counts?.Positive || 0
        const positivePercentage = ((positiveTweets / totalTweets) * 100).toFixed(1)

        setStats([
          { title: "Total Tweets", value: totalTweets.toString() },
          { title: "Positive Sentiment", value: `${positivePercentage}%` },
          { title: "Trending Topics", value: data.trending.length.toString() }
        ])
      } catch (error) {
        console.error('Error processing analytics update:', error)
      }
    })

    socket.on('new_tweet', (tweet: Tweet) => {
      setRecentTweets(prev => [tweet, ...prev].slice(0, 5))
    })

    loadInitialData()

    return () => {
      socket.off('analytics_update')
      socket.off('new_tweet')
      socket.disconnect()
    }
  }, [])

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Real-Time Social Media Analytics
        </h1>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glassmorphism p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Tweets</h2>
          <div className="space-y-4">
            {recentTweets.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        </div>
        <div className="glassmorphism p-6">
          <h2 className="text-2xl font-semibold mb-4">Trending Topics</h2>
          <TrendingTopics />
        </div>
      </div>
    </main>
  )
}

