import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { TweetData } from '../types'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [tweets, setTweets] = useState<TweetData[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:8080', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      namespace: '/tweets'
    })

    // Fetch initial tweets
    fetch('http://localhost:8080/api/tweets/live')
      .then(res => res.json())
      .then(data => {
        setTweets(data)
      })
      .catch(err => console.error('Error fetching initial tweets:', err))

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    newSocket.on('new_tweet', (tweet: TweetData) => {
      console.log('New tweet received:', tweet)
      setTweets(prev => [tweet, ...prev])
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      newSocket.close()
    }
  }, [])

  return { tweets, socket, isConnected }
}