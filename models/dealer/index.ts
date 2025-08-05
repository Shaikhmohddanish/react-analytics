/**
 * Models for Dealer Performance Dashboard
 */

import { ProcessedData } from "@/models";

/**
 * Dealer performance metrics
 */
export interface DealerMetrics {
  dealerName: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  topCategory: string;
  topCategorySales: number;
  monthlySales: Record<string, number>;
  categorySales: Record<string, number>;
  performance?: {
    month: string;
    sales: number;
  }[];
  year: number;
}

/**
 * Dealer ranking table entry
 */
export interface DealerRankingEntry {
  id: string;
  rank: number;
  dealer: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  topCategory: string;
  lastOrder: string;
  growth: number;
}

/**
 * Dealer type filter options
 */
export type DealerType = "all" | "highVolume" | "midVolume" | "lowVolume";

/**
 * Chart types for dealer performance
 */
export type DealerChartType = 
  | "topDealers" 
  | "categoryDistribution" 
  | "monthlyTrends" 
  | "weeklyTrends" 
  | "categoryByDealer";

/**
 * Calculate dealer metrics from processed data
 */
export function calculateDealerMetrics(data: ProcessedData[]): DealerMetrics[] {
  if (!data.length) return [];

  // Group data by dealer
  const dealerMap: Record<string, ProcessedData[]> = {};
  
  data.forEach(item => {
    const dealerName = item["Customer Name"];
    if (!dealerName) return;
    
    if (!dealerMap[dealerName]) {
      dealerMap[dealerName] = [];
    }
    
    dealerMap[dealerName].push(item);
  });
  
  // Calculate metrics for each dealer
  return Object.entries(dealerMap).map(([dealerName, items]) => {
    // Calculate total sales
    const totalSales = items.reduce((sum, item) => {
      const amount = typeof item.totalAmount === 'number' ? item.totalAmount : 
                    typeof item.itemTotal === 'number' ? item.itemTotal : 0;
      return sum + amount;
    }, 0);
    
    // Count unique orders
    const uniqueOrders = new Set(items.map(item => item["Delivery Challan Number"])).size;
    
    // Calculate average order value
    const avgOrderValue = uniqueOrders > 0 ? totalSales / uniqueOrders : 0;
    
    // Calculate sales by category
    const categorySales: Record<string, number> = {};
    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      const amount = typeof item.totalAmount === 'number' ? item.totalAmount : 
                    typeof item.itemTotal === 'number' ? item.itemTotal : 0;
      categorySales[category] = (categorySales[category] || 0) + amount;
    });
    
    // Find top category
    let topCategory = 'Uncategorized';
    let topCategorySales = 0;
    
    Object.entries(categorySales).forEach(([category, sales]) => {
      if (sales > topCategorySales) {
        topCategory = category;
        topCategorySales = sales;
      }
    });
    
    // Calculate monthly sales
    const monthlySales: Record<string, number> = {};
    items.forEach(item => {
      const month = item.month || 'Unknown';
      const amount = typeof item.totalAmount === 'number' ? item.totalAmount : 
                    typeof item.itemTotal === 'number' ? item.itemTotal : 0;
      monthlySales[month] = (monthlySales[month] || 0) + amount;
    });
    
    // Performance over time
    const performance = Object.entries(monthlySales)
      .map(([month, sales]) => ({ month, sales }))
      .sort((a, b) => {
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
      });
    
    // Get the most common year
    const yearCounts: Record<number, number> = {};
    items.forEach(item => {
      if (item.year) {
        yearCounts[item.year] = (yearCounts[item.year] || 0) + 1;
      }
    });
    
    const year = Object.entries(yearCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || new Date().getFullYear();
    
    return {
      dealerName,
      totalSales,
      orderCount: uniqueOrders,
      avgOrderValue,
      topCategory,
      topCategorySales,
      monthlySales,
      categorySales,
      performance,
      year: Number(year),
    };
  }).sort((a, b) => b.totalSales - a.totalSales);
}

/**
 * Generate dealer ranking data
 */
export function generateDealerRankings(metrics: DealerMetrics[], data: ProcessedData[]): DealerRankingEntry[] {
  if (!metrics.length) return [];
  
  // Create a map of last order dates
  const lastOrderMap: Record<string, Date> = {};
  
  data.forEach(item => {
    const dealerName = item["Customer Name"];
    if (!dealerName || !item.challanDate) return;
    
    if (!lastOrderMap[dealerName] || item.challanDate > lastOrderMap[dealerName]) {
      lastOrderMap[dealerName] = item.challanDate;
    }
  });
  
  // Get the previous year for growth calculation
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  
  // Group data by dealer and year for growth calculation
  const dealerYearMap: Record<string, Record<number, number>> = {};
  
  data.forEach(item => {
    const dealerName = item["Customer Name"];
    if (!dealerName || !item.year) return;
    
    if (!dealerYearMap[dealerName]) {
      dealerYearMap[dealerName] = {};
    }
    
    const year = item.year;
    const amount = typeof item.totalAmount === 'number' ? item.totalAmount : 
                  typeof item.itemTotal === 'number' ? item.itemTotal : 0;
    dealerYearMap[dealerName][year] = (dealerYearMap[dealerName][year] || 0) + amount;
  });
  
  // Generate rankings
  return metrics.map((dealer, index) => {
    // Calculate growth rate
    const currentYearSales = dealerYearMap[dealer.dealerName]?.[currentYear] || 0;
    const previousYearSales = dealerYearMap[dealer.dealerName]?.[previousYear] || 0;
    
    const growth = previousYearSales > 0 
      ? ((currentYearSales - previousYearSales) / previousYearSales) * 100 
      : 0;
    
    // Format last order date
    const lastOrderDate = lastOrderMap[dealer.dealerName] 
      ? lastOrderMap[dealer.dealerName].toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
      : 'N/A';
    
    return {
      id: `dealer-${index}`,
      rank: index + 1,
      dealer: dealer.dealerName,
      totalSales: dealer.totalSales,
      orderCount: dealer.orderCount,
      avgOrderValue: dealer.avgOrderValue,
      topCategory: dealer.topCategory,
      lastOrder: lastOrderDate,
      growth,
    };
  });
}

/**
 * Get dealer types based on sales volume
 */
export function getDealerType(dealer: DealerMetrics, allDealers: DealerMetrics[]): DealerType {
  // Sort dealers by total sales
  const sortedDealers = [...allDealers].sort((a, b) => b.totalSales - a.totalSales);
  
  // Determine thresholds for high, mid, and low volume
  const totalDealers = sortedDealers.length;
  const highVolumeThreshold = Math.floor(totalDealers * 0.2); // Top 20%
  const midVolumeThreshold = Math.floor(totalDealers * 0.6); // Top 60%
  
  // Find the index of the current dealer
  const dealerIndex = sortedDealers.findIndex(d => d.dealerName === dealer.dealerName);
  
  if (dealerIndex < highVolumeThreshold) {
    return "highVolume";
  } else if (dealerIndex < midVolumeThreshold) {
    return "midVolume";
  } else {
    return "lowVolume";
  }
}

/**
 * Filter dealers by type
 */
export function filterDealersByType(
  dealers: DealerMetrics[], 
  dealerType: DealerType
): DealerMetrics[] {
  if (dealerType === "all") {
    return dealers;
  }
  
  return dealers.filter(dealer => getDealerType(dealer, dealers) === dealerType);
}

/**
 * Format currency (INR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format number with K, M, B suffixes
 */
export function formatNumber(value: number): string {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B';
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  } else {
    return value.toFixed(0);
  }
}
