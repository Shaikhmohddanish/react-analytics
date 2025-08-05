/**
 * Models for Product Sales Trends
 */

import { ProcessedData } from "@/models";

/**
 * Product metrics model
 */
export interface ProductMetrics {
  productName: string;
  category: string;
  totalSales: number;
  units: number;
  avgPrice: number;
  monthlySales: Record<string, number>;
  customerTypes: Record<string, number>;
}

/**
 * Product chart types
 */
export type ProductChartType =
  | "monthlySales"
  | "categoryDistribution"
  | "customerTypeSplit";

/**
 * Calculate product metrics from processed data
 * @param data The processed delivery data
 * @returns Array of product metrics
 */
export function calculateProductMetrics(data: ProcessedData[]): ProductMetrics[] {
  if (!data.length) return [];
  
  // Group data by product
  const productMap = new Map<string, ProductMetrics>();
  
  data.forEach(item => {
    if (!item.product || !item.amount) return;
    
    const productName = String(item.product);
    const category = item.category ? String(item.category) : 'Uncategorized';
    const customerType = item.customerType ? String(item.customerType) : 'Unknown';
    const amount = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount));
    const quantity = item.quantity ? (typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity))) : 0;
    
    // Create product if not exists
    if (!productMap.has(productName)) {
      productMap.set(productName, {
        productName,
        category,
        totalSales: 0,
        units: 0,
        avgPrice: 0,
        monthlySales: {},
        customerTypes: {}
      });
    }
    
    const productData = productMap.get(productName)!;
    
    // Add sales data
    productData.totalSales += amount;
    productData.units += quantity;
    
    // Add monthly sales
    if (item.date) {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      productData.monthlySales[monthKey] = (
        productData.monthlySales[monthKey] || 0
      ) + amount;
    }
    
    // Add customer type sales
    productData.customerTypes[customerType] = (
      productData.customerTypes[customerType] || 0
    ) + amount;
  });
  
  // Calculate average price
  productMap.forEach(product => {
    product.avgPrice = product.units > 0 
      ? product.totalSales / product.units 
      : 0;
  });
  
  return Array.from(productMap.values());
}

/**
 * Format currency amount
 * @param amount Number amount to format
 * @returns Formatted string with currency symbol
 */
export function formatProductCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format number with commas
 * @param value Number to format
 * @returns Formatted string with commas
 */
export function formatProductNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}
