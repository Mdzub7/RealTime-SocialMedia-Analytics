"use client"

import { Search } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center p-2 rounded-lg border ${
        isFocused ? 'border-primary' : 'border-primary/20'
      } bg-primary/5 backdrop-blur-sm max-w-md mx-auto`}
    >
      <Search className="w-5 h-5 text-muted-foreground mr-2" />
      <input
        type="text"
        value={value}
        onChange={handleSearch}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search tweets..."
        className="bg-transparent border-none outline-none w-full text-text placeholder:text-muted-foreground"
      />
    </motion.div>
  )
}

