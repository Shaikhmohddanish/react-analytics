"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DealerAnalytics } from "@/lib/analytics-utils"
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/analytics-utils"
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Award } from "lucide-react"

interface DealerPerformanceMetricsProps {
  dealerAnalytics: DealerAnalytics[] | null
}

export default function DealerPerformanceMetrics({ dealerAnalytics }: DealerPerformanceMetricsProps) {
  if (!dealerAnalytics || dealerAnalytics.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No dealer data available</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate metrics
  const totalDealers = dealerAnalytics.length
  const totalSales = dealerAnalytics.reduce((sum, dealer) => sum + dealer.totalSales, 0)
  const totalOrders = dealerAnalytics.reduce((sum, dealer) => sum + dealer.totalOrders, 0)
  const avgLoyaltyScore = Math.round(dealerAnalytics.reduce((sum, dealer) => sum + dealer.loyaltyScore, 0) / totalDealers)
  const avgGrowthRate = dealerAnalytics.reduce((sum, dealer) => sum + dealer.growthRate, 0) / totalDealers

  // Tier distribution
  const tierDistribution = dealerAnalytics.reduce((acc, dealer) => {
    acc[dealer.tier] = (acc[dealer.tier] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Top performers
  const topBySales = dealerAnalytics[0]
  const topByGrowth = [...dealerAnalytics].sort((a, b) => b.growthRate - a.growthRate)[0]
  const topByLoyalty = [...dealerAnalytics].sort((a, b) => b.loyaltyScore - a.loyaltyScore)[0]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dealers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalDealers)}</div>
            <p className="text-xs text-muted-foreground">
              Active dealers in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              Combined sales volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Loyalty Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLoyaltyScore}</div>
            <p className="text-xs text-muted-foreground">
              Average loyalty across dealers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Growth Rate</CardTitle>
            {avgGrowthRate >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgGrowthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPercentage(avgGrowthRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average growth across dealers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Dealer Tier Distribution</CardTitle>
          <CardDescription>Distribution of dealers across performance tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(tierDistribution).map(([tier, count]) => (
              <div key={tier} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4" />
                    <span className="font-medium">{tier}</span>
                    <Badge variant="secondary">{count} dealers</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatPercentage((count / totalDealers) * 100, 1)}
                  </span>
                </div>
                <Progress value={(count / totalDealers) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top by Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{topBySales?.dealerName || "N/A"}</div>
              <div className="text-2xl font-bold">{formatCurrency(topBySales?.totalSales || 0)}</div>
              <div className="text-sm text-muted-foreground">
                {formatPercentage(topBySales?.marketShare || 0)} market share
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top by Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{topByGrowth?.dealerName || "N/A"}</div>
              <div className={`text-2xl font-bold ${(topByGrowth?.growthRate || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPercentage(topByGrowth?.growthRate || 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                {topByGrowth?.totalOrders || 0} orders
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top by Loyalty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{topByLoyalty?.dealerName || "N/A"}</div>
              <div className="text-2xl font-bold">{topByLoyalty?.loyaltyScore || 0}</div>
              <div className="text-sm text-muted-foreground">
                {formatPercentage(topByLoyalty?.marketShare || 0)} market share
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key performance indicators across all dealers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Sales Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-medium">{formatNumber(totalOrders)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Order Value:</span>
                    <span className="font-medium">
                      {formatCurrency(totalOrders > 0 ? totalSales / totalOrders : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Top Dealer Sales:</span>
                    <span className="font-medium">{formatCurrency(topBySales?.totalSales || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Loyalty & Growth</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>High Loyalty Dealers:</span>
                    <span className="font-medium">
                      {dealerAnalytics.filter(d => d.loyaltyScore >= 50).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Growing Dealers:</span>
                    <span className="font-medium">
                      {dealerAnalytics.filter(d => d.growthRate > 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platinum Dealers:</span>
                    <span className="font-medium">{tierDistribution.Platinum || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
