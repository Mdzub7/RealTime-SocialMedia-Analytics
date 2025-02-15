export interface TweetData {
  id: string;
  text: string;
  sentiment: string;
  created_at: string;
  username?: string; // Make username optional
  timestamps?: string; // Make timestamps optional
}

export interface TweetData {
  id: string
  text: string
  sentiment: 'positive' | 'negative' | 'neutral'
  created_at: string
}