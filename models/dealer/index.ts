/**
 * Dealer Analytics Models and Utilities
 * 
 * This file contains dealer-specific data models and utilities that work with
 * the centralized analytics system.
 */

import { ProcessedData } from "@/models"
import { calculateDealerAnalytics, DealerAnalytics } from "@/lib/analytics-utils"

/**
 * Legacy function - now uses centralized analytics
 * @deprecated Use calculateDealerAnalytics from @/lib/analytics-utils instead
 */
export function calculateDealerMetrics(data: ProcessedData[]) {
  console.warn('calculateDealerMetrics is deprecated. Use calculateDealerAnalytics from @/lib/analytics-utils instead.')
  return calculateDealerAnalytics(data)
}

/**
 * Generate dealer rankings with additional metadata
 */
export function generateDealerRankings(dealerAnalytics: DealerAnalytics[], data: ProcessedData[]) {
  if (!dealerAnalytics.length) return []

  // Create a map for last order dates
  const lastOrderMap: Record<string, Date> = {}

  // Calculate last order date for each dealer
  data.forEach(item => {
    const dealerName = item["Customer Name"]
    if (!dealerName || !item.challanDate) return
    
    // Ensure challanDate is a proper Date object
    let itemDate: Date
    if (item.challanDate instanceof Date) {
      itemDate = item.challanDate
    } else {
      try {
        itemDate = new Date(item.challanDate)
        if (isNaN(itemDate.getTime())) {
          return // Skip invalid dates
        }
      } catch (e) {
        return // Skip if date parsing fails
      }
    }
    
    if (!lastOrderMap[dealerName] || itemDate > lastOrderMap[dealerName]) {
      lastOrderMap[dealerName] = itemDate
    }
  })

  // Generate rankings with additional metadata
  return dealerAnalytics.map((dealer, index) => {
    // Format last order date - ensure it's a proper Date object
    let lastOrderDate = 'N/A'
    const lastOrderDateObj = lastOrderMap[dealer.dealerName]
    
    if (lastOrderDateObj && lastOrderDateObj instanceof Date && !isNaN(lastOrderDateObj.getTime())) {
      try {
        lastOrderDate = lastOrderDateObj.toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })
      } catch (e) {
        console.warn('Error formatting date for dealer:', dealer.dealerName, e)
        lastOrderDate = 'N/A'
      }
    }

    return {
      id: `${dealer.dealerName}-${index}`,
      rank: index + 1,
      dealer: dealer.dealerName,
      totalSales: dealer.totalSales,
      orderCount: dealer.totalOrders,
      avgOrderValue: dealer.avgOrderValue,
      marketShare: dealer.marketShare,
      loyaltyScore: dealer.loyaltyScore,
      growthRate: dealer.growthRate,
      tier: dealer.tier,
      categoryDiversity: dealer.categoryDiversity,
      orderFrequency: dealer.orderFrequency,
      lastOrder: lastOrderDate,
      topCategory: Object.entries(dealer.categoryBreakdown)
        .sort(([, a], [, b]) => b.sales - a.sales)[0]?.[0] || 'N/A',
      growth: dealer.growthRate, // Legacy field for backward compatibility
    }
  })
}

/**
 * Get dealer performance summary
 */
export function getDealerPerformanceSummary(dealerAnalytics: DealerAnalytics[]) {
  if (!dealerAnalytics.length) {
    return {
      totalDealers: 0,
      totalSales: 0,
      avgLoyaltyScore: 0,
      topPerformer: null,
      tierDistribution: {},
      growthLeaders: [],
      loyaltyLeaders: [],
    }
  }

  const totalDealers = dealerAnalytics.length
  const totalSales = dealerAnalytics.reduce((sum, dealer) => sum + dealer.totalSales, 0)
  const avgLoyaltyScore = Math.round(dealerAnalytics.reduce((sum, dealer) => sum + dealer.loyaltyScore, 0) / totalDealers)
  const topPerformer = dealerAnalytics[0]

  // Tier distribution
  const tierDistribution = dealerAnalytics.reduce((acc, dealer) => {
    acc[dealer.tier] = (acc[dealer.tier] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Growth leaders (top 5)
  const growthLeaders = [...dealerAnalytics]
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 5)

  // Loyalty leaders (top 5)
  const loyaltyLeaders = [...dealerAnalytics]
    .sort((a, b) => b.loyaltyScore - a.loyaltyScore)
    .slice(0, 5)

  return {
    totalDealers,
    totalSales,
    avgLoyaltyScore,
    topPerformer,
    tierDistribution,
    growthLeaders,
    loyaltyLeaders,
  }
}

/**
 * Filter dealers by criteria
 */
export function filterDealers(
  dealerAnalytics: DealerAnalytics[],
  filters: {
    tier?: string
    minLoyaltyScore?: number
    minMarketShare?: number
    searchTerm?: string
  }
) {
  return dealerAnalytics.filter(dealer => {
    if (filters.tier && dealer.tier !== filters.tier) return false
    if (filters.minLoyaltyScore && dealer.loyaltyScore < filters.minLoyaltyScore) return false
    if (filters.minMarketShare && dealer.marketShare < filters.minMarketShare) return false
    if (filters.searchTerm && !dealer.dealerName.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false
    return true
  })
}

/**
 * Get dealer insights and recommendations
 */
export function getDealerInsights(dealerAnalytics: DealerAnalytics[]) {
  if (!dealerAnalytics.length) return []

  return dealerAnalytics.map(dealer => {
    const insights = []

    // Growth insights
    if (dealer.growthRate > 20) {
      insights.push({
        type: 'positive',
        category: 'growth',
        message: `Strong growth of ${dealer.growthRate.toFixed(1)}% - consider expanding relationship`
      })
    } else if (dealer.growthRate < -10) {
      insights.push({
        type: 'warning',
        category: 'growth',
        message: `Declining growth of ${dealer.growthRate.toFixed(1)}% - needs attention`
      })
    }

    // Loyalty insights
    if (dealer.loyaltyScore >= 70) {
      insights.push({
        type: 'positive',
        category: 'loyalty',
        message: `High loyalty score of ${dealer.loyaltyScore} - excellent relationship`
      })
    } else if (dealer.loyaltyScore < 30) {
      insights.push({
        type: 'warning',
        category: 'loyalty',
        message: `Low loyalty score of ${dealer.loyaltyScore} - needs engagement`
      })
    }

    // Market share insights
    if (dealer.marketShare > 5) {
      insights.push({
        type: 'positive',
        category: 'market',
        message: `High market share of ${dealer.marketShare.toFixed(2)}% - key account`
      })
    }

    // Category diversity insights
    if (dealer.categoryDiversity >= 5) {
      insights.push({
        type: 'positive',
        category: 'diversity',
        message: `Diverse portfolio with ${dealer.categoryDiversity} categories`
      })
    } else if (dealer.categoryDiversity <= 2) {
      insights.push({
        type: 'info',
        category: 'diversity',
        message: `Limited to ${dealer.categoryDiversity} categories - opportunity for expansion`
      })
    }

    return {
      dealerName: dealer.dealerName,
      insights
    }
  })
}
