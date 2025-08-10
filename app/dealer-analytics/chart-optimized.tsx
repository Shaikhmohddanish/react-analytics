"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts"
import { LazyChartWrapper } from "@/components/ui/lazy-chart-wrapper"

/**
 * Chart Optimized Version of Dealer Analytics
 * 
 * This component demonstrates how to implement LazyChartWrapper for performance optimization
 * while maintaining the original functionality.
 */
export default function DealerAnalyticsOptimized() {
  // Sample data for demonstration
  const [dealerAnalytics, setDealerAnalytics] = useState({
    dealerMetrics: Array.from({ length: 30 }, (_, i) => ({
      name: `Dealer ${i + 1}`,
      totalSales: Math.floor(Math.random() * 1000000) + 100000,
      growthRate: Math.floor(Math.random() * 40) - 10,
    }))
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dealer Analytics - Chart Optimized</h1>
      <p className="text-muted-foreground">
        This page demonstrates how charts are optimized using LazyChartWrapper
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-lg">Sales Performance</CardTitle>
            <CardDescription>Dealer sales comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 
             * PERFORMANCE OPTIMIZATION:
             * Using LazyChartWrapper to only render this chart when it becomes visible in the viewport.
             * 
             * Benefits:
             * 1. Lazy Loading: Chart only renders when visible in viewport
             * 2. Re-render Optimization: Uses memoization to prevent unnecessary re-renders
             * 3. Memory Usage: Reduces memory consumption by deferring rendering
             * 4. Initial Load: Improves page load time by deferring expensive chart rendering
             */}
                         <LazyChartWrapper
               id="dealer-sales-chart"
               className="dealer-sales-chart" 
               data={dealerAnalytics.dealerMetrics.slice(0, 15).map((dealer, index) => ({
                 ...dealer,
                 displayName: `Dealer ${index + 1}`,
                 fullName: dealer.name
               }))}
               title="Sales Performance"
               height={400}
               renderChart={({ data, height }) => (
                 <ResponsiveContainer width="100%" height={height}>
                   <BarChart data={data} margin={{ bottom: 60 }}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis 
                       dataKey="displayName" 
                       tick={{ fontSize: 12 }} 
                       angle={0} 
                       textAnchor="middle" 
                       height={50}
                       interval={0}
                     />
                     <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                     <Tooltip
                       formatter={(value: number, name: string, props: any) => [
                         formatCurrency(value), 
                         "Sales"
                       ]}
                       labelFormatter={(label, payload) => {
                         if (payload && payload[0] && payload[0].payload.fullName) {
                           return payload[0].payload.fullName;
                         }
                         return label;
                       }}
                       labelStyle={{ fontSize: "12px" }}
                     />
                     <Bar dataKey="totalSales" fill="hsl(var(--chart-1))" />
                   </BarChart>
                 </ResponsiveContainer>
               )}
             />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-lg">Growth vs Sales</CardTitle>
            <CardDescription>Performance correlation analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 
             * PERFORMANCE OPTIMIZATION:
             * Using LazyChartWrapper for this scatter chart which is particularly 
             * expensive to render due to complex data points.
             * 
             * This implementation:
             * 1. Uses the enhanced LazyChartWrapper with memoization
             * 2. Prevents re-renders when data references change but content remains the same
             * 3. Only renders when visible in the viewport
             * 4. Shows a loading indicator while preparing to render
             */}
            <LazyChartWrapper
              id="dealer-growth-chart"
              className="dealer-growth-chart"
              data={dealerAnalytics.dealerMetrics}
              title="Growth Analysis"
              height={400}
              renderChart={({ data, height }) => (
                <ResponsiveContainer width="100%" height={height}>
                  <ScatterChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="totalSales"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                    />
                    <YAxis
                      dataKey="growthRate"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === "totalSales" ? formatCurrency(value) : `${value.toFixed(1)}%`,
                        name === "totalSales" ? "Sales" : "Growth Rate",
                      ]}
                      labelStyle={{ fontSize: "12px" }}
                    />
                    <Scatter dataKey="totalSales" fill="hsl(var(--chart-2))" />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">LazyChartWrapper Benefits</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Initial Load Optimization:</strong> Charts only render when they enter the viewport</li>
          <li><strong>Re-render Optimization:</strong> Prevents unnecessary re-renders when data references change but content is the same</li>
          <li><strong>Layout Stability:</strong> Maintains consistent layout by preserving chart height before rendering</li>
          <li><strong>User Feedback:</strong> Shows loading indicators while charts are being prepared</li>
          <li><strong>Memory Efficiency:</strong> Reduces memory usage by only rendering visible charts</li>
        </ul>
      </div>
    </div>
  );
}
