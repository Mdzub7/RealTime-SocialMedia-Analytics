from kafka import KafkaConsumer
import json
from datetime import datetime

# Kafka Configuration
KAFKA_TOPIC = "social_media_data"
KAFKA_BROKER = "localhost:9092"

# Initialize Kafka Consumer
consumer = KafkaConsumer(
    KAFKA_TOPIC,
    bootstrap_servers=KAFKA_BROKER,
    auto_offset_reset="earliest",
    value_deserializer=lambda v: json.loads(v.decode("utf-8"))
)

def format_tweet(tweet_data):
    return f"""
Tweet ID: {tweet_data['id']}
Text: {tweet_data['text']}
Timestamp: {tweet_data.get('timestamp', 'N/A')}
{'='*50}
"""

# Read messages
print("Consuming messages from Kafka...")
try:
    for message in consumer:
        print(format_tweet(message.value))
except KeyboardInterrupt:
    print("\nStopping consumer...")
finally:
    consumer.close()