"use client"

import { motion } from "framer-motion"

interface StatCardProps {
  title: string
  value: string
}

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glassmorphism p-6 rounded-lg"
    >
      <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </motion.div>
  )
}

