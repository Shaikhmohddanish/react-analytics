"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useFilter } from "@/contexts/filter-context"
import { formatCurrency } from "@/lib/data-processing"

export default function WeeklyFlow() {
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

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const categories = [...new Set(filteredData.map((d) => d.category))].sort()
  const years = [...new Set(filteredData.map((d) => d.year))].sort()

  // Aggregate data by year, month, and category
  const monthlyData = filteredData.reduce(
    (acc, row) => {
      const key = `${row.year}-${row.monthNum}-${row.category}`
      if (!acc[key]) {
        acc[key] = {
          year: row.year,
          monthNum: row.monthNum,
          monthName: monthNames[row.monthNum - 1],
          category: row.category,
          total: 0,
        }
      }
      acc[key].total += row.itemTotal
      return acc
    },
    {} as Record<string, any>,
  )

  const monthlyArray = Object.values(monthlyData)

  // Get max value for consistent y-axis
  const maxValue = Math.max(...monthlyArray.map((d) => d.total)) * 1.1

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">📊 Month-on-Month Sales Comparison</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Compare sales performance across different years by month
        </p>
      </div>

      {monthNames.map((monthName, monthIndex) => {
        const monthNum = monthIndex + 1

        // Get data for each year for this month
        const monthData = years.map((year) => {
          const yearData = monthlyArray.filter((d) => d.year === year && d.monthNum === monthNum)

          // Ensure all categories are represented
          const chartData = categories.map((cat) => ({
            category: cat,
            categoryShort: cat.length > 12 ? cat.substring(0, 9) + "..." : cat,
            total: yearData.find((d) => d.category === cat)?.total || 0,
          }))

          return {
            year,
            data: chartData,
            hasData: chartData.some((d) => d.total > 0),
          }
        })

        const hasAnyData = monthData.some((yearData) => yearData.hasData)
        const currentDate = new Date()
        const isFutureMonth = years.some(
          (year) => year === currentDate.getFullYear() && currentDate.getMonth() + 1 < monthNum,
        )

        const colors = ["#87CEEB", "#90EE90", "#FFB6C1", "#DDA0DD", "#F0E68C"]

        return (
          <Card key={monthName}>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">📅 {monthName}</CardTitle>
            </CardHeader>
            <CardContent>
              {hasAnyData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {monthData.map((yearData, index) => (
                    <div key={yearData.year}>
                      <h3 className="text-sm sm:text-lg font-semibold mb-4 text-center">
                        {monthName} {yearData.year}
                      </h3>
                      {yearData.hasData ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={yearData.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="categoryShort"
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              fontSize={9}
                              tick={{ fontSize: 9 }}
                              interval={0}
                            />
                            <YAxis
                              domain={[0, maxValue]}
                              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                              fontSize={9}
                              tick={{ fontSize: 9 }}
                            />
                            <Tooltip
                              formatter={(value: number) => [formatCurrency(value), "Sales"]}
                              labelFormatter={(label) => `Category: ${label}`}
                            />
                            <Bar dataKey="total" fill={colors[index % colors.length]} radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded">
                          <div className="text-center">
                            <p className="text-gray-500 text-sm">
                              {isFutureMonth && yearData.year === currentDate.getFullYear()
                                ? `Future data for ${monthName} ${yearData.year} not available`
                                : `No data for ${monthName} ${yearData.year}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No data available for {monthName}</p>
                    <p className="text-sm text-muted-foreground">No sales recorded in this month across all years</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
