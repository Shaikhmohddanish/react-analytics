"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { loadAndProcessData, type ProcessedData, formatCurrency } from "@/lib/data-processing"
import { sortDataByMonth, sortMonthsChronologically } from "@/lib/analytics-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, DollarSign, PieChart, CalendarRange, Package2, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function AdvancedReports() {
  const [data, setData] = useState<ProcessedData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState("orders-count")
  
  // Pagination states for each tab
  const [ordersCountPage, setOrdersCountPage] = useState(1)
  const [salesAmountPage, setSalesAmountPage] = useState(1)
  const [categoryBreakdownPage, setCategoryBreakdownPage] = useState(1)
  const [monthlySharePage, setMonthlySharePage] = useState(1)
  const [productSharePage, setProductSharePage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadAndProcessData()
      .then((processedData) => {
        setData(processedData)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading data:", err)
        setError("Failed to load data. Please check if the CSV file is available.")
        setLoading(false)
      })
  }, [])
  
  // Reset pagination when changing tabs
  useEffect(() => {
    setOrdersCountPage(1)
    setSalesAmountPage(1)
    setCategoryBreakdownPage(1)
    setMonthlySharePage(1)
    setProductSharePage(1)
  }, [activeTab])
  
  // Helper function to paginate data
  const paginateData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }
  
  // Helper function to render pagination controls
  const renderPagination = (currentPage: number, totalItems: number, setPage: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    if (totalPages <= 1) return null
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1) setPage(currentPage - 1)
              }} 
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1
            // Show current page, first, last and nearby pages
            if (
              pageNumber === 1 || 
              pageNumber === totalPages || 
              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
            ) {
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink 
                    href="#" 
                    isActive={pageNumber === currentPage}
                    onClick={(e) => {
                      e.preventDefault()
                      setPage(pageNumber)
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            }
            
            // Show ellipsis for gaps in pagination
            if (
              (pageNumber === currentPage - 2 && pageNumber > 2) || 
              (pageNumber === currentPage + 2 && pageNumber < totalPages - 1)
            ) {
              return (
                <PaginationItem key={`ellipsis-${pageNumber}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            }
            
            return null
          })}
          
          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages) setPage(currentPage + 1)
              }}
              aria-disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Section 1: Orders by count
  const ordersByCount = data.reduce(
    (acc, row) => {
      const customer = row["Customer Name"]
      if (!acc[customer]) {
        acc[customer] = new Set()
      }
      acc[customer].add(row["Delivery Challan Number"])
      return acc
    },
    {} as Record<string, Set<string>>,
  )

  const ordersCountData = Object.entries(ordersByCount)
    .map(([customer, orders]) => ({
      customer,
      totalOrders: orders.size,
    }))
    .sort((a, b) => b.totalOrders - a.totalOrders)

  // Section 2: Orders by amount
  const ordersByAmount = data.reduce(
    (acc, row) => {
      const customer = row["Customer Name"]
      acc[customer] = (acc[customer] || 0) + row.itemTotal
      return acc
    },
    {} as Record<string, number>,
  )

  const ordersAmountData = Object.entries(ordersByAmount)
    .map(([customer, amount]) => ({
      customer,
      totalAmount: amount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)

  // Section 3: Category summary
  const categoryData = data.reduce(
    (acc, row) => {
      const customer = row["Customer Name"]
      const category = row.category
      if (!acc[customer]) {
        acc[customer] = {}
      }
      acc[customer][category] = (acc[customer][category] || 0) + row.itemTotal
      return acc
    },
    {} as Record<string, Record<string, number>>,
  )

  const categories = [...new Set(data.map((d) => d.category))].sort()
  const categorySummary = Object.entries(categoryData).map(([customer, cats]) => ({
    customer,
    ...categories.reduce((acc, cat) => ({ ...acc, [cat]: cats[cat] || 0 }), {}),
  }))

  // Section 4: Monthly category share
  const monthlyCategory = data.reduce(
    (acc, row) => {
      const month = row.month
      const category = row.category
      const key = `${month}-${category}`
      if (!acc[key]) {
        acc[key] = { month, category, total: 0 }
      }
      acc[key].total += row.itemTotal
      return acc
    },
    {} as Record<string, { month: string; category: string; total: number }>,
  )

  const monthlyTotals = data.reduce(
    (acc, row) => {
      const month = row.month
      acc[month] = (acc[month] || 0) + row.itemTotal
      return acc
    },
    {} as Record<string, number>,
  )

  const monthlyShareData = sortDataByMonth(
    Object.values(monthlyCategory)
      .map((item) => ({
        ...item,
        percent: ((item.total / monthlyTotals[item.month]) * 100).toFixed(2),
      }))
  )

  // Section 5: Product monthly share
  const productMonthly = data.reduce(
    (acc, row) => {
      const product = row["Item Name"]
      const month = row.month
      const key = `${product}-${month}`
      if (!acc[key]) {
        acc[key] = { product, month, total: 0 }
      }
      acc[key].total += row.itemTotal
      return acc
    },
    {} as Record<string, { product: string; month: string; total: number }>,
  )

  const productTotals = data.reduce(
    (acc, row) => {
      const product = row["Item Name"]
      acc[product] = (acc[product] || 0) + row.itemTotal
      return acc
    },
    {} as Record<string, number>,
  )

  const productShareData = Object.values(productMonthly).map((item) => ({
    ...item,
    percent: ((item.total / productTotals[item.product]) * 100).toFixed(2),
  }))

  const months = sortMonthsChronologically([...new Set(data.map((d) => d.month))])
  const topProducts = Object.entries(productTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([product]) => product)

  const productPivot = topProducts.map((product) => {
    const row: any = { product }
    months.forEach((month) => {
      const item = productShareData.find((p) => p.product === product && p.month === month)
      row[month] = item ? `${item.percent}%` : "0.00%"
    })
    return row
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📊 Advanced Reports</h1>
      </div>
      
      <Tabs defaultValue="orders-count" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full mb-4">
          <TabsTrigger value="orders-count" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Order Count</span>
          </TabsTrigger>
          <TabsTrigger value="sales-amount" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Sales Amount</span>
          </TabsTrigger>
          <TabsTrigger value="category-breakdown" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="monthly-share" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            <span className="hidden sm:inline">Monthly Share</span>
          </TabsTrigger>
          <TabsTrigger value="product-share" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            <span className="hidden sm:inline">Product Share</span>
          </TabsTrigger>
        </TabsList>

        {/* Orders Count Tab */}
        <TabsContent value="orders-count" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Number of Orders by Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Customer Name</th>
                      <th className="border border-gray-300 p-2 text-right">Total Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateData(ordersCountData, ordersCountPage).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="border border-gray-300 p-2">{row.customer}</td>
                        <td className="border border-gray-300 p-2 text-right">{row.totalOrders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination(ordersCountPage, ordersCountData.length, setOrdersCountPage)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Amount Tab */}
        <TabsContent value="sales-amount" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Sales by Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Customer Name</th>
                      <th className="border border-gray-300 p-2 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateData(ordersAmountData, salesAmountPage).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="border border-gray-300 p-2">{row.customer}</td>
                        <td className="border border-gray-300 p-2 text-right">{formatCurrency(row.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination(salesAmountPage, ordersAmountData.length, setSalesAmountPage)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Breakdown Tab */}
        <TabsContent value="category-breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders by Product Category (₹)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Customer Name</th>
                      {categories.map((cat) => (
                        <th key={cat} className="border border-gray-300 p-2 text-right min-w-24">
                          {cat}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginateData(categorySummary, categoryBreakdownPage).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="border border-gray-300 p-2 max-w-48 truncate">{row.customer}</td>
                        {categories.map((cat) => (
                          <td key={cat} className="border border-gray-300 p-2 text-right">
                            {formatCurrency((row as any)[cat])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination(categoryBreakdownPage, categorySummary.length, setCategoryBreakdownPage)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Share Tab */}
        <TabsContent value="monthly-share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Product Category Share (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Month</th>
                      <th className="border border-gray-300 p-2 text-left">Category</th>
                      <th className="border border-gray-300 p-2 text-right">Amount</th>
                      <th className="border border-gray-300 p-2 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateData(monthlyShareData, monthlySharePage).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="border border-gray-300 p-2">{row.month}</td>
                        <td className="border border-gray-300 p-2">{row.category}</td>
                        <td className="border border-gray-300 p-2 text-right">{formatCurrency(row.total)}</td>
                        <td className="border border-gray-300 p-2 text-right">{row.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination(monthlySharePage, monthlyShareData.length, setMonthlySharePage)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Share Tab */}
        <TabsContent value="product-share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product-wise Monthly Share (%) - Top 15 Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-1 text-left sticky left-0 bg-black text-white min-w-48">Product</th>
                      {months.map((month) => (
                        <th key={month} className="border border-gray-300 p-1 text-center min-w-20">
                          {month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginateData(productPivot, productSharePage).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="border border-gray-300 p-1 sticky left-0 bg-black text-white max-w-48 truncate">
                          {row.product}
                        </td>
                        {months.map((month) => (
                          <td key={month} className="border border-gray-300 p-1 text-center">
                            {row[month]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination(productSharePage, productPivot.length, setProductSharePage)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
