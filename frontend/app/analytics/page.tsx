"use client"

// External dependencies
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line 
} from "recharts"
import { fetchLiveTrends } from "../utils/api"
import DataStateWrapper from "../components/DataStateWrapper"

// Add Historical Data interface
interface HistoricalData {
  timestamp: string;
  Positive: number;
  Negative: number;
  Neutral: number;
}

interface SentimentDataPoint {
  name: string;
  value: number;
  count: number;
}

const COLORS = {
  positive: '#4CAF50',
  negative: '#f44336',
  neutral: '#2196F3'
}

export default function AnalyticsPage() {
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([])
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch live trends data
        const liveData = await fetchLiveTrends()
        console.log('Fetched Live Data:', liveData) // Debugging line

        // Process live trends
        let positive = 0, negative = 0, neutral = 0
        const liveTrends = liveData
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .map((data: any) => {
            positive += data.Positive
            negative += data.Negative
            neutral += data.Neutral

            return {
              timestamp: data.timestamp,
              Positive: positive,
              Negative: negative,
              Neutral: neutral
            }
          })

        // Process current sentiment distribution
        const sentimentCounts = liveData.reduce((acc: Record<string, number>, data: any) => {
          acc['positive'] = (acc['positive'] || 0) + data.Positive
          acc['negative'] = (acc['negative'] || 0) + data.Negative
          acc['neutral'] = (acc['neutral'] || 0) + data.Neutral
          return acc
        }, { positive: 0, negative: 0, neutral: 0 })

        console.log('Sentiment Counts:', sentimentCounts) // Debugging line

        const total = Object.values(sentimentCounts).reduce((a, b) => a + b, 0)
        
        const formattedData = Object.entries(sentimentCounts)
          .map(([name, count]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: (count / total) * 100,
            count
          }))
          .filter(item => item.count > 0)
          .sort((a, b) => b.count - a.count)

        setSentimentData(formattedData)
        setHistoricalData(liveTrends)
        setError(null)
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err : new Error('Failed to load data'))
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
        Real-time Sentiment Analysis
      </motion.h1>

      <DataStateWrapper isLoading={isLoading} error={error}>
        <div className="grid grid-cols-1 gap-8">
          {/* Pie Chart */}
          <div className="glassmorphism p-6 lg:col-span-1">
            <h2 className="text-2xl font-semibold mb-4">Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={60}
                  fill="#8884d8"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip content={({ payload }) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-black/80 p-3 rounded-lg border border-gray-700">
                        <p className="text-white font-medium">{data.name}</p>
                        <p className="text-white">{`${data.value.toFixed(1)}%`}</p>
                        <p className="text-gray-300">{`${data.count} tweets`}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="glassmorphism p-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-black/80 p-3 rounded-lg border border-gray-700">
                          <p className="text-white font-medium">{data.name}</p>
                          <p className="text-white">{`${data.count} tweets (${data.value.toFixed(1)}%)`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#8884d8"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics Cards */}
          <div className="glassmorphism p-6 lg:col-span-3">
            <h2 className="text-2xl font-semibold mb-4">Detailed Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sentimentData.map((item) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-black/20 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[item.name.toLowerCase() as keyof typeof COLORS] }}
                    />
                    <h3 className="font-medium">{item.name}</h3>
                  </div>
                  <p className="text-2xl font-bold mb-1">{item.count}</p>
                  <p className="text-sm text-gray-400">tweets</p>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: COLORS[item.name.toLowerCase() as keyof typeof COLORS]
                      }}
                    />
                  </div>
                  <p className="text-sm mt-1 text-right">{item.value.toFixed(1)}%</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Add Historical Trend Chart */}
          <div className="glassmorphism p-6">
            <h2 className="text-2xl font-semibold mb-4">Historical Trends</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#888"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()} 
                  label={{ value: 'Time', position: 'insideBottomRight', offset: -5, fill: '#888' }}
                />
                <YAxis 
                  stroke="#888" 
                  label={{ value: 'Cumulative Count', angle: -90, position: 'insideLeft', fill: '#888' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#222", border: "1px solid #444" }}
                  labelFormatter={(value) => `Time: ${new Date(value).toLocaleString()}`}
                  formatter={(value: number, name: string) => [`${value} tweets`, name]}
                />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="Positive" stroke={COLORS.positive} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Negative" stroke={COLORS.negative} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Neutral" stroke={COLORS.neutral} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DataStateWrapper>
    </div>
  )
}

