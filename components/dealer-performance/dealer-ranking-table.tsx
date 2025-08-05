"use client"

import React, { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ArrowDown, 
  ArrowUp, 
  ArrowUpDown, 
  ChevronDown, 
  Download, 
  MoreHorizontal,
  Search
} from "lucide-react"
import { calculateDealerMetrics, formatCurrency, generateDealerRankings } from "@/models/dealer"
import { ProcessedData } from "@/models"

interface DealerRankingTableProps {
  data: ProcessedData[]
}

type SortField = 'rank' | 'dealer' | 'totalSales' | 'orderCount' | 'avgOrderValue' | 'growth'
type SortDirection = 'asc' | 'desc'

export default function DealerRankingTable({ data }: DealerRankingTableProps) {
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const rowsPerPage = 10

  // Calculate dealer metrics
  const metrics = useMemo(() => {
    return calculateDealerMetrics(data)
  }, [data])

  // Generate dealer rankings
  const rankings = useMemo(() => {
    return generateDealerRankings(metrics, data)
  }, [metrics, data])

  // Sort and filter data
  const sortedAndFilteredData = useMemo(() => {
    let filtered = [...rankings]
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter((dealer) => 
        dealer.dealer.toLowerCase().includes(search) || 
        dealer.topCategory.toLowerCase().includes(search)
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'rank':
          comparison = a.rank - b.rank
          break
        case 'dealer':
          comparison = a.dealer.localeCompare(b.dealer)
          break
        case 'totalSales':
          comparison = a.totalSales - b.totalSales
          break
        case 'orderCount':
          comparison = a.orderCount - b.orderCount
          break
        case 'avgOrderValue':
          comparison = a.avgOrderValue - b.avgOrderValue
          break
        case 'growth':
          comparison = a.growth - b.growth
          break
        default:
          comparison = a.rank - b.rank
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    return filtered
  }, [rankings, searchTerm, sortField, sortDirection])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage
    return sortedAndFilteredData.slice(startIndex, startIndex + rowsPerPage)
  }, [sortedAndFilteredData, page])

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Handle exporting to CSV
  const exportToCsv = () => {
    const headers = ['Rank', 'Dealer', 'Total Sales', 'Order Count', 'Avg Order Value', 'Top Category', 'Last Order', 'Growth (%)']
    
    const csvData = sortedAndFilteredData.map((dealer) => [
      dealer.rank,
      dealer.dealer,
      dealer.totalSales,
      dealer.orderCount,
      dealer.avgOrderValue,
      dealer.topCategory,
      dealer.lastOrder,
      dealer.growth.toFixed(2)
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'dealer_rankings.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" /> 
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dealers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportToCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('rank')} className="w-[80px] cursor-pointer">
                <div className="flex items-center">
                  Rank
                  {renderSortIndicator('rank')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('dealer')} className="cursor-pointer">
                <div className="flex items-center">
                  Dealer
                  {renderSortIndicator('dealer')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('totalSales')} className="cursor-pointer">
                <div className="flex items-center">
                  Total Sales
                  {renderSortIndicator('totalSales')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('orderCount')} className="cursor-pointer">
                <div className="flex items-center">
                  Orders
                  {renderSortIndicator('orderCount')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('avgOrderValue')} className="cursor-pointer">
                <div className="flex items-center">
                  Avg. Order
                  {renderSortIndicator('avgOrderValue')}
                </div>
              </TableHead>
              <TableHead>Top Category</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead onClick={() => handleSort('growth')} className="cursor-pointer">
                <div className="flex items-center">
                  Growth
                  {renderSortIndicator('growth')}
                </div>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((dealer) => (
                <TableRow key={dealer.id}>
                  <TableCell className="font-medium">{dealer.rank}</TableCell>
                  <TableCell>{dealer.dealer}</TableCell>
                  <TableCell>{formatCurrency(dealer.totalSales)}</TableCell>
                  <TableCell>{dealer.orderCount.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(dealer.avgOrderValue)}</TableCell>
                  <TableCell>{dealer.topCategory}</TableCell>
                  <TableCell>{dealer.lastOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {dealer.growth > 0 ? (
                        <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                      ) : dealer.growth < 0 ? (
                        <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                      ) : null}
                      <span 
                        className={
                          dealer.growth > 0 
                            ? "text-green-500" 
                            : dealer.growth < 0 
                              ? "text-red-500" 
                              : ""
                        }
                      >
                        {Math.abs(dealer.growth).toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem 
                          onClick={() => navigator.clipboard.writeText(dealer.dealer)}
                        >
                          Copy dealer name
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>View orders</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{paginatedData.length}</span> of{" "}
          <span className="font-medium">{sortedAndFilteredData.length}</span> dealers
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page * rowsPerPage >= sortedAndFilteredData.length}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
