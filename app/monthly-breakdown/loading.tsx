"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MonthlyBreakdownLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-9 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-[150px]" />
              <div className="flex space-x-1">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-[100px]" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
