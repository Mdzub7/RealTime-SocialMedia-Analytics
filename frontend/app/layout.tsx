import "./globals.css"
import { Inter } from "next/font/google"
import Navigation from "./components/Navigation"
import type React from "react" // Added import for React

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Twitter Trends",
  description: "A modern Twitter trends analysis application",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-text min-h-screen`}>
        <div className="flex flex-col min-h-screen">
          <Navigation />
          <main className="flex-grow">{children}</main>
        </div>
      </body>
    </html>
  )
}

