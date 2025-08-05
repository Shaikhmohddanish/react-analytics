"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface VirtualizedTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    render?: (item: T) => React.ReactNode
  }[]
  rowHeight?: number
  containerHeight?: number
  containerClassName?: string
  emptyMessage?: string
  onRowClick?: (item: T) => void
  highlightedRowId?: string | number
  getRowId?: (item: T) => string | number
}

export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 500,
  containerClassName = "",
  emptyMessage = "No data available",
  onRowClick,
  highlightedRowId,
  getRowId = () => Math.random().toString(),
}: VirtualizedTableProps<T>) {
  const [visibleData, setVisibleData] = useState<T[]>([])
  const [startIndex, setStartIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const totalHeight = data.length * rowHeight

  // Calculate how many rows we need to render to fill the viewport plus some buffer
  const calculateVisibleCount = useCallback(() => {
    if (!containerRef.current) return 0
    const bufferItems = 5 // Add extra items as buffer for smoother scrolling
    return Math.ceil(containerHeight / rowHeight) + bufferItems * 2
  }, [containerHeight, rowHeight])

  const updateVisibleData = useCallback(() => {
    if (!containerRef.current) return
    
    const scrollTop = containerRef.current.scrollTop
    const index = Math.floor(scrollTop / rowHeight)
    const visibleCount = calculateVisibleCount()
    
    // Adjust start index to include buffer, but don't go below 0
    const newStartIndex = Math.max(0, index - Math.floor(visibleCount / 4))
    
    // If the start index changed or we don't have any visible data yet
    if (newStartIndex !== startIndex || visibleData.length === 0) {
      setStartIndex(newStartIndex)
      
      // Calculate the actual end index, ensuring we don't go past the data array
      const endIndex = Math.min(newStartIndex + visibleCount, data.length)
      setVisibleData(data.slice(newStartIndex, endIndex))
    }
  }, [data, calculateVisibleCount, rowHeight, startIndex, visibleData.length])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    window.requestAnimationFrame(() => {
      updateVisibleData()
    })
  }, [updateVisibleData])

  // Update visible data when data changes
  useEffect(() => {
    updateVisibleData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Empty state check
  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto relative ${containerClassName}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${startIndex * rowHeight}px)`,
          }}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleData.map((item) => {
                const rowId = getRowId(item)
                const isHighlighted = highlightedRowId !== undefined && highlightedRowId === rowId
                
                return (
                  <TableRow 
                    key={rowId} 
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    className={`${onRowClick ? 'cursor-pointer hover:bg-muted' : ''} ${
                      isHighlighted ? 'bg-muted' : ''
                    }`}
                  >
                    {columns.map((column) => (
                      <TableCell key={`${rowId}-${column.key}`}>
                        {column.render
                          ? column.render(item)
                          : (item as any)[column.key] !== undefined
                          ? String((item as any)[column.key])
                          : ""}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
