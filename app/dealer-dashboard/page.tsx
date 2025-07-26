"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useData } from "@/contexts/data-context"
import { useFilters } from "@/contexts/filter-context"
import {
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Crown,
  Medal,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from "recharts"

export default function DealerDashboardPage() {
  const { data, loading } = useData()
  const { filteredData } = useFilters()
  const [viewMode, setViewMode] = React.useState<"category" | "time" | "performance">("category")

  // Advanced dealer analytics with memoization
  const dealerAnalytics = React.useMemo(() => {
    if (!filteredData.length) return null

    // Comprehensive dealer analysis
    const dealerData = filteredData.reduce(
      (acc, item) => {
        const dealer = item["Customer Name"]
        if (!acc[dealer]) {
          acc[dealer] = {
            name: dealer,
            totalSales: 0,
            totalOrders: 0,
            categories: new Set(),
            months: new Set(),
            firstOrder: item.challanDate,
            lastOrder: item.challanDate,
            categoryBreakdown: {},
            monthlyData: {},
          }
        }

        const dealerInfo = acc[dealer]
        dealerInfo.totalSales += item.itemTotal
        dealerInfo.totalOrders += 1
        dealerInfo.categories.add(item.category)
        dealerInfo.months.add(`${item.year}-${item.monthNum}`)

        if (item.challanDate < dealerInfo.firstOrder) dealerInfo.firstOrder = item.challanDate
        if (item.challanDate > dealerInfo.lastOrder) dealerInfo.lastOrder = item.challanDate

        // Category breakdown
        if (!dealerInfo.categoryBreakdown[item.category]) {
          dealerInfo.categoryBreakdown[item.category] = { sales: 0, orders: 0 }
        }
        dealerInfo.categoryBreakdown[item.category].sales += item.itemTotal
        dealerInfo.categoryBreakdown[item.category].orders += 1

        // Monthly data
        const monthKey = `${item.year}-${item.monthNum.toString().padStart(2, "0")}`
        if (!dealerInfo.monthlyData[monthKey]) {
          dealerInfo.monthlyData[monthKey] = { month: item.month, sales: 0, orders: 0 }
        }
        dealerInfo.monthlyData[monthKey].sales += item.itemTotal
        dealerInfo.monthlyData[monthKey].orders += 1

        return acc
      },
      {} as Record<string, any>,
    )

    // Calculate advanced metrics for each dealer
    const totalSales = filteredData.reduce((sum, item) => sum + item.itemTotal, 0)

    const dealerMetrics = Object.values(dealerData)
      .map((dealer: any) => {
        const avgOrderValue = dealer.totalSales / dealer.totalOrders
        const marketShare = (dealer.totalSales / totalSales) * 100
        const categoryDiversity = dealer.categories.size
        const orderFrequency = dealer.totalOrders / dealer.months.size

        // Calculate growth rate (last 3 months vs previous 3 months)
        const monthlyEntries = Object.entries(dealer.monthlyData).sort(([a], [b]) => a.localeCompare(b))
        const recentMonths = monthlyEntries.slice(-3)
        const previousMonths = monthlyEntries.slice(-6, -3)

        const recentSales = recentMonths.reduce((sum, [, data]: [string, any]) => sum + data.sales, 0)
        const previousSales = previousMonths.reduce((sum, [, data]: [string, any]) => sum + data.sales, 0)
        const growthRate = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0

        // Loyalty score calculation
        const daysSinceFirst = Math.floor((dealer.lastOrder - dealer.firstOrder) / (1000 * 60 * 60 * 24))
        const loyaltyScore = Math.min(
          100,
          dealer.totalOrders * 5 + categoryDiversity * 8 + orderFrequency * 10 + Math.min(daysSinceFirst / 10, 25),
        )

        // Performance tier
        let tier = "Bronze"
        if (marketShare > 5 && loyaltyScore > 70) tier = "Platinum"
        else if (marketShare > 2 && loyaltyScore > 50) tier = "Gold"
        else if (marketShare > 1 || loyaltyScore > 30) tier = "Silver"

        return {
          ...dealer,
          categories: categoryDiversity,
          months: dealer.months.size,
          avgOrderValue,
          marketShare,
          orderFrequency,
          growthRate,
          loyaltyScore: Math.round(loyaltyScore),
          tier,
          monthlyTrend: monthlyEntries.map(([key, data]: [string, any]) => ({
            month: data.month,
            sales: data.sales,
            orders: data.orders,
          })),
        }
      })
      .sort((a, b) => b.totalSales - a.totalSales)

    // Top performers by different metrics
    const topByGrowth = [...dealerMetrics].sort((a, b) => b.growthRate - a.growthRate).slice(0, 10)
    const topByLoyalty = [...dealerMetrics].sort((a, b) => b.loyaltyScore - a.loyaltyScore).slice(0, 10)
    const topByFrequency = [...dealerMetrics].sort((a, b) => b.orderFrequency - a.orderFrequency).slice(0, 10)

    // Tier distribution
    const tierDistribution = dealerMetrics.reduce(
      (acc, dealer) => {
        acc[dealer.tier] = (acc[dealer.tier] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      dealerMetrics,
      topByGrowth,
      topByLoyalty,
      topByFrequency,
      tierDistribution,
      totalDealers: dealerMetrics.length,
    }
  }, [filteredData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!dealerAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        No dealer data available
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-IN").format(value)
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return <Crown className="h-4 w-4 text-purple-500 flex-shrink-0" />
      case "Gold":
        return <Medal className="h-4 w-4 text-yellow-500 flex-shrink-0" />
      case "Silver":
        return <Award className="h-4 w-4 text-gray-500 flex-shrink-0" />
      default:
        return <Star className="h-4 w-4 text-orange-500 flex-shrink-0" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "Gold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Silver":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    }
  }

  // Prepare radar chart data for top dealer
  const topDealer = dealerAnalytics.dealerMetrics[0]
  const radarData = topDealer
    ? [
        { subject: "Sales Volume", A: Math.min(100, (topDealer.marketShare / 10) * 100) },
        { subject: "Order Frequency", A: Math.min(100, (topDealer.orderFrequency / 5) * 100) },
        { subject: "Category Diversity", A: Math.min(100, (topDealer.categories / 6) * 100) },
        { subject: "Loyalty Score", A: topDealer.loyaltyScore },
        { subject: "Growth Rate", A: Math.min(100, Math.max(0, topDealer.growthRate + 50)) },
        { subject: "Avg Order Value", A: Math.min(100, (topDealer.avgOrderValue / 50000) * 100) },
      ]
    : []

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dealer Overview Cards */}
      <div className="responsive-grid">
        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-wrap">Total Dealers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(dealerAnalytics.totalDealers)}</div>
            <div className="flex items-center space-x-2">
              <Crown className="h-3 w-3 text-purple-500 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {dealerAnalytics.tierDistribution.Platinum || 0} Platinum tier
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-wrap">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-base sm:text-lg font-bold text-wrap" title={topDealer?.name}>
              {topDealer?.name || "N/A"}
            </div>
            <div className="flex items-center space-x-2">
              {getTierIcon(topDealer?.tier || "Bronze")}
              <span className="text-xs text-muted-foreground">{topDealer?.marketShare.toFixed(1)}% market share</span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-wrap">Avg Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold">
              {(
                dealerAnalytics.dealerMetrics.reduce((sum, d) => sum + d.growthRate, 0) / dealerAnalytics.totalDealers
              ).toFixed(1)}
              %
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {dealerAnalytics.topByGrowth.filter((d) => d.growthRate > 0).length} growing dealers
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-wrap">Avg Loyalty Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold">
              {Math.round(
                dealerAnalytics.dealerMetrics.reduce((sum, d) => sum + d.loyaltyScore, 0) /
                  dealerAnalytics.totalDealers,
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {dealerAnalytics.topByLoyalty.filter((d) => d.loyaltyScore > 70).length} high loyalty
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-responsive-lg">Dealer Analysis</CardTitle>
              <CardDescription>Comprehensive dealer performance insights</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={viewMode === "category" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("category")}
                className="touch-target"
              >
                <PieChart className="h-4 w-4 mr-2 flex-shrink-0" />
                Category View
              </Button>
              <Button
                variant={viewMode === "time" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("time")}
                className="touch-target"
              >
                <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
                Time View
              </Button>
              <Button
                variant={viewMode === "performance" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("performance")}
                className="touch-target"
              >
                <Activity className="h-4 w-4 mr-2 flex-shrink-0" />
                Performance Matrix
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "category" && (
            <div className="responsive-grid-2">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealerAnalytics.dealerMetrics.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Sales"]}
                      labelStyle={{ fontSize: "12px" }}
                    />
                    <Bar dataKey="totalSales" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Tier Distribution</h4>
                {Object.entries(dealerAnalytics.tierDistribution).map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2">
                      {getTierIcon(tier)}
                      <span className="text-sm font-medium">{tier}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{count}</span>
                      <Badge className={getTierColor(tier)}>
                        {((count / dealerAnalytics.totalDealers) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "time" && topDealer && (
            <div className="responsive-grid-2">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={topDealer.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Sales"]}
                      labelStyle={{ fontSize: "12px" }}
                    />
                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Growth Leaders</h4>
                {dealerAnalytics.topByGrowth.slice(0, 8).map((dealer, index) => (
                  <div key={dealer.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" title={dealer.name}>
                          {dealer.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getTierIcon(dealer.tier)}
                          <span className="text-xs text-muted-foreground">{dealer.totalOrders} orders</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        {dealer.growthRate >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm font-bold ${dealer.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {dealer.growthRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "performance" && (
            <div className="responsive-grid-2">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
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
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Market Share</span>
                    <span className="text-sm font-bold">{topDealer?.marketShare.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Loyalty Score</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={topDealer?.loyaltyScore || 0} className="w-16 h-2" />
                      <span className="text-sm font-bold">{topDealer?.loyaltyScore}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Order Frequency</span>
                    <span className="text-sm font-bold">{topDealer?.orderFrequency.toFixed(1)}/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Category Diversity</span>
                    <span className="text-sm font-bold">{topDealer?.categories} categories</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Order Value</span>
                    <span className="text-sm font-bold break-word">
                      {formatCurrency(topDealer?.avgOrderValue || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dealer Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Dealer Rankings</CardTitle>
          <CardDescription>Top performing dealers across different metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dealerAnalytics.dealerMetrics.slice(0, 15).map((dealer, index) => (
              <div key={dealer.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium truncate" title={dealer.name}>
                        {dealer.name}
                      </h4>
                      <Badge className={getTierColor(dealer.tier)}>{dealer.tier}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{dealer.totalOrders} orders</span>
                      <span>•</span>
                      <span>{dealer.categories} categories</span>
                      <span>•</span>
                      <span>{dealer.loyaltyScore}% loyalty</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <p className="text-sm font-bold break-word">{formatCurrency(dealer.totalSales)}</p>
                  <div className="flex items-center space-x-1">
                    {dealer.growthRate >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${dealer.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {dealer.growthRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
