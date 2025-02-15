import { useState, useEffect } from 'react';
import { socket, connectSocket } from '../utils/socket';

export const useRealTimeData = () => {
  const [tweets, setTweets] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [wordcloud, setWordcloud] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("Initializing WebSocket connection...");
    
    // Connect socket and handle connection status
    connectSocket();
    
    socket.on('connect', () => {
      console.log("✅ WebSocket connected successfully");
      setIsConnected(true);
    });

    socket.on('connect_error', (error) => {
      console.error("❌ WebSocket connection error:", error);
      setIsConnected(false);
    });

    socket.on('disconnect', () => {
      console.log("❌ WebSocket disconnected");
      setIsConnected(false);
    });

    // Handle data events
    socket.on('new_tweet', (tweet) => {
      console.log("📨 Received new tweet:", tweet.text?.substring(0, 50));
      setTweets((prev) => [tweet, ...prev].slice(0, 50));
    });

    socket.on('analytics_update', (data) => {
      console.log("📊 Received analytics update:", {
        total_tweets: data.total_tweets,
        sentiment_counts: data.sentiment_counts
      });
      setAnalytics(data);
    });

    socket.on('wordcloud_update', (data) => {
      console.log("🔄 Received wordcloud update");
      setWordcloud(data);
    });

    socket.on('initial_data', (data) => {
      console.log("🚀 Received initial data");
      setAnalytics(data);
    });

    // Cleanup function
    return () => {
      console.log("Cleaning up WebSocket listeners...");
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('new_tweet');
      socket.off('analytics_update');
      socket.off('wordcloud_update');
      socket.off('initial_data');
    };
  }, []);

  return { tweets, analytics, wordcloud, isConnected };
};