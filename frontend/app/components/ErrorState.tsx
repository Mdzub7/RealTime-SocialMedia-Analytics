import { AlertCircle } from "lucide-react"

interface ErrorStateProps {
  message?: string
}

export default function ErrorState({ message = "Something went wrong" }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-red-500">
      <AlertCircle className="w-8 h-8 mb-2" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  )
}