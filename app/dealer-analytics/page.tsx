"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useData } from "@/contexts/data-context"
import { useFilters } from "@/contexts/filter-context"
import { ExportButton } from "@/components/export-button"
import useResponsive from "@/hooks/use-responsive"
import { getCSVFileEntries } from "@/lib/mongodb-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Filter,
  Grid3X3,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Crown,
  Medal,
  Star,
  Target,
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
import { VirtualizedTable } from "@/components/ui/virtualized-table"
import { LazyChart } from "@/components/ui/lazy-chart"
import { LazyChartWrapper } from "@/components/ui/lazy-chart-wrapper"
import { Progress } from "@/components/ui/progress"
import { paginateData } from "@/lib/data-utils"

export default function DealerAnalyticsPage() {
  // Get responsive screen size
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { data, loading, refreshData } = useData()
  const { filteredData, isFiltering, filterProgress } = useFilters()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTier, setSelectedTier] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("all")
  const [viewMode, setViewMode] = useState("grid")
  const [sortBy, setSortBy] = useState<"sales" | "growth" | "loyalty" | "orders">("sales")
  const [currentFile, setCurrentFile] = useState<any>(null)
  const { toast } = useToast()
  
  // Get current file info
  useEffect(() => {
    const fetchCurrentFile = async () => {
      try {
        const files = await getCSVFileEntries();
        if (files && files.length > 0) {
          // Sort by import date (most recent first)
          const sortedFiles = files.sort((a, b) => {
            const dateA = new Date(a.importDate || 0);
            const dateB = new Date(b.importDate || 0);
            return dateB.getTime() - dateA.getTime();
          });
          
          setCurrentFile(sortedFiles[0]);
          console.log("Current file:", sortedFiles[0]);
        }
      } catch (error) {
        console.error("Error fetching current file:", error);
      }
    };
    
    fetchCurrentFile();
  }, []);
  
  // Pagination state - managed with optimized pagination function
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [tableHeight, setTableHeight] = useState(500)
  const itemsPerPage = pageSize

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedTier, dateRange, sortBy])

  // Advanced dealer analytics with comprehensive filtering - wrapped in useMemo
  const dealerAnalytics = useMemo(() => {
    if (!filteredData.length) return null

    // Filter by date range
    let dateFilteredData = filteredData
    if (dateRange !== "all") {
      const now = new Date()
      const monthsBack = Number.parseInt(dateRange)
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
      dateFilteredData = filteredData.filter((item) => item.challanDate >= cutoffDate)
    }

    // Comprehensive dealer analysis - using the native JavaScript reduce for best performance
    const dealerData = dateFilteredData.reduce(
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
            recentActivity: [],
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

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        if (item.challanDate >= thirtyDaysAgo) {
          dealerInfo.recentActivity.push({
            date: item.challanDate,
            amount: item.itemTotal,
            category: item.category,
          })
        }

        return acc
      },
      {} as Record<string, any>,
    )

    // Calculate advanced metrics
    const totalSales = dateFilteredData.reduce((sum, item) => sum + item.itemTotal, 0)

    const dealerMetrics = Object.values(dealerData).map((dealer: any) => {
      const avgOrderValue = dealer.totalSales / dealer.totalOrders
      const marketShare = (dealer.totalSales / totalSales) * 100
      const categoryDiversity = dealer.categories.size
      const orderFrequency = dealer.totalOrders / Math.max(dealer.months.size, 1)

      // Calculate growth rate
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
        dealer.totalOrders * 5 +
          categoryDiversity * 8 +
          orderFrequency * 10 +
          Math.min(daysSinceFirst / 10, 25) +
          dealer.recentActivity.length * 2,
      )

      // Performance tier
      let tier = "Bronze"
      if (marketShare > 5 && loyaltyScore > 70) tier = "Platinum"
      else if (marketShare > 2 && loyaltyScore > 50) tier = "Gold"
      else if (marketShare > 1 || loyaltyScore > 30) tier = "Silver"

      // Performance percentile
      const performanceScore = marketShare * 0.4 + loyaltyScore * 0.3 + Math.max(0, growthRate + 50) * 0.3

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
        performanceScore,
        recentActivityCount: dealer.recentActivity.length,
        monthlyTrend: monthlyEntries.map(([key, data]: [string, any]) => ({
          month: data.month,
          sales: data.sales,
          orders: data.orders,
        })),
      }
    })

    // Apply filters
    let filteredDealers = dealerMetrics

    // Search filter
    if (searchTerm) {
      filteredDealers = filteredDealers.filter((dealer) => dealer.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Tier filter
    if (selectedTier !== "all") {
      filteredDealers = filteredDealers.filter((dealer) => dealer.tier === selectedTier)
    }

    // Sort dealers
    filteredDealers.sort((a, b) => {
      switch (sortBy) {
        case "sales":
          return b.totalSales - a.totalSales
        case "growth":
          return b.growthRate - a.growthRate
        case "loyalty":
          return b.loyaltyScore - a.loyaltyScore
        case "orders":
          return b.totalOrders - a.totalOrders
        default:
          return b.totalSales - a.totalSales
      }
    })

    // Calculate percentiles for performance ranking
    const sortedByPerformance = [...dealerMetrics].sort((a, b) => b.performanceScore - a.performanceScore)
    filteredDealers.forEach((dealer) => {
      const rank = sortedByPerformance.findIndex((d) => d.name === dealer.name) + 1
      dealer.percentile = Math.round(((sortedByPerformance.length - rank + 1) / sortedByPerformance.length) * 100)
    })

    // Tier distribution
    const tierDistribution = dealerMetrics.reduce(
      (acc, dealer) => {
        acc[dealer.tier] = (acc[dealer.tier] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Performance insights
    const topPerformers = filteredDealers.slice(0, 5)
    const growthLeaders = [...filteredDealers].sort((a, b) => b.growthRate - a.growthRate).slice(0, 5)
    const loyaltyChampions = [...filteredDealers].sort((a, b) => b.loyaltyScore - a.loyaltyScore).slice(0, 5)

    return {
      dealerMetrics: filteredDealers,
      tierDistribution,
      topPerformers,
      growthLeaders,
      loyaltyChampions,
      totalDealers: dealerMetrics.length,
      filteredCount: filteredDealers.length,
    }
  }, [filteredData, searchTerm, selectedTier, dateRange, sortBy]);

  // Calculate paginated data - moved after dealerAnalytics is defined
  const paginatedData = useMemo(() => {
    if (!dealerAnalytics) return { 
      data: [], 
      pagination: { 
        totalItems: 0, 
        currentPage: 1, 
        pageSize, 
        totalPages: 1, 
        hasNextPage: false, 
        hasPreviousPage: false 
      } 
    };
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = dealerAnalytics.dealerMetrics.slice(startIndex, endIndex);
    
    return { 
      data: items, 
      pagination: {
        totalItems: dealerAnalytics.dealerMetrics.length,
        currentPage,
        pageSize,
        totalPages: Math.ceil(dealerAnalytics.dealerMetrics.length / pageSize),
        hasNextPage: endIndex < dealerAnalytics.dealerMetrics.length,
        hasPreviousPage: startIndex > 0
      } 
    };
  }, [dealerAnalytics, currentPage, pageSize]);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current file info */}
      {currentFile && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">Current File: {currentFile.fileName}</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400 flex items-center justify-between">
            <span>
              Showing {data.length.toLocaleString()} records from file uploaded on{" "}
              {new Date(currentFile.importDate).toLocaleDateString()}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2 text-xs"
              onClick={() => {
                refreshData(true);
                toast({
                  title: "Data refreshed",
                  description: "Data has been refreshed from the current file"
                });
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Advanced Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Dealer Analytics</CardTitle>
          <CardDescription>Advanced dealer performance analysis with filtering and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filter Controls - Enhanced Mobile Responsiveness */}
            <div className="space-y-4">
              {/* Search - Full width on mobile, then grid layout on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-responsive-sm">Search Dealers</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      id="search"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 mobile-touch-target"
                    />
                  </div>
                </div>
    
                <div className="space-y-2">
                  <Label className="text-responsive-sm">Tier Filter</Label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger className="mobile-touch-target">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
    
                <div className="space-y-2">
                  <Label className="text-responsive-sm">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="mobile-touch-target">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="3">Last 3 Months</SelectItem>
                      <SelectItem value="6">Last 6 Months</SelectItem>
                      <SelectItem value="12">Last 12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
    
                <div className="space-y-2">
                  <Label className="text-responsive-sm">Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="mobile-touch-target">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Total Sales</SelectItem>
                      <SelectItem value="growth">Growth Rate</SelectItem>
                      <SelectItem value="loyalty">Loyalty Score</SelectItem>
                      <SelectItem value="orders">Order Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            
              {/* View Mode Controls - Stack on mobile, side-by-side on larger screens */}
              <div className="flex-responsive space-y-3 sm:space-y-0 items-start sm:items-center justify-between sm:gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-responsive-xs text-muted-foreground">
                    Showing {dealerAnalytics.filteredCount} of {dealerAnalytics.totalDealers} dealers
                  </span>
                </div>
    
                {/* Horizontally scrollable view buttons on mobile */}
                <div className="mobile-scrollable sm:overflow-visible">
                  <div className="flex gap-2 w-max sm:w-auto">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="mobile-touch-target"
                    >
                      <Grid3X3 className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="sm:inline">Grid View</span>
                      <span className="inline sm:hidden">Grid</span>
                    </Button>
                    <Button
                      variant={viewMode === "chart" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("chart")}
                      className="mobile-touch-target"
                    >
                      <BarChart3 className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="sm:inline">Chart View</span>
                      <span className="inline sm:hidden">Charts</span>
                    </Button>
                    <Button
                      variant={viewMode === "comparison" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("comparison")}
                      className="mobile-touch-target"
                    >
                      <Users className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="sm:inline">Comparison</span>
                      <span className="inline sm:hidden">Compare</span>
                    </Button>
                    
                    <ExportButton 
                      chartSelectors={["#dealer-sales-chart", "#dealer-growth-chart"]} 
                      title="Dealer-Analytics"
                      size="sm"
                      className="mobile-touch-target"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {/* Enhanced mobile-responsive stats grid */}
      <div className="responsive-grid">
        {/* Mobile optimized cards with improved spacing */}
        <Card className="min-h-[110px] sm:min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2 sm:p-4">
            <CardTitle className="text-responsive-xs font-medium text-wrap">Active Dealers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2 px-3 pb-3 sm:p-4">
            <div className="text-responsive-xl font-bold">{formatNumber(dealerAnalytics.filteredCount)}</div>
            <div className="flex items-center space-x-2">
              <Crown className="h-3 w-3 text-purple-500 flex-shrink-0" />
              <span className="text-responsive-xs text-muted-foreground">
                {dealerAnalytics.tierDistribution.Platinum || 0} Platinum
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[110px] sm:min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2 sm:p-4">
            <CardTitle className="text-responsive-xs font-medium text-wrap">Avg Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2 px-3 pb-3 sm:p-4">
            <div className="text-responsive-xl font-bold">
              {dealerAnalytics.dealerMetrics.length > 0
                ? (
                    dealerAnalytics.dealerMetrics.reduce((sum, d) => sum + d.growthRate, 0) /
                    dealerAnalytics.dealerMetrics.length
                  ).toFixed(1)
                : "0.0"}
              %
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span className="text-responsive-xs text-muted-foreground">
                {dealerAnalytics.dealerMetrics.filter((d) => d.growthRate > 0).length} growing
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[110px] sm:min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2 sm:p-4">
            <CardTitle className="text-responsive-xs font-medium text-wrap">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2 px-3 pb-3 sm:p-4">
            <div className="text-responsive-sm font-bold mobile-truncate" title={dealerAnalytics.topPerformers[0]?.name}>
              {dealerAnalytics.topPerformers[0]?.name || "N/A"}
            </div>
            <div className="flex items-center space-x-2">
              {getTierIcon(dealerAnalytics.topPerformers[0]?.tier || "Bronze")}
              <span className="text-responsive-xs text-muted-foreground">
                {dealerAnalytics.topPerformers[0]?.marketShare.toFixed(1)}% share
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[110px] sm:min-h-[120px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2 sm:p-4">
            <CardTitle className="text-responsive-xs font-medium text-wrap">Avg Loyalty</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2 px-3 pb-3 sm:p-4">
            <div className="text-responsive-xl font-bold">
              {dealerAnalytics.dealerMetrics.length > 0
                ? Math.round(
                    dealerAnalytics.dealerMetrics.reduce((sum, d) => sum + d.loyaltyScore, 0) /
                      dealerAnalytics.dealerMetrics.length,
                  )
                : 0}
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
              <span className="text-responsive-xs text-muted-foreground">
                {dealerAnalytics.dealerMetrics.filter((d) => d.loyaltyScore > 70).length} high loyalty
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      {isFiltering && (
        <div className="my-4">
          <p className="text-sm text-muted-foreground mb-2">Filtering data... {filterProgress}%</p>
          <Progress value={filterProgress} className="h-2" />
        </div>
      )}
      
      {viewMode === "grid" && dealerAnalytics && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Showing {paginatedData.pagination.currentPage > 0 
              ? (paginatedData.pagination.currentPage - 1) * paginatedData.pagination.pageSize + 1 
              : 0}-
            {Math.min(paginatedData.pagination.currentPage * paginatedData.pagination.pageSize, paginatedData.pagination.totalItems)} of {paginatedData.pagination.totalItems} dealers
          </div>
          
          {/* Replace the standard mapping with VirtualizedTable for large datasets */}
          {dealerAnalytics.dealerMetrics.length > 20 ? (
            <Card>
              <CardContent className="p-0">
                <VirtualizedTable
                  data={dealerAnalytics.dealerMetrics}
                  columns={[
                    { key: "rank", header: "#" },
                    { key: "name", header: "Dealer" },
                    { key: "tier", header: "Tier" },
                    { key: "totalSales", header: "Sales" },
                    { key: "totalOrders", header: "Orders" },
                    { key: "growthRate", header: "Growth" },
                    { key: "loyaltyScore", header: "Loyalty" }
                  ]}
                  rowHeight={60}
                  containerHeight={tableHeight}
                  containerClassName="dealer-table"
                  getRowId={(dealer) => dealer.name}
                  emptyMessage="No dealers match your filters"
                />
              </CardContent>
            </Card>
          ) : (
            // For smaller datasets, use the original card-based display
            paginatedData.data.map((dealer: any, index: number) => (
              <Card key={dealer.name}>
                <CardContent className="card-content-spacing">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold truncate" title={dealer.name}>
                            {dealer.name}
                          </h3>
                          <Badge className={getTierColor(dealer.tier)}>{dealer.tier}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {dealer.percentile}th percentile
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{dealer.totalOrders} orders</span>
                          <span>�</span>
                          <span>{dealer.categories} categories</span>
                          <span>�</span>
                          <span>{dealer.recentActivityCount} recent activities</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-lg">{formatCurrency(dealer.totalSales)}</div>
                      <div className="text-sm text-muted-foreground">
                        {dealer.growthRate >= 0 ? (
                          <span className="text-green-600">? {dealer.growthRate.toFixed(1)}%</span>
                        ) : (
                          <span className="text-red-600">? {Math.abs(dealer.growthRate).toFixed(1)}%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Loyalty Score</p>
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-bold mr-1">{dealer.loyaltyScore}</span>
                        <Progress value={dealer.loyaltyScore} className="h-2 w-16" />
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Market Share</p>
                      <p className="text-sm font-bold">{dealer.marketShare.toFixed(2)}%</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Avg Order</p>
                      <p className="text-sm font-bold break-word">{formatCurrency(dealer.avgOrderValue)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Frequency</p>
                      <p className="text-sm font-bold">{dealer.orderFrequency.toFixed(1)}/mo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          
          {/* Mobile-responsive Pagination Controls */}
          {dealerAnalytics.dealerMetrics.length > itemsPerPage && (
            <Pagination className="py-2 sm:py-4">
              <PaginationContent className="flex-wrap">
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    aria-disabled={currentPage === 1}
                    className={`${currentPage === 1 ? "pointer-events-none opacity-50" : ""} mobile-touch-target`}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.ceil(dealerAnalytics.dealerMetrics.length / itemsPerPage) }).map((_, idx) => {
                  const pageNumber = idx + 1;
                  const totalPages = Math.ceil(dealerAnalytics.dealerMetrics.length / itemsPerPage);
                  
                  // For mobile, show fewer pages
                  const isMobileVisible = 
                    pageNumber === 1 || 
                    pageNumber === totalPages || 
                    pageNumber === currentPage;
                    
                  // For desktop, show more pages
                  const isDesktopVisible =
                    pageNumber === 1 || 
                    pageNumber === totalPages || 
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                  
                  // Mobile-responsive display logic using the responsive hook
                  const shouldShowOnMobile = isMobile && (pageNumber === 1 || pageNumber === totalPages || pageNumber === currentPage);
                  const shouldShowOnTablet = isTablet && (pageNumber === 1 || pageNumber === totalPages || 
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1));
                  const shouldShowOnDesktop = isDesktop && (pageNumber === 1 || pageNumber === totalPages || 
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1));
                  
                  if (shouldShowOnMobile || shouldShowOnTablet || shouldShowOnDesktop) {
                    return (
                      <PaginationItem key={`page-${pageNumber}`} className={isMobile ? "mx-0.5" : "mx-1"}>
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNumber);
                          }}
                          isActive={pageNumber === currentPage}
                          className={`mobile-touch-target ${isMobile ? "h-8 w-8 p-0" : ""}`}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  // Show ellipsis for gaps in pagination, with responsive behavior
                  const shouldShowDesktopEllipsis = 
                    (isTablet || isDesktop) &&
                    ((pageNumber === currentPage - 2 && pageNumber > 2) || 
                    (pageNumber === currentPage + 2 && pageNumber < totalPages - 1));
                    
                  if (shouldShowDesktopEllipsis) {
                    return (
                      <PaginationItem key={`ellipsis-${pageNumber}`} className={isMobile ? "mx-0.5" : "mx-1"}>
                        <PaginationEllipsis className={isMobile ? "h-8 w-8 p-0" : ""} />
                      </PaginationItem>
                    );
                  }
                  
                  // Mobile simplified display
                  if (
                    (pageNumber === 2 && currentPage > 3 && pageNumber !== currentPage) ||
                    (pageNumber === totalPages - 1 && currentPage < totalPages - 2 && pageNumber !== currentPage)
                  ) {
                    return (
                      <PaginationItem key={`mobile-ellipsis-${pageNumber}`} className="inline-flex xs:inline-flex sm:hidden">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      const totalPages = Math.ceil(dealerAnalytics.dealerMetrics.length / itemsPerPage);
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    aria-disabled={currentPage === Math.ceil(dealerAnalytics.dealerMetrics.length / itemsPerPage)}
                    className={`${currentPage === Math.ceil(dealerAnalytics.dealerMetrics.length / itemsPerPage) ? "pointer-events-none opacity-50" : ""} mobile-touch-target`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {viewMode === "chart" && (
        <div className="responsive-grid-2">
          <Card className="overflow-hidden">
            <CardHeader className="px-3 sm:px-6 py-3 sm:pb-3">
              <CardTitle className="text-responsive-sm">Sales Performance</CardTitle>
              <CardDescription className="text-responsive-xs">Dealer sales comparison</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
              <div className="chart-container" id="dealer-sales-chart">
                <LazyChartWrapper
                  data={dealerAnalytics.dealerMetrics.slice(0, 15)}
                  title="Dealer Sales Comparison"
                  height={280}
                  id="sales-chart"
                  renderChart={({ data, height }) => (
                    <ResponsiveContainer width="100%" height={height}>
                      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 65, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 9 }} 
                          angle={-45} 
                          textAnchor="end" 
                          height={80} 
                          interval={0}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }} 
                          tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} 
                          width={45}
                        />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), "Sales"]}
                          labelStyle={{ fontSize: "11px" }}
                          contentStyle={{ fontSize: "11px" }}
                        />
                        <Bar dataKey="totalSales" fill="hsl(var(--chart-1))" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="px-3 sm:px-6 py-3 sm:pb-3">
              <CardTitle className="text-responsive-sm">Growth vs Sales</CardTitle>
              <CardDescription className="text-responsive-xs">Performance correlation analysis</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
              <div className="chart-container" id="dealer-growth-chart">
                <LazyChartWrapper
                  data={dealerAnalytics.dealerMetrics}
                  title="Sales vs Growth Rate"
                  height={280}
                  id="growth-chart"
                  renderChart={({ data, height }) => (
                    <ResponsiveContainer width="100%" height={height}>
                      <ScatterChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="totalSales"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                          width={45}
                        />
                        <YAxis
                          dataKey="growthRate"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => `${value.toFixed(0)}%`}
                          width={35}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === "totalSales" ? formatCurrency(value) : `${value.toFixed(1)}%`,
                            name === "totalSales" ? "Sales" : "Growth Rate",
                          ]}
                          labelStyle={{ fontSize: "11px" }}
                          contentStyle={{ fontSize: "11px" }}
                        />
                        <Scatter dataKey="totalSales" fill="hsl(var(--chart-2))" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === "comparison" && (
        <Card className="overflow-hidden">
          <CardHeader className="px-3 sm:px-6 py-3 sm:pb-3">
            <CardTitle className="text-responsive-sm">Tier-wise Comparison</CardTitle>
            <CardDescription className="text-responsive-xs">Performance analysis by dealer tiers</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-4 sm:space-y-6">
              {["Platinum", "Gold", "Silver", "Bronze"].map((tier) => {
                const tierDealers = dealerAnalytics.dealerMetrics.filter((d) => d.tier === tier)
                if (tierDealers.length === 0) return null

                const avgSales = tierDealers.reduce((sum, d) => sum + d.totalSales, 0) / tierDealers.length
                const avgGrowth = tierDealers.reduce((sum, d) => sum + d.growthRate, 0) / tierDealers.length
                const avgLoyalty = tierDealers.reduce((sum, d) => sum + d.loyaltyScore, 0) / tierDealers.length

                return (
                  <div key={tier} className="p-3 sm:p-4 rounded-lg border bg-card">
                    <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2">
                        {getTierIcon(tier)}
                        <h3 className="text-base sm:text-lg font-semibold">{tier} Tier</h3>
                        <Badge className={getTierColor(tier)}>{tierDealers.length} dealers</Badge>
                      </div>
                      <div className="text-right w-full sm:w-auto">
                        <p className="text-xs sm:text-sm text-muted-foreground">Avg Performance</p>
                        <p className="text-base sm:text-lg font-bold break-word">{formatCurrency(avgSales)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Avg Growth</p>
                        <p className="text-xs sm:text-sm font-bold">{avgGrowth.toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Avg Loyalty</p>
                        <p className="text-xs sm:text-sm font-bold">{avgLoyalty.toFixed(0)}</p>
                      </div>
                      <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Market Share</p>
                        <p className="text-xs sm:text-sm font-bold">
                          {(
                            (tierDealers.reduce((sum, d) => sum + d.totalSales, 0) /
                              dealerAnalytics.dealerMetrics.reduce((sum, d) => sum + d.totalSales, 0)) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs sm:text-sm font-medium">Top Performers in {tier}</h4>
                      <div className="space-y-1">
                        {tierDealers.slice(0, 3).map((dealer, index) => (
                          <div key={dealer.name} className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-muted/30">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <span className="text-xs sm:text-sm font-medium truncate" title={dealer.name}>
                                {dealer.name}
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm font-bold break-word">{formatCurrency(dealer.totalSales)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
