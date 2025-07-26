"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, User, Package, Tag, FileText, Calendar } from "lucide-react"
import { useData } from "@/contexts/data-context"
import { useFilter } from "@/contexts/filter-context"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/data-processing"

interface SearchSuggestion {
  id: string
  type: "customer" | "item" | "category" | "challan" | "recent"
  value: string
  label: string
  metadata?: string
  count?: number
}

interface SearchWithSuggestionsProps {
  placeholder?: string
  className?: string
  showRecentSearches?: boolean
}

export function SearchWithSuggestions({
  placeholder = "Search customers, items, categories...",
  className,
  showRecentSearches = true,
}: SearchWithSuggestionsProps) {
  const { data } = useData()
  const { searchTerm, setSearchTerm, applyQuickFilter } = useFilter()
  const [inputValue, setInputValue] = useState(searchTerm)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches) {
      const saved = localStorage.getItem("dashboard-recent-searches")
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved))
        } catch (error) {
          console.warn("Failed to load recent searches:", error)
        }
      }
    }
  }, [showRecentSearches])

  // Save recent searches to localStorage
  const saveRecentSearch = (term: string) => {
    if (!showRecentSearches || !term.trim()) return

    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("dashboard-recent-searches", JSON.stringify(updated))
  }

  // Generate suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) {
      // Show recent searches when input is empty
      if (showRecentSearches && recentSearches.length > 0) {
        return recentSearches.map((term, index) => ({
          id: `recent-${index}`,
          type: "recent" as const,
          value: term,
          label: term,
          metadata: "Recent search",
        }))
      }
      return []
    }

    const searchLower = inputValue.toLowerCase()
    const allSuggestions: SearchSuggestion[] = []

    // Customer suggestions
    const customers = [...new Set(data.map((d) => d["Customer Name"]))]
      .filter((customer) => customer.toLowerCase().includes(searchLower))
      .slice(0, 5)
      .map((customer) => {
        const customerData = data.filter((d) => d["Customer Name"] === customer)
        const totalSales = customerData.reduce((sum, d) => sum + d.itemTotal, 0)
        return {
          id: `customer-${customer}`,
          type: "customer" as const,
          value: customer,
          label: customer,
          metadata: `${formatCurrency(totalSales)} • ${customerData.length} orders`,
          count: customerData.length,
        }
      })

    // Item suggestions
    const items = [...new Set(data.map((d) => d["Item Name"]))]
      .filter((item) => item.toLowerCase().includes(searchLower))
      .slice(0, 5)
      .map((item) => {
        const itemData = data.filter((d) => d["Item Name"] === item)
        const totalSales = itemData.reduce((sum, d) => sum + d.itemTotal, 0)
        return {
          id: `item-${item}`,
          type: "item" as const,
          value: item,
          label: item,
          metadata: `${formatCurrency(totalSales)} • ${itemData.length} sold`,
          count: itemData.length,
        }
      })

    // Category suggestions
    const categories = [...new Set(data.map((d) => d.category))]
      .filter((category) => category.toLowerCase().includes(searchLower))
      .slice(0, 3)
      .map((category) => {
        const categoryData = data.filter((d) => d.category === category)
        const totalSales = categoryData.reduce((sum, d) => sum + d.itemTotal, 0)
        return {
          id: `category-${category}`,
          type: "category" as const,
          value: category,
          label: category,
          metadata: `${formatCurrency(totalSales)} • ${categoryData.length} items`,
          count: categoryData.length,
        }
      })

    // Challan number suggestions
    const challans = [...new Set(data.map((d) => d["Delivery Challan Number"]))]
      .filter((challan) => challan.toLowerCase().includes(searchLower))
      .slice(0, 3)
      .map((challan) => {
        const challanData = data.filter((d) => d["Delivery Challan Number"] === challan)
        const totalSales = challanData.reduce((sum, d) => sum + d.itemTotal, 0)
        const customer = challanData[0]?.["Customer Name"] || ""
        return {
          id: `challan-${challan}`,
          type: "challan" as const,
          value: challan,
          label: challan,
          metadata: `${customer} • ${formatCurrency(totalSales)}`,
          count: challanData.length,
        }
      })

    // Combine and sort suggestions
    allSuggestions.push(...customers, ...items, ...categories, ...challans)

    // Sort by relevance (exact matches first, then by count)
    return allSuggestions
      .sort((a, b) => {
        const aExact = a.label.toLowerCase().startsWith(searchLower)
        const bExact = b.label.toLowerCase().startsWith(searchLower)

        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1

        return (b.count || 0) - (a.count || 0)
      })
      .slice(0, 10)
  }, [inputValue, data, recentSearches, showRecentSearches])

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value)
    setSelectedIndex(-1)
    setShowSuggestions(true)
  }

  // Handle search submission
  const handleSearch = (term: string = inputValue) => {
    if (!term.trim()) return

    setSearchTerm(term)
    saveRecentSearch(term)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "recent") {
      setInputValue(suggestion.value)
      handleSearch(suggestion.value)
    } else {
      // Apply specific filter based on suggestion type
      switch (suggestion.type) {
        case "customer":
          applyQuickFilter("customer", suggestion.value)
          setInputValue("")
          setSearchTerm("")
          break
        case "category":
          applyQuickFilter("category", suggestion.value)
          setInputValue("")
          setSearchTerm("")
          break
        default:
          setInputValue(suggestion.value)
          handleSearch(suggestion.value)
      }
    }
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Clear search
  const handleClear = () => {
    setInputValue("")
    setSearchTerm("")
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Get icon for suggestion type
  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "customer":
        return <User className="h-4 w-4 text-blue-500" />
      case "item":
        return <Package className="h-4 w-4 text-green-500" />
      case "category":
        return <Tag className="h-4 w-4 text-purple-500" />
      case "challan":
        return <FileText className="h-4 w-4 text-orange-500" />
      case "recent":
        return <Calendar className="h-4 w-4 text-gray-500" />
      default:
        return <Search className="h-4 w-4 text-gray-500" />
    }
  }

  // Sync with external search term changes
  useEffect(() => {
    if (searchTerm !== inputValue) {
      setInputValue(searchTerm)
    }
  }, [searchTerm])

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          className="pl-8 pr-8"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors",
                selectedIndex === index && "bg-accent",
              )}
            >
              {getSuggestionIcon(suggestion.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{suggestion.label}</span>
                  {suggestion.type !== "recent" && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  )}
                </div>
                {suggestion.metadata && <p className="text-xs text-muted-foreground truncate">{suggestion.metadata}</p>}
              </div>
            </div>
          ))}

          {/* Search all results option */}
          {inputValue.trim() && (
            <>
              <div className="border-t border-border" />
              <div
                onClick={() => handleSearch()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors",
                  selectedIndex === suggestions.length && "bg-accent",
                )}
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Search for "{inputValue}"</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Active search indicator */}
      {searchTerm && (
        <div className="absolute top-full left-0 right-0 mt-1">
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
            <Search className="h-3 w-3 text-blue-600" />
            <span className="text-blue-800">Searching: "{searchTerm}"</span>
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-4 w-4 p-0 ml-auto hover:bg-blue-100">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
