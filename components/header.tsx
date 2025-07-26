"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Moon, Sun, Download, RefreshCw, Settings, Bell, Filter, Menu, Upload } from "lucide-react"
import { useTheme } from "next-themes"
import { useData } from "@/contexts/data-context"
import { useFilter } from "@/contexts/filter-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { GlobalFilters } from "@/components/global-filters"
import { ExportDialog } from "@/components/export-dialog"
import { DataImportDialog } from "@/components/data-import-dialog"
import { SearchWithSuggestions } from "@/components/search-with-suggestions"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  const { theme, setTheme } = useTheme()
  const { data, loading, refreshData, importData, lastUpdated } = useData()
  const { hasActiveFilters, clearAllFilters } = useFilter()
  const [showFilters, setShowFilters] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <>
      <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4 lg:px-6">
        <SidebarTrigger className="-ml-1 md:hidden" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-sm sm:text-lg font-semibold truncate">
            <span className="hidden sm:inline">📊 Advanced Analytics Dashboard</span>
            <span className="sm:hidden">📊 Analytics</span>
          </h1>
          {data.length > 0 && (
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              {data.length.toLocaleString()} records
            </Badge>
          )}
          {hasActiveFilters && (
            <Badge variant="outline" className="text-xs">
              Filtered
            </Badge>
          )}
        </div>

        {/* Desktop Controls */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Enhanced Search with Suggestions */}
          <SearchWithSuggestions placeholder="Search customers, items, categories..." className="w-80" />

          {/* Import */}
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>

          {/* Filters */}
          <Button variant={hasActiveFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(true)}>
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>

          {/* Export */}
          <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>

          {/* Refresh */}
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* Notifications */}
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4" />
          </Button>

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearAllFilters}>Clear All Filters</DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Search (Tablet) */}
        <div className="hidden sm:flex lg:hidden items-center gap-2">
          <SearchWithSuggestions placeholder="Search..." className="w-40" />
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden bg-transparent">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col gap-4 mt-6">
              {/* Mobile Search */}
              <div className="sm:hidden">
                <SearchWithSuggestions placeholder="Search customers, items..." className="w-full" />
              </div>

              {/* Mobile Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImport(true)
                    setShowMobileMenu(false)
                  }}
                  className="justify-start"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>

                <Button
                  variant={hasActiveFilters ? "default" : "outline"}
                  onClick={() => {
                    setShowFilters(true)
                    setShowMobileMenu(false)
                  }}
                  className="justify-start"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExport(true)
                    setShowMobileMenu(false)
                  }}
                  className="justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>

                <Button
                  variant="outline"
                  onClick={refreshData}
                  disabled={loading}
                  className="justify-start bg-transparent"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh Data
                </Button>

                <Button variant="outline" className="justify-start bg-transparent">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="justify-start"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark Mode
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={clearAllFilters} className="justify-start bg-transparent">
                  Clear All Filters
                </Button>
              </div>

              {/* Mobile Stats */}
              {data.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Dataset Info</p>
                  <p className="text-xs text-muted-foreground">{data.length.toLocaleString()} total records</p>
                  {hasActiveFilters && <p className="text-xs text-blue-600">Filters active</p>}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {lastUpdated && (
        <div className="px-3 sm:px-4 lg:px-6 py-1 text-xs text-muted-foreground bg-muted/50">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      <GlobalFilters open={showFilters} onOpenChange={setShowFilters} />
      <ExportDialog open={showExport} onOpenChange={setShowExport} />
      <DataImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImportComplete={importData}
        existingDataCount={data.length}
      />
    </>
  )
}
