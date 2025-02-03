from kafka import KafkaConsumer, KafkaProducer
from textblob import TextBlob
import json
import re
import time

# Kafka Configuration
INPUT_TOPIC = "social_media_data"
OUTPUT_TOPIC = "processed_tweets"
BROKER = "localhost:9092"

def clean_tweet(text):
    text = re.sub(r"http\S+", "", text)  # Remove URLs
    text = re.sub(r"[^a-zA-Z\s]", "", text)  # Remove special characters
    text = text.lower().strip()  # Convert to lowercase
    return text

def get_sentiment(text):
    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity
    if polarity > 0:
        return "Positive"
    elif polarity < 0:
        return "Negative"
    else:
        return "Neutral"

def process_tweets():
    # Initialize Kafka Consumer
    consumer = KafkaConsumer(
        INPUT_TOPIC,
        bootstrap_servers=BROKER,
        auto_offset_reset='earliest',
        value_deserializer=lambda v: json.loads(v.decode('utf-8'))
    )

    # Initialize Kafka Producer
    producer = KafkaProducer(
        bootstrap_servers=BROKER,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )

    print("Starting tweet processing...")
    try:
        for message in consumer:
            tweet = message.value
            
            # Process the tweet
            processed_tweet = {
                "id": tweet["id"],
                "text": clean_tweet(tweet["text"]),
                "sentiment": get_sentiment(clean_tweet(tweet["text"])),
                "created_at": tweet["created_at"]
            }
            
            # Send to output topic
            producer.send(OUTPUT_TOPIC, processed_tweet)
            print(f"Processed tweet: {processed_tweet['text'][:100]}... | Sentiment: {processed_tweet['sentiment']}")
            
    except KeyboardInterrupt:
        print("\nProcessing stopped by user")
    finally:
        consumer.close()
        producer.close()

if __name__ == "__main__":
    process_tweets()