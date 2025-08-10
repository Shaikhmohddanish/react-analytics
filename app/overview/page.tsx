"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useData } from "@/contexts/data-context"
import { useFilters } from "@/contexts/filter-context"
import { calculateOverallStats, formatCurrency, formatNumber, formatPercentage } from "@/lib/analytics-utils"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Activity,
  Target,
  BarChart3,
  PieChart,
} from "lucide-react"
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff0000"]

export default function OverviewPage() {
  const { loading } = useData()
  const { filteredData, hasActiveFilters } = useFilters()
  const [viewMode, setViewMode] = React.useState<"sales" | "trends" | "distribution">("sales")

  // Calculate overall stats using filtered data
  const overallStats = React.useMemo(() => {
    if (!filteredData.length) return null
    return calculateOverallStats(filteredData)
  }, [filteredData])

  // Calculate category distribution
  const categoryDistribution = React.useMemo(() => {
    if (!filteredData.length) return []
    
    const categoryTotals = filteredData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.itemTotal
      return acc
    }, {} as Record<string, number>)

    return Object.entries(categoryTotals)
      .map(([category, sales]) => ({ category, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)
  }, [filteredData])

  // Calculate monthly trends
  const monthlyTrends = React.useMemo(() => {
    if (!filteredData.length) return []
    
    const monthlyData = filteredData.reduce((acc, item) => {
      const monthKey = `${item.year}-${item.monthNum.toString().padStart(2, "0")}`
      if (!acc[monthKey]) {
        acc[monthKey] = { month: item.month, sales: 0, orders: 0 }
      }
      acc[monthKey].sales += item.itemTotal
      acc[monthKey].orders += 1
      return acc
    }, {} as Record<string, { month: string; sales: number; orders: number }>)

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data)
  }, [filteredData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!overallStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        No data available
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter Status Indicator */}
      {hasActiveFilters && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">
                Showing analytics for {filteredData.length} filtered records
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="responsive-grid">
        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-wrap">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(overallStats.totalSales)}</div>
            <div className="flex items-center space-x-2">
              {overallStats.growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 flex-shrink-0" />
              )}
              <span
                className={`text-xs ${overallStats.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatPercentage(overallStats.growthRate)} from last year
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-wrap">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(overallStats.totalOrders)}</div>
            <div className="flex items-center space-x-2">
              <Package className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {formatCurrency(overallStats.avgOrderValue)} avg order value
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-wrap">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(overallStats.totalCustomers)}</div>
            <div className="flex items-center space-x-2">
              <Target className="h-3 w-3 text-purple-500 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {overallStats.topCategory} top category
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-wrap">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold">{formatPercentage(overallStats.growthRate)}</div>
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {overallStats.growthRate >= 0 ? "Positive" : "Negative"} trend
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-responsive-lg">Analytics Overview</CardTitle>
              <CardDescription>Comprehensive view of business performance</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={viewMode === "sales" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("sales")}
                className="touch-target"
              >
                <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
                Sales Analysis
              </Button>
              <Button
                variant={viewMode === "trends" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("trends")}
                className="touch-target"
              >
                <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0" />
                Trends
              </Button>
              <Button
                variant={viewMode === "distribution" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("distribution")}
                className="touch-target"
              >
                <PieChart className="h-4 w-4 mr-2 flex-shrink-0" />
                Distribution
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "sales" && (
            <div className="responsive-grid-2">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryDistribution} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 10 }} 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} 
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Sales"]}
                      labelStyle={{ fontSize: "12px" }}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Category Performance</h4>
                <div className="space-y-3">
                  {categoryDistribution.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.category}</span>
                        <span className="text-sm">{formatCurrency(category.sales)}</span>
                      </div>
                      <Progress 
                        value={(category.sales / overallStats.totalSales) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === "trends" && (
            <div className="responsive-grid-2">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
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
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Monthly Trends</h4>
                <div className="space-y-3">
                  {monthlyTrends.slice(-6).map((trend, index) => (
                    <div key={trend.month} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{trend.month}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatCurrency(trend.sales)}</div>
                        <div className="text-xs text-muted-foreground">{trend.orders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === "distribution" && (
            <div className="responsive-grid-2">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sales"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Sales"]} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Sales Distribution</h4>
                <div className="space-y-3">
                  {categoryDistribution.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <Badge variant="secondary">
                        {formatPercentage((category.sales / overallStats.totalSales) * 100, 1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
