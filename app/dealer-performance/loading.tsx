import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-12">
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading dealer performance dashboard...</p>
      </div>
    </div>
  )
}
