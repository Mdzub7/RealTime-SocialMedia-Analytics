export async function fetchHistoricalData() {
  const response = await fetch('http://localhost:8080/api/analytics/detailed')
  return response.json()
}

export async function fetchSentimentRatio() {
  const response = await fetch('http://localhost:8080/api/trends/sentiment-ratio')
  return response.json()
}

export async function fetchHourlyTrends() {
  const response = await fetch('http://localhost:8080/api/trends/hourly')
  return response.json()
}

export async function fetchRealtimeTrends() {
  const response = await fetch('http://localhost:8080/api/trends/realtime')
  return response.json()
}