"use client"

import React from "react"
import { MonthlyBreakdownChart } from "@/components/monthly-breakdown-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "@/contexts/data-context"

export default function MonthlyBreakdownPage() {
  const { loading } = useData()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Monthly Sales Breakdown</h1>
        <p className="text-muted-foreground">
          View sales data broken down by month, category, and dealer to identify trends and patterns.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="chart">Chart View</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="space-y-6">
              <MonthlyBreakdownChart height={500} />
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Patterns</CardTitle>
                    <CardDescription>Identify seasonal trends in your sales data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Use the monthly breakdown chart to identify seasonal patterns in your sales data. Look for:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Monthly peaks and troughs</li>
                      <li>Year-over-year growth patterns</li>
                      <li>Category performance by season</li>
                      <li>Dealer ordering patterns throughout the year</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Category Analysis</CardTitle>
                    <CardDescription>Understand which categories drive your business</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      The category view helps you understand which product categories contribute most to your revenue:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Compare market share of each category</li>
                      <li>Identify your most profitable product lines</li>
                      <li>Track category growth over time</li>
                      <li>Find opportunities for product diversification</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Dealer Performance</CardTitle>
                    <CardDescription>Analyze your top-performing dealers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      The dealer view provides insights into your customer relationships:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Identify your top dealers by revenue</li>
                      <li>See product category preferences by dealer</li>
                      <li>Discover cross-selling opportunities</li>
                      <li>Target marketing efforts to specific dealers</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Using Filters</CardTitle>
                    <CardDescription>Customize your view with filters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Enhance your analysis with global filters:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Filter by date range to focus on specific periods</li>
                      <li>Select specific customers to analyze their patterns</li>
                      <li>Filter by categories to compare related products</li>
                      <li>Use amount range filters to focus on high or low-value transactions</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
