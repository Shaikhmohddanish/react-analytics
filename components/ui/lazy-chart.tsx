"use client"

import React, { Suspense, lazy, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// Define props types to be passed to the lazy-loaded component
interface LazyChartProps {
  data: any[]
  title: string
  height?: number
  width?: number
  renderChart: (props: { data: any[], height?: number, width?: number }) => React.ReactNode
}

export function LazyChart({
  data,
  title,
  height = 400,
  width,
  renderChart
}: LazyChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  // Set mounted state on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Setup intersection observer to detect when chart is in viewport
  useEffect(() => {
    if (!ref) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect() // Once visible, we don't need to observe anymore
          }
        })
      },
      {
        rootMargin: "200px", // Start loading when element is 200px from viewport
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    )
    
    observer.observe(ref)
    
    return () => {
      observer.disconnect()
    }
  }, [ref])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={setRef}
          className="relative w-full"
          style={{ height: height, minHeight: "200px" }}
        >
          {!isMounted || !isVisible ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Suspense 
              fallback={
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              {renderChart({ data, height, width })}
            </Suspense>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
