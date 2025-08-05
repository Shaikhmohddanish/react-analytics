"use client"

import React, { useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { calculateDealerMetrics, formatCurrency } from "@/models/dealer"
import { ProcessedData } from "@/models"
import { DealerChartType } from "@/models/dealer"

interface DealerPerformanceChartsProps {
  data: ProcessedData[]
  chartType: DealerChartType
  height?: number
}

export default function DealerPerformanceCharts({ data, chartType, height = 400 }: DealerPerformanceChartsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedDealer, setSelectedDealer] = useState<string>("all")
  
  // Calculate dealer metrics
  const metrics = useMemo(() => {
    return calculateDealerMetrics(data)
  }, [data])
  
  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    data.forEach(item => {
      if (item.year) {
        years.add(item.year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  // Get all dealer names
  const dealerNames = useMemo(() => {
    return metrics.map(dealer => dealer.dealerName);
  }, [metrics]);

  // Navigate between years
  const navigateYear = (direction: "prev" | "next") => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (direction === "prev" && currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1]);
    } else if (direction === "next" && currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1]);
    }
  };

  // Filter metrics by selected year
  const filteredMetrics = useMemo(() => {
    return metrics.filter(dealer => dealer.year === selectedYear);
  }, [metrics, selectedYear]);

  // Filter by selected dealer if needed
  const filteredByDealer = useMemo(() => {
    if (selectedDealer === "all") {
      return filteredMetrics;
    }
    return filteredMetrics.filter(dealer => dealer.dealerName === selectedDealer);
  }, [filteredMetrics, selectedDealer]);

  // Top dealers chart data
  const topDealersData = useMemo(() => {
    return filteredMetrics
      .slice(0, 10)
      .map(dealer => ({
        name: dealer.dealerName,
        value: dealer.totalSales,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredMetrics]);

  // Category distribution data
  const categoryDistributionData = useMemo(() => {
    const categorySales: Record<string, number> = {};
    
    filteredMetrics.forEach(dealer => {
      Object.entries(dealer.categorySales).forEach(([category, sales]) => {
        categorySales[category] = (categorySales[category] || 0) + sales;
      });
    });
    
    return Object.entries(categorySales)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredMetrics]);

  // Monthly trends data
  const monthlyTrendsData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthData: Record<string, number> = {};
    
    // Initialize all months with zero
    monthNames.forEach(month => {
      monthData[month] = 0;
    });
    
    // Sum sales by month for selected dealers
    filteredByDealer.forEach(dealer => {
      Object.entries(dealer.monthlySales).forEach(([month, sales]) => {
        monthData[month] = (monthData[month] || 0) + sales;
      });
    });
    
    // Convert to array and sort by month
    return monthNames.map(month => ({
      name: month,
      sales: monthData[month] || 0,
    }));
  }, [filteredByDealer]);

  // Category by dealer data
  const categoryByDealerData = useMemo(() => {
    if (filteredByDealer.length === 0) return [];
    
    // If all dealers selected, take top 5
    const dealersToShow = selectedDealer === "all" 
      ? filteredByDealer.slice(0, 5) 
      : filteredByDealer;
    
    // Get all unique categories across all dealers
    const allCategories = new Set<string>();
    dealersToShow.forEach(dealer => {
      if (dealer && dealer.categorySales) {
        Object.keys(dealer.categorySales).forEach(category => {
          allCategories.add(category);
        });
      }
    });
    
    // Create data for chart, ensuring all dealers have all categories (even if zero)
    return dealersToShow.map(dealer => {
      const result: Record<string, any> = { name: dealer.dealerName };
      
      // Add all categories to each dealer's data, defaulting to 0 if not present
      Array.from(allCategories).forEach(category => {
        result[category] = dealer.categorySales && dealer.categorySales[category] 
          ? dealer.categorySales[category] 
          : 0;
      });
      
      return result;
    });
  }, [filteredByDealer, selectedDealer]);

  // Weekly trends data - placeholder, would need to calculate from actual data
  const weeklyTrendsData = useMemo(() => {
    // This is a placeholder. In a real application, you'd calculate this from your data
    // For now, we'll generate some example data
    const weeks = Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`);
    
    return weeks.map(week => ({
      name: week,
      sales: Math.floor(Math.random() * 500000) + 100000,
    }));
  }, []);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="border p-2 shadow-md bg-background">
          <CardContent className="p-2">
            <p className="font-bold">{label || 'N/A'}</p>
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>
                  {entry.name || 'Unknown'}: {formatCurrency(entry.value as number)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  // Generate random colors
  const COLORS = useMemo(() => {
    return [
      '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
      '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
    ];
  }, []);

  // Render chart based on type
  const renderChart = () => {
    switch (chartType) {
      case "topDealers":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={topDealersData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#0088FE" name="Sales">
                {topDealersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      
      case "categoryDistribution":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={categoryDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={height / 3}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: { name: string; percent?: number }) => 
                  `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`
                }
              >
                {categoryDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case "monthlyTrends":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={monthlyTrendsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                name="Sales"
                stroke="#0088FE"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case "weeklyTrends":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={weeklyTrendsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                name="Sales"
                stroke="#00C49F"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case "categoryByDealer":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={categoryByDealerData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {categoryByDealerData.length > 0 && Array.from(
                new Set(
                  categoryByDealerData.flatMap(item => 
                    Object.keys(item).filter(key => key !== 'name')
                  )
                )
              ).map((category, index) => (
                <Bar
                  key={`category-${index}`}
                  dataKey={category}
                  stackId="a"
                  fill={COLORS[index % COLORS.length]}
                  name={category}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p>Select a chart type to display</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateYear("prev")}
            disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateYear("next")}
            disabled={availableYears.indexOf(selectedYear) === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {(chartType === "monthlyTrends" || chartType === "weeklyTrends" || chartType === "categoryByDealer") && (
          <Select
            value={selectedDealer}
            onValueChange={setSelectedDealer}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Dealer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dealers</SelectItem>
              {dealerNames.map((dealer) => (
                <SelectItem key={dealer} value={dealer}>
                  {dealer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {renderChart()}
    </div>
  );
}
