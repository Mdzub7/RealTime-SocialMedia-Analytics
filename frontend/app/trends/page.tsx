"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceArea } from "recharts"
import DataStateWrapper from "../components/DataStateWrapper"
import { fetchLiveTrends } from "../utils/api"

interface HistoricalData {
  hour: string;
  Positive: number;
  Negative: number;
  Neutral: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-border">
        <p className="text-sm text-muted-foreground mb-2">
          {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium">{entry.name}:</span>
              <span className="text-sm">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

// Add new state variables in TrendsPage component
export default function TrendsPage() {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [left, setLeft] = useState<string | null>(null)
  const [right, setRight] = useState<string | null>(null)
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null)
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null)
  const [zoomedData, setZoomedData] = useState<HistoricalData[]>([])

  // Add zoom handling functions
  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null) {
      setRefAreaLeft(null)
      setRefAreaRight(null)
      return
    }

    const indexLeft = historicalData.findIndex(d => d.hour === refAreaLeft)
    const indexRight = historicalData.findIndex(d => d.hour === refAreaRight)

    const startIndex = Math.min(indexLeft, indexRight)
    const endIndex = Math.max(indexLeft, indexRight)

    setZoomedData(historicalData.slice(startIndex, endIndex + 1))
    setRefAreaLeft(null)
    setRefAreaRight(null)
  }

  const zoomOut = () => {
    setZoomedData([])
    setRefAreaLeft(null)
    setRefAreaRight(null)
  }

  // Update useEffect to initialize zoomedData
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const data = await fetchLiveTrends()
        if (data.length === 0) {
          setError(new Error('No data available'))
        } else {
          // Take only the last 50 data points for clearer visualization
          const recentData = data.slice(-50)
          setHistoricalData(recentData)
          setZoomedData(recentData)
          setError(null)
        }
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err : new Error('Failed to load live trend data'))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 bg-clip-text text-transparent"
      >
        Historical Trending Analysis
      </motion.h1>

      <DataStateWrapper isLoading={isLoading} error={error}>
        <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white/90 mb-2">Sentiment Timeline</h2>
              <p className="text-sm text-white/60">Showing last 50 data points</p>
            </div>
            {zoomedData.length !== historicalData.length && (
              <button
                onClick={zoomOut}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-all duration-200 flex items-center space-x-2"
              >
                <span>Reset View</span>
              </button>
            )}
          </div>

          <ResponsiveContainer width="100%" height={500}>
            <AreaChart
              data={zoomedData}
              onMouseDown={e => e && setRefAreaLeft(e.activeLabel)}
              onMouseMove={e => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
              onMouseUp={zoom}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="positive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="negative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f44336" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f44336" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="neutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2196F3" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.05)"
                horizontal={true}
                vertical={false}
              />
              
              <XAxis
                dataKey="hour"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
                tickLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { 
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true 
                })}
                style={{ fontSize: '0.75rem' }}
                minTickGap={40}
                padding={{ left: 20, right: 20 }}
              />
              
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
                tickLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                style={{ fontSize: '0.75rem' }}
                tickCount={5}
                domain={[0, 'auto']}
              />
              
              {refAreaLeft && refAreaRight && (
                <ReferenceArea
                  x1={refAreaLeft}
                  x2={refAreaRight}
                  strokeOpacity={0.3}
                  fill="#fff"
                  fillOpacity={0.1}
                />
              )}

              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                verticalAlign="top"
                height={50}
                formatter={(value) => (
                  <span className="text-sm text-white/80 capitalize">
                    {value.toLowerCase()}
                  </span>
                )}
                iconType="circle"
                iconSize={8}
              />
              
              <Area
                type="monotone"
                dataKey="Positive"
                stroke="#4CAF50"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#positive)"
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="Negative"
                stroke="#f44336"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#negative)"
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="Neutral"
                stroke="#2196F3"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#neutral)"
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DataStateWrapper>
    </div>
  )
}