from kafka import KafkaConsumer, KafkaProducer
from textblob import TextBlob
import json
import re
import time
import signal
import sys

# Kafka Configuration
INPUT_TOPIC = "social_media_data"
OUTPUT_TOPIC = "processed_tweets"
BROKER = "localhost:9092"

# Global flag for graceful shutdown
running = True

def signal_handler(signum, frame):
    global running
    print("Received shutdown signal, cleaning up...")
    running = False

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def process_tweets():
    try:
        consumer = KafkaConsumer(
            INPUT_TOPIC,
            bootstrap_servers=BROKER,
            auto_offset_reset='latest',
            enable_auto_commit=True,
            consumer_timeout_ms=1000,  # 1 second timeout
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        
        producer = KafkaProducer(
            bootstrap_servers=BROKER,
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
        print("✅ Connected to Kafka, starting processing...")
        
        while running:
            try:
                messages = consumer.poll(timeout_ms=1000)
                for topic_partition, msgs in messages.items():
                    for msg in msgs:
                        tweet_text = msg.value.get('text', '')
                        sentiment = analyze_sentiment(tweet_text)
                        
                        processed_tweet = {
                            'text': tweet_text,
                            'sentiment': sentiment
                        }
                        
                        producer.send(OUTPUT_TOPIC, processed_tweet)
                        print(f"Processed tweet: {tweet_text[:50]}...")
                        
            except Exception as e:
                print(f"Error processing message: {str(e)}")
                continue
                
    except Exception as e:
        print(f"Kafka error: {str(e)}")
    finally:
        try:
            consumer.close()
            producer.close()
        except:
            pass

if __name__ == "__main__":
    try:
        process_tweets()
    except KeyboardInterrupt:
        print("Shutting down...")
        running = False