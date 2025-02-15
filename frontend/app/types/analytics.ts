export const COLORS = {
  Positive: "#4CAF50",
  Negative: "#f44336",
  Neutral: "#2196F3"
} as const;

export interface SentimentRatio {
  ratios: Record<keyof typeof COLORS, number>;
}

export interface AnalyticsUpdate {
  sentiment_counts: Record<keyof typeof COLORS, number>;
}

export interface SentimentDataPoint {
  name: keyof typeof COLORS;
  value: number;
}

export interface HistoricalData {
  daily_sentiment: Array<{
    date: string;
    sentiment: keyof typeof COLORS;
    count: number;
  }>;
  peak_hours: Array<{
    hour: number;
    count: number;
  }>;
}