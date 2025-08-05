"use client"

import React, { useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProcessedData } from "@/models"
import { formatCurrency } from "@/models/dealer"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ProductTrendsChartProps {
  data: ProcessedData[]
  selectedCategory: string
  selectedCustomerType: string
  height?: number
}

export default function ProductTrendsChart({
  data,
  selectedCategory,
  selectedCustomerType,
  height = 400
}: ProductTrendsChartProps) {
  const [hasError, setHasError] = useState(false)
  const [chartType, setChartType] = useState<'line' | 'area'>('line')

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    try {
      // Filter data based on selected category and customer type
      const filteredData = data.filter(item => {
        const categoryMatch = selectedCategory === "all" || 
          (item.category && String(item.category) === selectedCategory)
        const customerMatch = selectedCustomerType === "all" || 
          (item.customerType && String(item.customerType) === selectedCustomerType)
        return categoryMatch && customerMatch
      })
      
      // Group data by month and product
      const monthlySales = new Map<string, Map<string, number>>()
      
      filteredData.forEach(item => {
        if (!item.date || !item.product || !item.amount) return
        
        try {
          // Format month key: YYYY-MM
          const date = new Date(item.date)
          if (isNaN(date.getTime())) return // Skip invalid dates
          
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const productKey = String(item.product)
          const amount = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount))
          
          if (isNaN(amount)) return // Skip invalid amounts
          
          // Initialize month if not exists
          if (!monthlySales.has(monthKey)) {
            monthlySales.set(monthKey, new Map<string, number>())
          }
          
          // Add sales amount for product
          const productSales = monthlySales.get(monthKey)!
          productSales.set(
            productKey,
            (productSales.get(productKey) || 0) + amount
          )
        } catch (err) {
          console.error("Error processing data item:", err)
          // Continue to next item
        }
      })
      
      // Convert to array format for chart
      const monthKeys = Array.from(monthlySales.keys()).sort()
      
      setHasError(false)
      return monthKeys.map(month => {
        // Parse date from key
        const [year, monthNum] = month.split('-').map(Number)
        const monthDate = new Date(year, monthNum - 1, 1)
        
        // Format label: MMM YYYY (e.g. Jan 2023)
        const formattedMonth = monthDate.toLocaleDateString('en-US', { 
          month: 'short',
          year: 'numeric'
        })
        
        const productEntries = monthlySales.get(month)!
        const productData: Record<string, number> = {}
        
        // Convert Map to plain object for recharts
        productEntries.forEach((value, key) => {
          productData[key] = value
        })
        
        return {
          month: formattedMonth,
          ...productData
        }
      })
    } catch (error) {
      console.error("Error processing chart data:", error)
      setHasError(true)
      return []
    }
  }, [data, selectedCategory, selectedCustomerType])
  
  // Get unique products for chart lines
  const products = useMemo(() => {
    if (chartData.length === 0) return []
    
    const productSet = new Set<string>()
    
    chartData.forEach(monthData => {
      Object.keys(monthData).forEach(key => {
        if (key !== 'month') {
          productSet.add(key)
        }
      })
    })
    
    // If too many products, limit to top 10 by sales volume
    const allProducts = Array.from(productSet)
    if (allProducts.length > 10) {
      // Calculate total sales per product
      const productSales: Record<string, number> = {}
      
      chartData.forEach(monthData => {
        allProducts.forEach(product => {
          const value = monthData[product as keyof typeof monthData]
          if (typeof value === 'number') {
            productSales[product] = (productSales[product] || 0) + value
          }
        })
      })
      
      // Sort products by sales and take top 10
      return allProducts
        .sort((a, b) => (productSales[b] || 0) - (productSales[a] || 0))
        .slice(0, 10)
    }
    
    return allProducts
  }, [chartData])
  
  // Generate colors for products
  const getProductColor = (index: number) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
      '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
    ]
    return colors[index % colors.length]
  }

  if (hasError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          There was an error processing the data. Please check the data format and try again.
        </AlertDescription>
      </Alert>
    )
  }

  if (chartData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <p className="text-muted-foreground">No data available for the selected filters</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <div className="space-x-2">
          <Button 
            size="sm" 
            variant={chartType === 'line' ? 'default' : 'outline'}
            onClick={() => setChartType('line')}
          >
            Line Chart
          </Button>
          <Button 
            size="sm" 
            variant={chartType === 'area' ? 'default' : 'outline'}
            onClick={() => setChartType('area')}
          >
            Area Chart
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height} id="product-trends-chart-container">
        {chartType === 'line' ? (
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              width={80}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend layout="horizontal" verticalAlign="top" align="center" />
            
            {/* Render a line for each product */}
            {products.map((product, index) => (
              <Line
                key={product}
                type="monotone"
                dataKey={product}
                name={product}
                stroke={getProductColor(index)}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              width={80}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend layout="horizontal" verticalAlign="top" align="center" />
            
            {/* Render an area for each product */}
            {products.map((product, index) => (
              <Area
                key={product}
                type="monotone"
                dataKey={product}
                name={product}
                fill={getProductColor(index)}
                stroke={getProductColor(index)}
                stackId="1"
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </>
  )
}
