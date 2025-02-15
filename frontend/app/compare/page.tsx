"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import DataStateWrapper from "../components/DataStateWrapper"
import { fetchLiveTrends } from "../utils/api"

interface HistoricalData {
  timestamp: string;
  Positive: number;
  Negative: number;
  Neutral: number;
}

export default function ComparePage() {
  const [dailyData, setDailyData] = useState<HistoricalData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const liveData = await fetchLiveTrends()
        console.log('Fetched Live Data:', liveData)

        if (!Array.isArray(liveData) || liveData.length === 0) {
          throw new Error('No data available')
        }

        // Process live trends
        let positive = 0, negative = 0, neutral = 0
        const processedData = liveData
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .map((data: any) => {
            positive += data.Positive || 0
            negative += data.Negative || 0
            neutral += data.Neutral || 0

            return {
              timestamp: data.timestamp,
              Positive: positive,
              Negative: negative,
              Neutral: neutral
            }
          })

        console.log('Processed Data:', processedData)
        setDailyData(processedData)
        setError(null)
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err : new Error('Failed to load comparison data'))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold text-center mb-8 text-primary"
      >
        Sentiment Comparison
      </motion.h1>

      <DataStateWrapper isLoading={isLoading} error={error}>
        <div className="glassmorphism p-6">
          <h2 className="text-2xl font-semibold mb-4">Daily Sentiment Distribution</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#888"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date instanceof Date && !isNaN(date.getTime())
                    ? date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })
                    : '';
                }}
                label={{ 
                  value: 'Time', 
                  position: 'insideBottom', 
                  offset: -5,
                  fill: '#888' 
                }}
              />
              <YAxis 
                stroke="#888"
                label={{ 
                  value: 'Number of Tweets', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: '#888',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(0, 0, 0, 0.8)", 
                  border: "1px solid #444",
                  borderRadius: "4px",
                  padding: "8px"
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date instanceof Date && !isNaN(date.getTime())
                    ? date.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                    : '';
                }}
                formatter={(value: number, name: string) => [`${value} tweets`, name]}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{
                  paddingBottom: "20px"
                }}
              />
              <Bar 
                dataKey="Positive" 
                fill="#4CAF50"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="Negative" 
                fill="#f44336"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="Neutral" 
                fill="#2196F3"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataStateWrapper>
    </div>
  )
}

