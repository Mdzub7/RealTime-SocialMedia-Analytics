from kafka import KafkaConsumer
import json

# Kafka Configuration
KAFKA_TOPIC = "processed_tweets"
KAFKA_BROKER = "localhost:9092"

# Initialize Kafka Consumer
consumer = KafkaConsumer(
    KAFKA_TOPIC,
    bootstrap_servers=KAFKA_BROKER,
    auto_offset_reset="earliest",
    value_deserializer=lambda v: json.loads(v.decode("utf-8"))
)

# Read messages
print("Consuming processed tweets from Kafka...")
for message in consumer:
    print(f"Processed Tweet: {message.value}")