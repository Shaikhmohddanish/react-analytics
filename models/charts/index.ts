/**
 * Models and interfaces for chart components
 * This file centralizes all chart-related types, interfaces, and utility functions
 */

import { ProcessedData } from "@/lib/data-processing";

/**
 * Common chart view modes
 */
export type ViewMode = "monthly" | "category" | "dealer";

/**
 * Monthly Breakdown Chart Props
 */
export interface MonthlyBreakdownChartProps {
  className?: string;
  height?: number;
}

/**
 * Category data model for the chart
 */
export interface CategoryData {
  category: string;
  total: number;
}

/**
 * Monthly data model for the chart
 */
export interface MonthlyData {
  month: string;
  total: number;
  [category: string]: number | string;
}

/**
 * Dealer data model for the chart
 */
export interface DealerData {
  dealer: string;
  total: number;
  [category: string]: number | string;
}

/**
 * Category colors for visualization consistency
 */
export const categoryColors: Record<string, string> = {
  "Bio-Fertilizers": "#1f77b4",
  "Micronutrients": "#ff7f0e",
  "Chelated Micronutrients": "#2ca02c",
  "Bio-Stimulants": "#d62728",
  "Other Bulk Orders": "#9467bd",
  "Uncategorized": "#8c564b",
};

/**
 * Custom tooltip props for chart components
 */
export interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

/**
 * Format currency for display (Indian format)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number with commas (Indian format)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

/**
 * Extract unique years from processed data
 */
export function getUniqueYears(data: ProcessedData[]): number[] {
  const years = new Set<number>();
  data.forEach((item) => {
    if (item.year) {
      years.add(item.year);
    }
  });
  return Array.from(years).sort((a, b) => a - b);
}

/**
 * Filter data by year
 */
export function filterDataByYear(data: ProcessedData[], year: number): ProcessedData[] {
  return data.filter((item) => item.year === year);
}

/**
 * Get abbreviated month names
 */
export function getMonthNames(): string[] {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
}

/**
 * Get default chart margins
 */
export function getDefaultChartMargins() {
  return { top: 20, right: 30, left: 20, bottom: 60 };
}

/**
 * Generate select options for year dropdown
 */
export function generateYearOptions(data: ProcessedData[]): { label: string, value: number }[] {
  if (!data.length) return [];
  
  // Extract all years from the data
  const years = [...new Set(data.map(item => item.year))].sort((a, b) => b - a);
  
  // Format as options
  return years.map(year => ({
    label: year.toString(),
    value: year
  }));
}
