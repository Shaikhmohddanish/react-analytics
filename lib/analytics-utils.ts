/**
 * Centralized Analytics Utilities
 * 
 * This file contains all standardized calculations used throughout the website
 * to ensure consistency in analytics, metrics, and scoring.
 */

// Month order for chronological sorting
const MONTH_ORDER = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

/**
 * Sort months chronologically instead of alphabetically
 * @param months Array of month strings (e.g., ['Jan', 'Mar', 'Feb'])
 * @returns Sorted array in chronological order
 */
export function sortMonthsChronologically(months: string[]): string[] {
  return months.sort((a, b) => {
    return MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)
  })
}

/**
 * Sort data by month chronologically
 * @param data Array of objects with a 'month' property
 * @returns Sorted array in chronological order
 */
export function sortDataByMonth<T extends { month: string }>(data: T[]): T[] {
  return data.sort((a, b) => {
    return MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
  })
}

import { ProcessedData } from "@/models"

/**
 * Standardized Dealer Analytics
 */
export interface DealerAnalytics {
  dealerName: string
  totalSales: number
  totalOrders: number
  avgOrderValue: number
  marketShare: number
  categoryDiversity: number
  orderFrequency: number
  growthRate: number
  loyaltyScore: number
  tier: "Platinum" | "Gold" | "Silver" | "Bronze"
  firstOrder: Date
  lastOrder: Date
  categories: Set<string>
  categoryBreakdown: Record<string, { sales: number; orders: number }>
  monthlyData: Record<string, { month: string; sales: number; orders: number }>
  monthlyTrend: Array<{ month: string; sales: number; orders: number }>
  recentActivityCount: number
  percentile?: number
  name?: string
}

/**
 * Standardized Product Analytics
 */
export interface ProductAnalytics {
  productName: string
  totalSales: number
  totalOrders: number
  avgOrderValue: number
  marketShare: number
  category: string
  growthRate: number
  popularityScore: number
  monthlyTrend: Array<{ month: string; sales: number; orders: number }>
}

/**
 * Standardized Category Analytics
 */
export interface CategoryAnalytics {
  categoryName: string
  totalSales: number
  totalOrders: number
  avgOrderValue: number
  marketShare: number
  growthRate: number
  dealerCount: number
  monthlyTrend: Array<{ month: string; sales: number; orders: number }>
}

/**
 * Calculate dealer analytics with standardized formulas
 */
export function calculateDealerAnalytics(data: ProcessedData[]): DealerAnalytics[] {
  if (!data.length) return []

  // Group data by dealer
  const dealerMap: Record<string, ProcessedData[]> = {}
  
  data.forEach(item => {
    const dealerName = item["Customer Name"]
    if (!dealerName) return
    
    if (!dealerMap[dealerName]) {
      dealerMap[dealerName] = []
    }
    
    dealerMap[dealerName].push(item)
  })

  // Calculate total sales for market share
  const totalSales = data.reduce((sum, item) => sum + item.itemTotal, 0)

  // Process each dealer
  return Object.entries(dealerMap).map(([dealerName, items]) => {
    // Basic metrics
    const totalSales = items.reduce((sum, item) => sum + item.itemTotal, 0)
    const totalOrders = new Set(items.map(item => item["Delivery Challan Number"])).size
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
    const marketShare = totalSales > 0 ? (totalSales / data.reduce((sum, item) => sum + item.itemTotal, 0)) * 100 : 0

    // Category analysis
    const categories = new Set(items.map(item => item.category))
    const categoryDiversity = categories.size
    const categoryBreakdown: Record<string, { sales: number; orders: number }> = {}
    
    items.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { sales: 0, orders: 0 }
      }
      categoryBreakdown[item.category].sales += item.itemTotal
      categoryBreakdown[item.category].orders += 1
    })

    // Time analysis
    const months = new Set(items.map(item => `${item.year}-${item.monthNum.toString().padStart(2, "0")}`))
    const orderFrequency = months.size > 0 ? totalOrders / months.size : 0
    
    const monthlyData: Record<string, { month: string; sales: number; orders: number }> = {}
    items.forEach(item => {
      const monthKey = `${item.year}-${item.monthNum.toString().padStart(2, "0")}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: item.month, sales: 0, orders: 0 }
      }
      monthlyData[monthKey].sales += item.itemTotal
      monthlyData[monthKey].orders += 1
    })

    // Date range - with proper date validation
    const validDates = items
      .map(item => {
        let date: Date
        if (item.challanDate instanceof Date) {
          date = item.challanDate
        } else if (typeof item.challanDate === 'string') {
          date = new Date(item.challanDate)
        } else {
          date = new Date()
        }
        return isNaN(date.getTime()) ? new Date() : date
      })
      .filter(date => !isNaN(date.getTime()))
    
    const firstOrder = validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : new Date()
    const lastOrder = validDates.length > 0 ? new Date(Math.max(...validDates.map(d => d.getTime()))) : new Date()

    // Growth rate calculation (last 3 months vs previous 3 months)
    const monthlyEntries = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b))
    const recentMonths = monthlyEntries.slice(-3)
    const previousMonths = monthlyEntries.slice(-6, -3)

    const recentSales = recentMonths.reduce((sum, [, data]) => sum + data.sales, 0)
    const previousSales = previousMonths.reduce((sum, [, data]) => sum + data.sales, 0)
    const growthRate = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0

    // Standardized loyalty score calculation
    const daysSinceFirst = Math.max(1, Math.floor((lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24)))
    const loyaltyScore = Math.min(100, Math.max(0,
      (totalOrders * 2) +           // Order volume (max 200 points for 100 orders)
      (categoryDiversity * 5) +     // Category diversity (max 30 points for 6 categories)
      (orderFrequency * 3) +        // Order frequency (max 30 points for 10 orders/month)
      Math.min(daysSinceFirst / 30, 20)  // Time loyalty (max 20 points for 600 days)
    ))

    // Standardized tier calculation using centralized function
    const tier = getTier(marketShare, loyaltyScore)

    // Calculate recent activity count (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentActivityCount = items.filter(item => {
      let date: Date
      if (item.challanDate instanceof Date) {
        date = item.challanDate
      } else if (typeof item.challanDate === 'string') {
        date = new Date(item.challanDate)
      } else {
        return false
      }
      return !isNaN(date.getTime()) && date >= thirtyDaysAgo
    }).length

    // Monthly trend for charts
    const monthlyTrend = monthlyEntries.map(([key, data]) => ({
      month: data.month,
      sales: data.sales,
      orders: data.orders,
    }))

    return {
      dealerName,
      totalSales,
      totalOrders,
      avgOrderValue,
      marketShare,
      categoryDiversity,
      orderFrequency,
      growthRate,
      loyaltyScore: Math.round(loyaltyScore),
      tier,
      firstOrder,
      lastOrder,
      categories,
      categoryBreakdown,
      monthlyData,
      monthlyTrend,
      recentActivityCount,
    }
  }).sort((a, b) => b.totalSales - a.totalSales)
}

/**
 * Calculate product analytics with standardized formulas
 */
export function calculateProductAnalytics(data: ProcessedData[]): ProductAnalytics[] {
  if (!data.length) return []

  // Group data by product
  const productMap: Record<string, ProcessedData[]> = {}
  
  data.forEach(item => {
    const productName = item["Item Name"]
    if (!productName) return
    
    if (!productMap[productName]) {
      productMap[productName] = []
    }
    
    productMap[productName].push(item)
  })

  const totalSales = data.reduce((sum, item) => sum + item.itemTotal, 0)

  return Object.entries(productMap).map(([productName, items]) => {
    const totalSales = items.reduce((sum, item) => sum + item.itemTotal, 0)
    const totalOrders = new Set(items.map(item => item["Delivery Challan Number"])).size
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
    const marketShare = (totalSales / totalSales) * 100
    const category = items[0]?.category || "Unknown"

    // Growth rate calculation
    const monthlyData: Record<string, { month: string; sales: number; orders: number }> = {}
    items.forEach(item => {
      const monthKey = `${item.year}-${item.monthNum.toString().padStart(2, "0")}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: item.month, sales: 0, orders: 0 }
      }
      monthlyData[monthKey].sales += item.itemTotal
      monthlyData[monthKey].orders += 1
    })

    const monthlyEntries = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b))
    const recentMonths = monthlyEntries.slice(-3)
    const previousMonths = monthlyEntries.slice(-6, -3)

    const recentSales = recentMonths.reduce((sum, [, data]) => sum + data.sales, 0)
    const previousSales = previousMonths.reduce((sum, [, data]) => sum + data.sales, 0)
    const growthRate = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0

    // Popularity score (standardized)
    const popularityScore = Math.min(100, Math.max(0,
      (totalOrders * 3) +           // Order frequency
      (totalSales / 10000) +        // Sales volume
      (growthRate + 50)             // Growth factor
    ))

    const monthlyTrend = monthlyEntries.map(([key, data]) => ({
      month: data.month,
      sales: data.sales,
      orders: data.orders,
    }))

    return {
      productName,
      totalSales,
      totalOrders,
      avgOrderValue,
      marketShare,
      category,
      growthRate,
      popularityScore: Math.round(popularityScore),
      monthlyTrend,
    }
  }).sort((a, b) => b.totalSales - a.totalSales)
}

/**
 * Calculate category analytics with standardized formulas
 */
export function calculateCategoryAnalytics(data: ProcessedData[]): CategoryAnalytics[] {
  if (!data.length) return []

  // Group data by category
  const categoryMap: Record<string, ProcessedData[]> = {}
  
  data.forEach(item => {
    const categoryName = item.category
    if (!categoryName) return
    
    if (!categoryMap[categoryName]) {
      categoryMap[categoryName] = []
    }
    
    categoryMap[categoryName].push(item)
  })

  const totalSales = data.reduce((sum, item) => sum + item.itemTotal, 0)

  return Object.entries(categoryMap).map(([categoryName, items]) => {
    const totalSales = items.reduce((sum, item) => sum + item.itemTotal, 0)
    const totalOrders = new Set(items.map(item => item["Delivery Challan Number"])).size
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
    const marketShare = (totalSales / totalSales) * 100
    const dealerCount = new Set(items.map(item => item["Customer Name"])).size

    // Growth rate calculation
    const monthlyData: Record<string, { month: string; sales: number; orders: number }> = {}
    items.forEach(item => {
      const monthKey = `${item.year}-${item.monthNum.toString().padStart(2, "0")}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: item.month, sales: 0, orders: 0 }
      }
      monthlyData[monthKey].sales += item.itemTotal
      monthlyData[monthKey].orders += 1
    })

    const monthlyEntries = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b))
    const recentMonths = monthlyEntries.slice(-3)
    const previousMonths = monthlyEntries.slice(-6, -3)

    const recentSales = recentMonths.reduce((sum, [, data]) => sum + data.sales, 0)
    const previousSales = previousMonths.reduce((sum, [, data]) => sum + data.sales, 0)
    const growthRate = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0

    const monthlyTrend = monthlyEntries.map(([key, data]) => ({
      month: data.month,
      sales: data.sales,
      orders: data.orders,
    }))

    return {
      categoryName,
      totalSales,
      totalOrders,
      avgOrderValue,
      marketShare,
      growthRate,
      dealerCount,
      monthlyTrend,
    }
  }).sort((a, b) => b.totalSales - a.totalSales)
}

/**
 * Standardized formatting functions
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatCurrencyShort(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`
  } else {
    return formatCurrency(value)
  }
}

/**
 * Standardized tier thresholds
 * These thresholds are based on actual data analysis and business requirements
 */
export const TIER_THRESHOLDS = {
  PLATINUM: { marketShare: 2, loyaltyScore: 50 },
  GOLD: { marketShare: 1, loyaltyScore: 35 },
  SILVER: { marketShare: 0.3, loyaltyScore: 20 },
} as const

/**
 * Standardized loyalty score thresholds
 * Based on actual dealer performance patterns
 */
export const LOYALTY_THRESHOLDS = {
  HIGH: 40,
  MEDIUM: 25,
  LOW: 10,
} as const

/**
 * Get tier based on standardized thresholds
 */
export function getTier(marketShare: number, loyaltyScore: number): "Platinum" | "Gold" | "Silver" | "Bronze" {
  if (marketShare > TIER_THRESHOLDS.PLATINUM.marketShare && loyaltyScore > TIER_THRESHOLDS.PLATINUM.loyaltyScore) {
    return "Platinum"
  } else if (marketShare > TIER_THRESHOLDS.GOLD.marketShare && loyaltyScore > TIER_THRESHOLDS.GOLD.loyaltyScore) {
    return "Gold"
  } else if (marketShare > TIER_THRESHOLDS.SILVER.marketShare || loyaltyScore > TIER_THRESHOLDS.SILVER.loyaltyScore) {
    return "Silver"
  } else {
    return "Bronze"
  }
}

/**
 * Get loyalty level based on standardized thresholds
 */
export function getLoyaltyLevel(loyaltyScore: number): "High" | "Medium" | "Low" {
  if (loyaltyScore >= LOYALTY_THRESHOLDS.HIGH) return "High"
  if (loyaltyScore >= LOYALTY_THRESHOLDS.MEDIUM) return "Medium"
  return "Low"
}

/**
 * Calculate overall statistics
 */
export function calculateOverallStats(data: ProcessedData[]) {
  if (!data.length) {
    return {
      totalSales: 0,
      totalOrders: 0,
      totalCustomers: 0,
      avgOrderValue: 0,
      topCategory: "",
      growthRate: 0,
    }
  }

  const totalSales = data.reduce((sum, item) => sum + item.itemTotal, 0)
  const totalOrders = new Set(data.map(item => item["Delivery Challan Number"])).size
  const totalCustomers = new Set(data.map(item => item["Customer Name"])).size
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  // Category analysis
  const categoryTotals = data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.itemTotal
    return acc
  }, {} as Record<string, number>)

  const topCategory = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || ""

  // Growth rate calculation
  const currentYear = new Date().getFullYear()
  const currentYearData = data.filter(item => item.year === currentYear)
  const previousYearData = data.filter(item => item.year === currentYear - 1)

  const currentYearSales = currentYearData.reduce((sum, item) => sum + item.itemTotal, 0)
  const previousYearSales = previousYearData.reduce((sum, item) => sum + item.itemTotal, 0)

  const growthRate = previousYearSales > 0 ? ((currentYearSales - previousYearSales) / previousYearSales) * 100 : 0

  return {
    totalSales,
    totalOrders,
    totalCustomers,
    avgOrderValue,
    topCategory,
    growthRate,
  }
}
