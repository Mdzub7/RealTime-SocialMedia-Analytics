import tweepy
import json
from kafka import KafkaProducer
from dotenv import load_dotenv
import os
import time

# Load environment variables
load_dotenv()

# Twitter API Credentials
credentials = {
    "api_key": os.getenv("TWITTER_API_KEY"),
    "api_secret": os.getenv("TWITTER_API_SECRET"),
    "access_token": os.getenv("TWITTER_ACCESS_TOKEN"),
    "access_secret": os.getenv("TWITTER_ACCESS_SECRET"),
    "bearer_token": os.getenv("TWITTER_BEARER_TOKEN")
}

# Verify credentials
missing_credentials = [key for key, value in credentials.items() if not value]
if missing_credentials:
    print("Error: Missing Twitter API credentials:")
    for cred in missing_credentials:
        print(f"- {cred}")
    exit(1)

print("Twitter credentials loaded successfully!")

# Initialize Twitter client with OAuth 1.0a
try:
    auth = tweepy.OAuthHandler(
        credentials["api_key"],
        credentials["api_secret"]
    )
    auth.set_access_token(
        credentials["access_token"],
        credentials["access_secret"]
    )
    client = tweepy.Client(
        bearer_token=credentials["bearer_token"],
        consumer_key=credentials["api_key"],
        consumer_secret=credentials["api_secret"],
        access_token=credentials["access_token"],
        access_token_secret=credentials["access_secret"]
    )
    # Test authentication
    client.get_me()
    print("Authentication successful!")
except Exception as e:
    print(f"Authentication error: {e}")
    exit(1)

# Kafka Configuration
KAFKA_TOPIC = "social_media_data"
KAFKA_BROKER = "localhost:9092"
MAX_TWEETS = 10  # Changed back to 10 tweets

def fetch_and_send_tweets(producer):
    tweet_count = 0
    max_retries = 3
    retry_count = 0
    base_delay = 120

    while retry_count < max_retries and tweet_count < MAX_TWEETS:
        try:
            query = "(AI OR ML OR DataScience OR MachineLearning) lang:en -is:retweet"
            tweets = client.search_recent_tweets(
                query=query,
                max_results=10,  # Matches our MAX_TWEETS
                tweet_fields=["created_at", "text"]
            )
            
            if tweets.data:
                for tweet in tweets.data:
                    if tweet_count >= MAX_TWEETS:
                        break
                        
                    message = {
                        "id": str(tweet.id),
                        "text": tweet.text,
                        "created_at": str(tweet.created_at)
                    }
                    print(f"Tweet {tweet_count + 1}/{MAX_TWEETS}: {message['text'][:100]}...")
                    producer.send(KAFKA_TOPIC, message)
                    tweet_count += 1
                    time.sleep(3)
            
            print(f"\nProcessed {tweet_count} tweets successfully")
            break
            
        except tweepy.errors.TooManyRequests:
            retry_count += 1
            wait_time = base_delay * (2 ** retry_count)
            print(f"\nRate limit reached. Waiting {wait_time} seconds before retry {retry_count}/{max_retries}...")
            time.sleep(wait_time)
            
        except Exception as e:
            print(f"Error fetching tweets: {e}")
            break

if __name__ == "__main__":
    producer = None
    print(f"Starting Twitter data collection (Limited to {MAX_TWEETS} tweets)")
    try:
        # Initialize Kafka Producer
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BROKER,
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
        fetch_and_send_tweets(producer)
    except KeyboardInterrupt:
        print("\nProcess stopped by user")
    except Exception as e:
        print(f"Fatal error: {e}")
    finally:
        if producer:
            producer.close()