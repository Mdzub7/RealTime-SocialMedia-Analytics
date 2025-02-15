import { useRealTimeData } from '../hooks/useRealTimeData';

interface SentimentCounts {
  [key: string]: number;
}

interface TrendingItem {
  tag: string;
  count: number;
}

interface WordCloud {
  live_image: string;
  historical_image: string;
}

interface Analytics {
  sentiment_counts: SentimentCounts;
  trending: TrendingItem[];
}

export default function RealTimeAnalytics() {
  const { analytics, wordcloud } = useRealTimeData();

  if (!analytics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Sentiment Distribution</h3>
        <div className="space-y-2">
          {Object.entries(analytics.sentiment_counts as SentimentCounts).map(([sentiment, count]) => (
            <div key={sentiment} className="flex justify-between">
              <span className="capitalize">{sentiment}</span>
              <span>{count.toString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Trending Topics</h3>
        <div className="space-y-2">
          {(analytics.trending as TrendingItem[])?.map(({ tag, count }) => (
            <div key={tag} className="flex justify-between">
              <span>{tag}</span>
              <span>{count.toString()}</span>
            </div>
          ))}
        </div>
      </div>

      {wordcloud && (
        <div className="col-span-2 p-4 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Word Cloud</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4>Live</h4>
              <img src={`data:image/png;base64,${wordcloud.live_image}`} alt="Live Word Cloud" />
            </div>
            <div>
              <h4>Historical</h4>
              <img src={`data:image/png;base64,${wordcloud.historical_image}`} alt="Historical Word Cloud" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}