# Analytics Standardization Documentation

## Overview

This document outlines the comprehensive analytics standardization implemented across the delivery analytics dashboard to ensure consistency in all calculations, metrics, and scoring throughout the application.

## 🎯 **Centralized Analytics System**

### Core File: `lib/analytics-utils.ts`

All analytics calculations are now centralized in this single file, ensuring:

- **Consistent Formulas**: Same calculations used everywhere
- **Standardized Thresholds**: Unified tier and loyalty score criteria
- **Reusable Functions**: No code duplication across components
- **Type Safety**: Strong TypeScript interfaces for all analytics data

## 📊 **Standardized Calculations**

### 1. **Loyalty Score Formula**
```typescript
const loyaltyScore = Math.min(100, Math.max(0,
  (totalOrders * 2) +           // Order volume (max 200 points for 100 orders)
  (categoryDiversity * 5) +     // Category diversity (max 30 points for 6 categories)
  (orderFrequency * 3) +        // Order frequency (max 30 points for 10 orders/month)
  Math.min(daysSinceFirst / 30, 20)  // Time loyalty (max 20 points for 600 days)
))
```

**Used in**: Dealer Dashboard, Dealer Performance, Dealer Analytics, All Charts

### 2. **Tier Classification**
```typescript
// Standardized tier thresholds
export const TIER_THRESHOLDS = {
  PLATINUM: { marketShare: 3, loyaltyScore: 60 },
  GOLD: { marketShare: 1.5, loyaltyScore: 40 },
  SILVER: { marketShare: 0.5, loyaltyScore: 25 },
}

// Tier assignment logic
if (marketShare > 3 && loyaltyScore > 60) tier = "Platinum"
else if (marketShare > 1.5 && loyaltyScore > 40) tier = "Gold"
else if (marketShare > 0.5 || loyaltyScore > 25) tier = "Silver"
else tier = "Bronze"
```

**Used in**: All dealer-related components and displays

### 3. **Growth Rate Calculation**
```typescript
// Last 3 months vs previous 3 months
const recentMonths = monthlyEntries.slice(-3)
const previousMonths = monthlyEntries.slice(-6, -3)
const recentSales = recentMonths.reduce((sum, [, data]) => sum + data.sales, 0)
const previousSales = previousMonths.reduce((sum, [, data]) => sum + data.sales, 0)
const growthRate = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0
```

**Used in**: Performance metrics, rankings, and trend analysis

### 4. **Market Share Calculation**
```typescript
const marketShare = (dealerTotalSales / totalSystemSales) * 100
```

**Used in**: All dealer performance displays and comparisons

## 🎨 **Standardized Formatting**

### Currency Formatting
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
```

### Percentage Formatting
```typescript
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
```

### Short Currency Formatting
```typescript
export function formatCurrencyShort(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
  else if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  else if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  else return formatCurrency(value)
}
```

## 📈 **Analytics Interfaces**

### DealerAnalytics Interface
```typescript
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
}
```

### ProductAnalytics Interface
```typescript
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
```

### CategoryAnalytics Interface
```typescript
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
```

## 🔧 **Updated Components**

### 1. **Dealer Dashboard** (`app/dealer-dashboard/page.tsx`)
- ✅ Uses `calculateDealerAnalytics()` for all calculations
- ✅ Standardized loyalty score and tier display
- ✅ Consistent formatting with `formatCurrency()`, `formatPercentage()`
- ✅ Fixed NaN issues and proper error handling

### 2. **Dealer Performance** (`app/dealer-performance/page.tsx`)
- ✅ Centralized analytics calculation
- ✅ Updated component imports to use standardized data
- ✅ Consistent metrics display across all tabs

### 3. **Dealer Performance Components**
- ✅ **Metrics Component**: Uses standardized calculations and formatting
- ✅ **Ranking Table**: Consistent sorting and filtering with standardized data
- ✅ **Charts Component**: Unified chart data preparation

### 4. **Dealer Analytics Charts** (`app/dealer-analytics/chart-optimized.tsx`)
- ✅ Uses centralized analytics for all chart data
- ✅ Consistent bar chart formatting with dealer labels
- ✅ Standardized tier distribution and growth analysis

### 5. **Dealer Models** (`models/dealer/index.ts`)
- ✅ Updated to use centralized analytics utilities
- ✅ Legacy functions marked as deprecated
- ✅ Enhanced ranking generation with proper date handling

## 🎯 **Standardized Thresholds**

### Loyalty Score Levels
```typescript
export const LOYALTY_THRESHOLDS = {
  HIGH: 50,    // Used for "high loyalty" classification
  MEDIUM: 30,  // Medium loyalty threshold
  LOW: 15,     // Low loyalty threshold
}
```

### Tier Requirements
```typescript
export const TIER_THRESHOLDS = {
  PLATINUM: { marketShare: 3, loyaltyScore: 60 },
  GOLD: { marketShare: 1.5, loyaltyScore: 40 },
  SILVER: { marketShare: 0.5, loyaltyScore: 25 },
}
```

## 🔄 **Migration Benefits**

### Before Standardization
- ❌ Inconsistent loyalty score calculations across components
- ❌ Different tier thresholds in different places
- ❌ Duplicate formatting functions
- ❌ NaN values and calculation errors
- ❌ Inconsistent growth rate calculations

### After Standardization
- ✅ **Single Source of Truth**: All calculations in one place
- ✅ **Consistent Results**: Same formulas used everywhere
- ✅ **Type Safety**: Strong TypeScript interfaces
- ✅ **Maintainable**: Easy to update formulas across the entire app
- ✅ **Reliable**: Proper error handling and validation
- ✅ **Performance**: Optimized calculations with memoization

## 🚀 **Usage Examples**

### Basic Analytics Calculation
```typescript
import { calculateDealerAnalytics } from '@/lib/analytics-utils'

const dealerAnalytics = calculateDealerAnalytics(filteredData)
```

### Formatting Data
```typescript
import { formatCurrency, formatPercentage } from '@/lib/analytics-utils'

const formattedSales = formatCurrency(dealer.totalSales)
const formattedShare = formatPercentage(dealer.marketShare)
```

### Getting Tier Information
```typescript
import { getTier, getLoyaltyLevel } from '@/lib/analytics-utils'

const tier = getTier(dealer.marketShare, dealer.loyaltyScore)
const loyaltyLevel = getLoyaltyLevel(dealer.loyaltyScore)
```

## 📋 **Implementation Checklist**

- [x] Created centralized analytics utilities
- [x] Standardized loyalty score calculation
- [x] Unified tier classification system
- [x] Consistent growth rate calculation
- [x] Standardized formatting functions
- [x] Updated all dealer-related components
- [x] Fixed NaN and calculation errors
- [x] Added proper TypeScript interfaces
- [x] Implemented error handling
- [x] Added performance optimizations
- [x] Created comprehensive documentation

## 🔮 **Future Enhancements**

1. **Caching**: Implement analytics result caching for better performance
2. **Real-time Updates**: Add real-time analytics updates
3. **Advanced Metrics**: Add more sophisticated performance indicators
4. **Export Functionality**: Standardized data export with consistent formatting
5. **Analytics API**: Create REST API endpoints for analytics data

## 📞 **Support**

For questions about the analytics standardization or to request changes to formulas, please refer to the `lib/analytics-utils.ts` file as the single source of truth for all analytics calculations.
