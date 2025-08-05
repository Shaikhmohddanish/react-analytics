"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/contexts/data-context"
import { useFilter } from "@/contexts/filter-context"
import DealerFilters from "../../components/dealer-performance-fixed/dealer-filters"
import DealerPerformanceMetrics from "../../components/dealer-performance-fixed/dealer-performance-metrics"
import DealerRankingTable from "../../components/dealer-performance-fixed/dealer-ranking-table"
import DealerPerformanceCharts from "../../components/dealer-performance-fixed/dealer-performance-charts"
import { Loader2 } from "lucide-react"

export default function DealerPerformancePage() {
  const { data, loading } = useData()
  const { filteredData } = useFilter()
  const [activeTab, setActiveTab] = useState("overview")

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading dealer performance data...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dealer Performance Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive analysis of dealer performance metrics, rankings, and trends
        </p>
      </div>

      <DealerFilters />

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="temporal">Temporal Trends</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DealerPerformanceMetrics data={filteredData} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Dealers by Sales</CardTitle>
                <CardDescription>
                  Ranked by total sales volume in the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DealerPerformanceCharts 
                  data={filteredData} 
                  chartType="topDealers" 
                  height={350} 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>
                  Distribution of sales across product categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DealerPerformanceCharts 
                  data={filteredData} 
                  chartType="categoryDistribution" 
                  height={350} 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dealer Rankings</CardTitle>
              <CardDescription>
                Sortable rankings based on sales performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DealerRankingTable data={filteredData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temporal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Trends</CardTitle>
              <CardDescription>
                Track dealer performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DealerPerformanceCharts 
                data={filteredData} 
                chartType="monthlyTrends" 
                height={400} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance Trends</CardTitle>
              <CardDescription>
                Detailed weekly performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DealerPerformanceCharts 
                data={filteredData} 
                chartType="weeklyTrends" 
                height={400} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance by Dealer</CardTitle>
              <CardDescription>
                Analyze dealer performance across different product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DealerPerformanceCharts 
                data={filteredData} 
                chartType="categoryByDealer" 
                height={500} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
