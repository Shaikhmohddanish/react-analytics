"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "@/contexts/data-context"
import { useFilters } from "@/contexts/filter-context"
import { calculateDealerAnalytics, formatCurrency, formatNumber, formatPercentage } from "@/lib/analytics-utils"
import DealerFilters from "@/components/dealer-performance/dealer-filters"
import DealerPerformanceMetrics from "@/components/dealer-performance/dealer-performance-metrics"
import DealerRankingTable from "@/components/dealer-performance/dealer-ranking-table"
import DealerPerformanceCharts from "@/components/dealer-performance/dealer-performance-charts"

export default function DealerPerformancePage() {
  const { data, loading, error } = useData()
  const { filteredData } = useFilters()
  const [activeTab, setActiveTab] = React.useState("overview")

  // Use centralized analytics calculation
  const dealerAnalytics = React.useMemo(() => {
    if (!filteredData.length) return null
    return calculateDealerAnalytics(filteredData)
  }, [filteredData])

  // Debug information
  console.log("Dealer Performance Debug:", {
    dataLength: data?.length || 0,
    filteredDataLength: filteredData?.length || 0,
    loading,
    error,
    hasData: data && data.length > 0,
    hasFilteredData: filteredData && filteredData.length > 0,
    dealerAnalyticsLength: dealerAnalytics?.length || 0
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4">Error loading data: {error}</p>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">No data available</p>
        <p className="text-sm text-muted-foreground">Please import some data to view dealer performance</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dealer Performance Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive analysis of dealer performance metrics, rankings, and trends
        </p>
        {/* Debug info */}
        <div className="text-sm text-muted-foreground">
          Data: {data.length} records | Filtered: {filteredData.length} records | Dealers: {dealerAnalytics?.length || 0}
        </div>
      </div>

      <DealerFilters />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Dealers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(dealerAnalytics?.length || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Active dealers in the system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dealerAnalytics?.reduce((sum, dealer) => sum + dealer.totalSales, 0) || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined sales across all dealers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Loyalty Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dealerAnalytics && dealerAnalytics.length > 0
                    ? Math.round(dealerAnalytics.reduce((sum, dealer) => sum + dealer.loyaltyScore, 0) / dealerAnalytics.length)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average loyalty across all dealers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dealerAnalytics?.[0]?.dealerName || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dealerAnalytics?.[0] ? formatPercentage(dealerAnalytics[0].marketShare) : "0%"} market share
                </p>
              </CardContent>
            </Card>
          </div>

          {dealerAnalytics && dealerAnalytics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Dealers by Sales</CardTitle>
                <CardDescription>
                  Leading dealers based on total sales performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dealerAnalytics.slice(0, 10).map((dealer, index) => (
                    <div key={dealer.dealerName} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{dealer.dealerName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {dealer.totalOrders} orders • {formatPercentage(dealer.loyaltyScore)} loyalty
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(dealer.totalSales)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatPercentage(dealer.marketShare)} market share
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <DealerPerformanceMetrics dealerAnalytics={dealerAnalytics} />
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
          <DealerRankingTable dealerAnalytics={dealerAnalytics} />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <DealerPerformanceCharts dealerAnalytics={dealerAnalytics} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
