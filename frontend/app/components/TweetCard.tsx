"use client"

import { motion } from "framer-motion"
import { Heart, MessageCircle, Share } from "lucide-react"

interface Tweet {
  id: string;
  text: string;
  sentiment: string;
  created_at: string;
}

export default function TweetCard({ tweet }: { tweet: Tweet }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/10 backdrop-blur-md rounded-lg p-6 shadow-lg"
    >
      <p className="text-lg mb-2 text-white">{tweet.text}</p>
      <div className="flex justify-between items-center">
        <span className={`text-sm ${getSentimentColor(tweet.sentiment)}`}>
          {tweet.sentiment}
        </span>
        <span className="text-sm text-gray-300">
          {new Date(tweet.created_at).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}

function getSentimentColor(sentiment: string) {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 'text-green-400';
    case 'negative':
      return 'text-red-400';
    default:
      return 'text-blue-400';
  }
}

