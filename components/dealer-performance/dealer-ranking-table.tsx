"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DealerAnalytics } from "@/lib/analytics-utils"
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/analytics-utils"
import { Search, TrendingUp, TrendingDown, Award, Crown, Medal, Star, ChevronLeft, ChevronRight } from "lucide-react"

interface DealerRankingTableProps {
  dealerAnalytics: DealerAnalytics[] | null
}

type SortField = "totalSales" | "totalOrders" | "marketShare" | "loyaltyScore" | "growthRate" | "orderFrequency"
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE = 10

export default function DealerRankingTable({ dealerAnalytics }: DealerRankingTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("totalSales")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedTier, setSelectedTier] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredAndSortedDealers = useMemo(() => {
    if (!dealerAnalytics) return []

    let filtered = dealerAnalytics.filter(dealer => {
      const matchesSearch = dealer.dealerName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTier = selectedTier === "all" || dealer.tier === selectedTier
      return matchesSearch && matchesTier
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [dealerAnalytics, searchTerm, sortField, sortDirection, selectedTier])

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedDealers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedDealers = filteredAndSortedDealers.slice(startIndex, endIndex)

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedTier, sortField, sortDirection])

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return <Crown className="h-4 w-4 text-purple-500" />
      case "Gold":
        return <Medal className="h-4 w-4 text-yellow-500" />
      case "Silver":
        return <Award className="h-4 w-4 text-gray-500" />
      default:
        return <Star className="h-4 w-4 text-orange-500" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "Gold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Silver":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (!dealerAnalytics || dealerAnalytics.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No dealer data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dealer Rankings</CardTitle>
        <CardDescription>
          Comprehensive ranking of dealers based on various performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search dealers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="Platinum">Platinum</SelectItem>
              <SelectItem value="Gold">Gold</SelectItem>
              <SelectItem value="Silver">Silver</SelectItem>
              <SelectItem value="Bronze">Bronze</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedDealers.length)} of {filteredAndSortedDealers.length} dealers
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Dealer Name</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("totalSales")}
                    className="h-auto p-0 font-medium"
                  >
                    Total Sales
                    {sortField === "totalSales" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("totalOrders")}
                    className="h-auto p-0 font-medium"
                  >
                    Orders
                    {sortField === "totalOrders" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("marketShare")}
                    className="h-auto p-0 font-medium"
                  >
                    Market Share
                    {sortField === "marketShare" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("loyaltyScore")}
                    className="h-auto p-0 font-medium"
                  >
                    Loyalty Score
                    {sortField === "loyaltyScore" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("growthRate")}
                    className="h-auto p-0 font-medium"
                  >
                    Growth Rate
                    {sortField === "growthRate" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("orderFrequency")}
                    className="h-auto p-0 font-medium"
                  >
                    Order Frequency
                    {sortField === "orderFrequency" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </Button>
                </TableHead>
                <TableHead>Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDealers.map((dealer, index) => (
                <TableRow key={dealer.dealerName}>
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {startIndex + index + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{dealer.dealerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {dealer.categoryDiversity} categories
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(dealer.totalSales)}
                  </TableCell>
                  <TableCell>{formatNumber(dealer.totalOrders)}</TableCell>
                  <TableCell>{formatPercentage(dealer.marketShare, 2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{dealer.loyaltyScore}</span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${dealer.loyaltyScore}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {dealer.growthRate >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`font-medium ${
                          dealer.growthRate >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatPercentage(dealer.growthRate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {dealer.orderFrequency.toFixed(1)}/month
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTierIcon(dealer.tier)}
                      <Badge className={getTierColor(dealer.tier)}>
                        {dealer.tier}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {filteredAndSortedDealers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No dealers found matching your criteria
          </div>
        )}
      </CardContent>
    </Card>
  )
}
