import React from "react"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[500px]">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading product trends data...</p>
    </div>
  )
}
