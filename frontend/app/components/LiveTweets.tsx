import { useRealTimeData } from '../hooks/useRealTimeData';

export default function LiveTweets() {
  const { tweets } = useRealTimeData();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Live Tweets</h2>
      <div className="space-y-2">
        {tweets.map((tweet) => (
          <div 
            key={tweet.id} 
            className={`p-4 rounded-lg border ${
              tweet.sentiment === 'positive' ? 'border-green-500' :
              tweet.sentiment === 'negative' ? 'border-red-500' : 'border-yellow-500'
            }`}
          >
            <p>{tweet.text}</p>
            <div className="text-sm text-gray-500 mt-2">
              <span>{new Date(tweet.created_at).toLocaleString()}</span>
              <span className="ml-2">Sentiment: {tweet.sentiment}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}