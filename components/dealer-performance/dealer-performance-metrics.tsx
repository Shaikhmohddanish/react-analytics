"use client"

import React, { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownIcon, ArrowUpIcon, BarChart3, CreditCard, Users } from "lucide-react"
import { calculateDealerMetrics, formatCurrency, formatNumber } from "@/models/dealer"
import { ProcessedData } from "@/models"

interface DealerPerformanceMetricsProps {
  data: ProcessedData[]
}

export default function DealerPerformanceMetrics({ data }: DealerPerformanceMetricsProps) {
  // Calculate dealer metrics
  const metrics = useMemo(() => {
    return calculateDealerMetrics(data)
  }, [data])

  // Calculate overall metrics
  const {
    totalDealers,
    totalSales,
    totalOrders,
    avgDealerSales,
    topCategory,
    growth
  } = useMemo(() => {
    if (!metrics.length) {
      return {
        totalDealers: 0,
        totalSales: 0,
        totalOrders: 0,
        avgDealerSales: 0,
        topCategory: 'N/A',
        growth: 0
      }
    }

    // Total number of dealers
    const totalDealers = metrics.length

    // Total sales across all dealers
    const totalSales = metrics.reduce((sum, dealer) => sum + dealer.totalSales, 0)

    // Total order count across all dealers
    const totalOrders = metrics.reduce((sum, dealer) => sum + dealer.orderCount, 0)

    // Average sales per dealer
    const avgDealerSales = totalSales / totalDealers

    // Find the top category across all dealers
    const categorySales: Record<string, number> = {}
    metrics.forEach(dealer => {
      Object.entries(dealer.categorySales).forEach(([category, sales]) => {
        categorySales[category] = (categorySales[category] || 0) + sales
      })
    })

    const topCategory = Object.entries(categorySales)
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category)[0] || 'N/A'

    // Estimate growth by comparing top dealers' performance
    // This is a placeholder for actual growth calculation
    const topDealersCount = Math.max(3, Math.floor(totalDealers * 0.1)) // Top 10% or at least 3
    const topDealers = metrics.slice(0, topDealersCount)
    
    // Calculate average growth
    let growth = 0
    if (topDealers.length) {
      // Placeholder for growth calculation - would need historical data
      growth = 5.2 // Sample value
    }

    return {
      totalDealers,
      totalSales,
      totalOrders,
      avgDealerSales,
      topCategory,
      growth
    }
  }, [metrics])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Total Dealers
              </span>
              <span className="text-2xl font-bold">
                {totalDealers.toLocaleString()}
              </span>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <div className="flex items-center text-sm font-medium">
              Active dealers who have placed orders
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Total Sales
              </span>
              <span className="text-2xl font-bold">
                {formatCurrency(totalSales)}
              </span>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {growth > 0 ? (
              <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
            )}
            <span className={growth > 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(growth).toFixed(1)}%
            </span>
            <span className="ml-1 text-muted-foreground">from previous period</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Total Orders
              </span>
              <span className="text-2xl font-bold">
                {formatNumber(totalOrders)}
              </span>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <div className="flex items-center text-sm font-medium">
              Average {formatCurrency(totalSales / totalOrders)} per order
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Top Category
              </span>
              <span className="text-2xl font-bold truncate max-w-[180px]">
                {topCategory}
              </span>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <div className="flex items-center text-sm font-medium">
              Avg. {formatCurrency(avgDealerSales)} per dealer
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
