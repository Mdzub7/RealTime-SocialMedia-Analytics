"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart2, TrendingUp, LineChart, GitCompare } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()

  const links = [
    { name: "Home", href: "/", icon: Home },
    { name: "Tweets", href: "/tweets", icon: BarChart2 },
    { name: "Trends", href: "/trends", icon: TrendingUp },
    { name: "Analytics", href: "/analytics", icon: LineChart },
    { name: "Compare", href: "/compare", icon: GitCompare },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-primary/20 p-4 md:relative md:border-t-0">
      <div className="container mx-auto flex justify-around md:justify-center md:space-x-8">
        {links.map(({ name, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={name}
              href={href}
              className={`flex flex-col items-center space-y-1 group ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5 group-hover:text-primary transition-colors" />
              <span className="text-xs md:text-sm">{name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

