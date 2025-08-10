"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DealerAnalytics } from "@/lib/analytics-utils"
import { formatCurrency, formatPercentage } from "@/lib/analytics-utils"
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

interface DealerPerformanceChartsProps {
  dealerAnalytics: DealerAnalytics[] | null
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff0000"]

export default function DealerPerformanceCharts({ dealerAnalytics }: DealerPerformanceChartsProps) {
  if (!dealerAnalytics || dealerAnalytics.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No dealer data available</p>
        </CardContent>
      </Card>
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

  const loyaltyDistributionData = [
    { name: "High (50+)", value: dealerAnalytics.filter(d => d.loyaltyScore >= 50).length },
    { name: "Medium (30-49)", value: dealerAnalytics.filter(d => d.loyaltyScore >= 30 && d.loyaltyScore < 50).length },
    { name: "Low (<30)", value: dealerAnalytics.filter(d => d.loyaltyScore < 30).length },
  ]

  const topDealer = dealerAnalytics[0]
  const radarData = topDealer ? [
    { subject: "Sales Volume", A: Math.min(100, (topDealer.marketShare / 10) * 100) },
    { subject: "Order Frequency", A: Math.min(100, (topDealer.orderFrequency / 5) * 100) },
    { subject: "Category Diversity", A: Math.min(100, (topDealer.categoryDiversity / 6) * 100) },
    { subject: "Loyalty Score", A: topDealer.loyaltyScore },
    { subject: "Growth Rate", A: Math.min(100, Math.max(0, topDealer.growthRate + 50)) },
    { subject: "Avg Order Value", A: Math.min(100, (topDealer.avgOrderValue / 50000) * 100) },
  ] : []

  return (
    <div className="space-y-6">
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
      <div className="grid gap-6 md:grid-cols-2">
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

        <Card>
          <CardHeader>
            <CardTitle>Loyalty Score Distribution</CardTitle>
            <CardDescription>Distribution of dealers by loyalty score levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={loyaltyDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {loyaltyDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Dealers"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
                fill={(entry: any) => entry.growthRate >= 0 ? "#82ca9d" : "#ff6b6b"} 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Dealer Performance Radar */}
      {topDealer && (
        <Card>
          <CardHeader>
            <CardTitle>Top Dealer Performance Profile</CardTitle>
            <CardDescription>Comprehensive performance analysis of the top dealer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Market Share:</span>
                      <span className="font-medium">{formatPercentage(topDealer.marketShare, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loyalty Score:</span>
                      <span className="font-medium">{topDealer.loyaltyScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Frequency:</span>
                      <span className="font-medium">{topDealer.orderFrequency.toFixed(1)}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category Diversity:</span>
                      <span className="font-medium">{topDealer.categoryDiversity} categories</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Order Value:</span>
                      <span className="font-medium break-word">
                        {formatCurrency(topDealer.avgOrderValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Growth Rate:</span>
                      <span className={`font-medium ${topDealer.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatPercentage(topDealer.growthRate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend for Top Dealer */}
      {topDealer && topDealer.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales Trend - {topDealer.dealerName}</CardTitle>
            <CardDescription>Monthly sales performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={topDealer.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} 
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Sales"]}
                  labelStyle={{ fontSize: "12px" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
