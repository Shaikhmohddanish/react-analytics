"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useData } from "@/contexts/data-context"
import { useFilter } from "@/contexts/filter-context"
import { MonthlyBreakdownChart } from "@/components/monthly-breakdown-chart"
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  Target,
  Award,
  Activity,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

export default function OverviewPage() {
  const { data, loading, stats } = useData()
  const { filteredData } = useFilter()

  // Advanced calculations with memoization
  const analytics = React.useMemo(() => {
    if (!filteredData.length) return null

    // Monthly trend analysis
    const monthlyData = filteredData.reduce(
      (acc, item) => {
        const key = `${item.year}-${(item.monthNum ? item.monthNum.toString().padStart(2, "0") : "00")}`
        if (!acc[key]) {
          acc[key] = { month: item.month, year: item.year, sales: 0, orders: 0, customers: new Set() }
        }
        acc[key].sales += item.itemTotal
        acc[key].orders += 1
        acc[key].customers.add(item["Customer Name"])
        return acc
      },
      {} as Record<string, any>,
    )

    const monthlyTrends = Object.values(monthlyData)
      .map((item: any) => ({
        ...item,
        customers: item.customers.size,
        avgOrderValue: item.sales / item.orders,
      }))
      .sort((a, b) => `${a.year}-${a.month}`.localeCompare(`${b.year}-${b.month}`))

    // Category performance
    const categoryData = filteredData.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { category: item.category, sales: 0, orders: 0, customers: new Set() }
        }
        acc[item.category].sales += item.itemTotal
        acc[item.category].orders += 1
        acc[item.category].customers.add(item["Customer Name"])
        return acc
      },
      {} as Record<string, any>,
    )

    const categoryPerformance = Object.values(categoryData)
      .map((item: any) => ({
        ...item,
        customers: item.customers.size,
        avgOrderValue: item.sales / item.orders,
        marketShare: (item.sales / stats.totalSales) * 100,
      }))
      .sort((a, b) => b.sales - a.sales)

    // Customer analysis
    const customerData = filteredData.reduce(
      (acc, item) => {
        const customer = item["Customer Name"]
        if (!acc[customer]) {
          acc[customer] = {
            name: customer,
            sales: 0,
            orders: 0,
            categories: new Set(),
            firstOrder: item.challanDate,
            lastOrder: item.challanDate,
          }
        }
        acc[customer].sales += item.itemTotal
        acc[customer].orders += 1
        acc[customer].categories.add(item.category)
        if (item.challanDate < acc[customer].firstOrder) acc[customer].firstOrder = item.challanDate
        if (item.challanDate > acc[customer].lastOrder) acc[customer].lastOrder = item.challanDate
        return acc
      },
      {} as Record<string, any>,
    )

    const topCustomers = Object.values(customerData)
      .map((customer: any) => {
        const daysSinceFirst = Math.floor((customer.lastOrder - customer.firstOrder) / (1000 * 60 * 60 * 24))
        const loyaltyScore = Math.min(
          100,
          customer.orders * 10 + customer.categories.size * 5 + Math.min(daysSinceFirst / 10, 20),
        )

        return {
          ...customer,
          categories: customer.categories.size,
          avgOrderValue: customer.sales / customer.orders,
          loyaltyScore: Math.round(loyaltyScore),
          customerLifetime: daysSinceFirst,
        }
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)

    // Growth calculations
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const currentMonthData = filteredData.filter((item) => item.monthNum === currentMonth && item.year === currentYear)
    const previousMonthData = filteredData.filter(
      (item) =>
        (item.monthNum === currentMonth - 1 && item.year === currentYear) ||
        (currentMonth === 1 && item.monthNum === 12 && item.year === currentYear - 1),
    )

    const currentMonthSales = currentMonthData.reduce((sum, item) => sum + item.itemTotal, 0)
    const previousMonthSales = previousMonthData.reduce((sum, item) => sum + item.itemTotal, 0)
    const monthlyGrowth =
      previousMonthSales > 0 ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100 : 0

    // Risk analysis
    const customerConcentration =
      (topCustomers.slice(0, 5).reduce((sum, customer) => sum + customer.sales, 0) / stats.totalSales) * 100
    const categoryConcentration =
      (categoryPerformance.slice(0, 3).reduce((sum, cat) => sum + cat.sales, 0) / stats.totalSales) * 100

    return {
      monthlyTrends,
      categoryPerformance,
      topCustomers,
      monthlyGrowth,
      customerConcentration,
      categoryConcentration,
    }
  }, [filteredData, stats.totalSales])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!analytics) {
    return <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">No data available</div>
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

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold" title={formatCurrency(stats.totalSales)}>
              {formatCurrency(stats.totalSales)}
            </div>
            <div className="flex items-center space-x-2">
              {analytics.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 flex-shrink-0" />
              )}
              <span className={`text-xs ${analytics.monthlyGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                {Math.abs(analytics.monthlyGrowth).toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(stats.totalOrders)}</div>
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">Avg: {formatCurrency(stats.avgOrderValue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(stats.totalCustomers)}</div>
            <div className="flex items-center space-x-2">
              <Target className="h-3 w-3 text-purple-500 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                Retention:{" "}
                {(
                  (analytics.topCustomers.filter((c) => c.loyaltyScore > 50).length / analytics.topCustomers.length) *
                  100
                ).toFixed(0)}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-base sm:text-lg font-bold truncate" title={stats.topCategory}>
              {stats.topCategory || "N/A"}
            </div>
            <div className="flex items-center space-x-2">
              <Award className="h-3 w-3 text-yellow-500 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {analytics.categoryPerformance[0]?.marketShare.toFixed(1)}% market share
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends and Category Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trends</CardTitle>
            <CardDescription>Monthly sales performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Sales"]}
                    labelStyle={{ fontSize: "12px" }}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Performance</CardTitle>
            <CardDescription>Sales distribution by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryPerformance.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Sales"]}
                    labelStyle={{ fontSize: "12px" }}
                  />
                  <Bar dataKey="sales" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Intelligence and Risk Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Customers</CardTitle>
            <CardDescription>Customer performance and loyalty analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topCustomers.slice(0, 8).map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" title={customer.name}>
                        {customer.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">{customer.orders} orders</span>
                        <Badge
                          variant={
                            customer.loyaltyScore > 70
                              ? "default"
                              : customer.loyaltyScore > 40
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs px-1 py-0"
                        >
                          {customer.loyaltyScore}% loyalty
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">{formatCurrency(customer.sales)}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(customer.avgOrderValue)} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              Risk Analysis
            </CardTitle>
            <CardDescription>Business concentration and risk metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Customer Concentration</span>
                  <span className="text-sm text-muted-foreground">{analytics.customerConcentration.toFixed(1)}%</span>
                </div>
                <Progress value={analytics.customerConcentration} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Top 5 customers represent {analytics.customerConcentration.toFixed(1)}% of revenue
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Category Concentration</span>
                  <span className="text-sm text-muted-foreground">{analytics.categoryConcentration.toFixed(1)}%</span>
                </div>
                <Progress value={analytics.categoryConcentration} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Top 3 categories represent {analytics.categoryConcentration.toFixed(1)}% of revenue
                </p>
              </div>

              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-2">Risk Assessment</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Customer Risk</span>
                    <Badge
                      variant={
                        analytics.customerConcentration > 60
                          ? "destructive"
                          : analytics.customerConcentration > 40
                            ? "secondary"
                            : "default"
                      }
                    >
                      {analytics.customerConcentration > 60
                        ? "High"
                        : analytics.customerConcentration > 40
                          ? "Medium"
                          : "Low"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Category Risk</span>
                    <Badge
                      variant={
                        analytics.categoryConcentration > 70
                          ? "destructive"
                          : analytics.categoryConcentration > 50
                            ? "secondary"
                            : "default"
                      }
                    >
                      {analytics.categoryConcentration > 70
                        ? "High"
                        : analytics.categoryConcentration > 50
                          ? "Medium"
                          : "Low"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Growth Trend</span>
                    <Badge
                      variant={
                        analytics.monthlyGrowth > 10
                          ? "default"
                          : analytics.monthlyGrowth > 0
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {analytics.monthlyGrowth > 10 ? "Strong" : analytics.monthlyGrowth > 0 ? "Stable" : "Declining"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Insights</CardTitle>
          <CardDescription>Key business insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Revenue Growth</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {analytics.monthlyGrowth >= 0
                  ? `Strong performance with ${analytics.monthlyGrowth.toFixed(1)}% growth this month`
                  : `Revenue declined by ${Math.abs(analytics.monthlyGrowth).toFixed(1)}% - focus on customer retention`}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Top Performer</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                {analytics.categoryPerformance[0]?.category} leads with{" "}
                {analytics.categoryPerformance[0]?.marketShare.toFixed(1)}% market share
              </p>
            </div>

            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Customer Loyalty</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {analytics.topCustomers.filter((c) => c.loyaltyScore > 70).length} high-loyalty customers driving repeat
                business
              </p>
            </div>

            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Opportunity</h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {analytics.categoryPerformance.length > 3
                  ? `Diversify focus - ${analytics.categoryPerformance.slice(3).length} categories have growth potential`
                  : "Consider expanding product categories for growth"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Monthly Breakdown Chart */}
      <div className="mt-6">
        <MonthlyBreakdownChart height={400} />
      </div>
    </div>
  )
}
