"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/contexts/data-context"
import { useFilters } from "@/contexts/filter-context"
import { calculateDealerAnalytics, formatCurrency, formatPercentage } from "@/lib/analytics-utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff0000"]

export default function DealerAnalyticsChart() {
  const { loading } = useData()
  const { filteredData, hasActiveFilters } = useFilters()

  // Use centralized analytics calculation with filtered data
  const dealerAnalytics = React.useMemo(() => {
    if (!filteredData.length) return null
    return calculateDealerAnalytics(filteredData)
  }, [filteredData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!dealerAnalytics || dealerAnalytics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        No dealer data available
      </div>
    )
  }

  // Prepare chart data
  const topDealersData = dealerAnalytics.slice(0, 10).map((dealer, index) => ({
    ...dealer,
    displayName: `Dealer ${index + 1}`,
    fullName: dealer.dealerName,
  }))

  const tierDistributionData = Object.entries(
    dealerAnalytics.reduce((acc, dealer) => {
      acc[dealer.tier] = (acc[dealer.tier] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([tier, count]) => ({
    name: tier,
    value: count,
  }))

  return (
    <div className="space-y-6">
      {/* Filter Status Indicator */}
      {hasActiveFilters && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <div className="h-4 w-4 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium">
                Showing analytics for {filteredData.length} filtered records
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Dealers Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Dealers by Sales</CardTitle>
          <CardDescription>Leading dealers based on total sales performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topDealersData} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayName" 
                tick={{ fontSize: 12 }} 
                angle={0} 
                textAnchor="middle" 
                height={50}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} 
              />
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
        </CardContent>
      </Card>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Dealer Tier Distribution</CardTitle>
          <CardDescription>Distribution of dealers across performance tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tierDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tierDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, "Dealers"]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Growth Rate Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Rate Analysis</CardTitle>
          <CardDescription>Dealer performance growth rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dealerAnalytics.slice(0, 15)} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dealerName" 
                tick={{ fontSize: 10 }} 
                angle={-45} 
                textAnchor="end" 
                height={80}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => `${value}%`} 
              />
              <Tooltip
                formatter={(value: number) => [formatPercentage(value), "Growth Rate"]}
                labelStyle={{ fontSize: "12px" }}
              />
              <Bar 
                dataKey="growthRate" 
                fill="#82ca9d"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Loyalty Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Score Distribution</CardTitle>
          <CardDescription>Distribution of dealers by loyalty score levels</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealerAnalytics.slice(0, 20)} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dealerName" 
                tick={{ fontSize: 10 }} 
                angle={-45} 
                textAnchor="end" 
                height={80}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => `${value}`} 
              />
              <Tooltip
                formatter={(value: number) => [value, "Loyalty Score"]}
                labelStyle={{ fontSize: "12px" }}
              />
              <Bar 
                dataKey="loyaltyScore" 
                fill="#8884d8" 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
