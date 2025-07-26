"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useFilter } from "@/contexts/filter-context"
import { formatCurrency } from "@/lib/data-processing"

export default function YearlyTrend() {
  const { filteredData, loading } = useFilter()

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

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">No Data Available</p>
          <p className="text-muted-foreground">Please check your filters or upload data.</p>
        </div>
      </div>
    )
  }

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const categories = [...new Set(filteredData.map((d) => d.category))].sort()
  const years = [...new Set(filteredData.map((d) => d.year))].sort()

  // Aggregate monthly sales by category and year
  const monthlyData = filteredData.reduce(
    (acc, row) => {
      const key = `${row.category}-${row.year}-${row.monthNum}`
      if (!acc[key]) {
        acc[key] = {
          category: row.category,
          year: row.year,
          monthNum: row.monthNum,
          total: 0,
        }
      }
      acc[key].total += row.itemTotal
      return acc
    },
    {} as Record<string, any>,
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">📈 Yearly Sales Trend by Product Category</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Compare sales performance across years for each product category
        </p>
      </div>

      {categories.map((category) => {
        // Get data for this category
        const categoryData = Object.values(monthlyData).filter((d) => d.category === category)

        // Create chart data with all 12 months for all years
        const chartData = monthLabels.map((label, index) => {
          const monthNum = index + 1
          const dataPoint: any = {
            month: label,
            monthFull: `${label} (${monthNum})`,
          }

          years.forEach((year) => {
            const yearData = categoryData.find((d) => d.year === year && d.monthNum === monthNum)
            dataPoint[year.toString()] = yearData?.total || 0
          })

          return dataPoint
        })

        const hasData = chartData.some((d) => years.some((year) => d[year.toString()] > 0))

        const colors = ["#FF8C00", "#32CD32", "#8884d8", "#82ca9d", "#ffc658"]

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">📊 {category}</CardTitle>
            </CardHeader>
            <CardContent>
              {hasData ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={10} tick={{ fontSize: 10 }} />
                    <YAxis
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [formatCurrency(value), `Year ${name}`]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} iconSize={8} />
                    {years.map((year, index) => (
                      <Line
                        key={year}
                        type="monotone"
                        dataKey={year.toString()}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name={year.toString()}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No data available for {category}</p>
                    <p className="text-sm text-muted-foreground">This category has no sales in the selected period</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-2">No categories found in the data</p>
            <p className="text-sm text-muted-foreground">Please check your data or adjust filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
