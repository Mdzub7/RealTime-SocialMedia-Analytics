const API_BASE = 'http://localhost:8080/api'

export async function fetchTweets() {
  try {
    const response = await fetch(`${API_BASE}/tweets/live?limit=0`)
    if (!response.ok) throw new Error('Failed to fetch tweets')
    return await response.json()
  } catch (error) {
    console.error('Error fetching tweets:', error)
    return []
  }
}

export async function fetchAnalytics() {
  try {
    const response = await fetch(`${API_BASE}/analytics/summary`)
    if (!response.ok) throw new Error('Failed to fetch analytics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return {
      total_tweets: 0,
      sentiment_distribution: {},
      trending_words: [],
      hourly_data: []
    }
  }
}

export async function fetchLiveTrends() {
  try {
    const response = await fetch(`${API_BASE}/tweets/live?limit=0`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tweets = await response.json();
    console.log('Total tweets fetched:', tweets.length); // Debug log
    
    // Group tweets by hour and sentiment
    const groupedData = tweets.reduce((acc: any, tweet: any) => {
      const hour = new Date(tweet.created_at).toISOString();
      if (!acc[hour]) {
        acc[hour] = { Positive: 0, Negative: 0, Neutral: 0 };
      }
      acc[hour][tweet.sentiment]++;
      return acc;
    }, {});

    // Transform to array format for chart
    return Object.entries(groupedData).map(([hour, counts]) => ({
      hour,
      ...counts as { Positive: number, Negative: number, Neutral: number }
    }));
  } catch (error) {
    console.error('Error fetching live trends:', error);
    throw error;
  }
}

export async function fetchHistoricalData() {
  try {
    const response = await fetch(`${API_BASE}/analytics/detailed?limit=0`)
    if (!response.ok) throw new Error('Failed to fetch historical data')
    return await response.json()
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return {
      daily_sentiment: [],
      peak_hours: []
    }
  }
}

export async function fetchSentimentRatio() {
  try {
    const response = await fetch(`${API_BASE}/analytics/sentiment-ratio`)
    if (!response.ok) throw new Error('Failed to fetch sentiment ratio')
    return await response.json()
  } catch (error) {
    console.error('Error fetching sentiment ratio:', error)
    return {
      ratios: {
        Positive: 0,
        Negative: 0,
        Neutral: 0
      }
    }
  }
}