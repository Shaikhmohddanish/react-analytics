"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, FileText, ImageIcon, Table } from "lucide-react"
import { useFilter } from "@/contexts/filter-context"
import { useToast } from "@/hooks/use-toast"
import { exportToCSV, exportToPDF, exportToExcel, captureChartElements } from "@/lib/export-utils"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chartSelectors?: string[]
  title?: string
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  chartSelectors = [],
  title = "Delivery Analytics"
}: ExportDialogProps) {
  const { filteredData } = useFilter()
  const { toast } = useToast()
  const [format, setFormat] = useState("csv")
  const [includeCharts, setIncludeCharts] = useState(false)
  const [selectedFields, setSelectedFields] = useState([
    "Customer Name",
    "Item Name",
    "Category",
    "Challan Date",
    "Item Total",
    "Delivery Challan Number",
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [chartsAvailable, setChartsAvailable] = useState(false)

  const availableFields = [
    "Customer Name",
    "Item Name", 
    "Category",
    "Challan Date",
    "Item Total",
    "Delivery Challan Number",
    "Month",
    "Year",
    "Customer Type",
    "Product Category"
  ]

  // Check if charts are available when dialog opens
  useEffect(() => {
    if (open && chartSelectors.length > 0) {
      const hasCharts = chartSelectors.some(selector => document.querySelector(selector));
      setChartsAvailable(hasCharts);
    }
  }, [open, chartSelectors]);

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast({
        title: "No fields selected",
        description: "Please select at least one field to export",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    
    try {
      const dataToExport = filteredData.map((item) => {
        const exportItem: any = {}
        selectedFields.forEach((field) => {
          if (field === "Challan Date" && item.challanDate instanceof Date) {
            exportItem[field] = item.challanDate.toLocaleDateString()
          } else {
            // Handle all types of data by converting to string if necessary
            const value = (item as any)[field]
            exportItem[field] = value !== undefined ? value : ''
          }
        })
        return exportItem
      })

      // Capture chart elements if including charts and we're exporting to PDF
      let chartElements: HTMLElement[] = []
      if (format === "pdf" && includeCharts && chartSelectors.length > 0) {
        chartElements = await captureChartElements(chartSelectors)
      }

      switch (format) {
        case "csv":
          exportToCSV(dataToExport, title)
          break
        case "excel":
          await exportToExcel(dataToExport, title)
          break
        case "pdf":
          await exportToPDF(dataToExport, title, includeCharts, chartElements)
          break
      }

      toast({
        title: "Export successful",
        description: `Data exported as ${format.toUpperCase()}`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>Export {filteredData.length.toLocaleString()} filtered records</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center">
                  <Table className="mr-2 h-4 w-4" />
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Excel
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  PDF Report
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Fields Selection */}
          <div className="space-y-2">
            <Label>Fields to Include</Label>
            <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-3">
              {availableFields.map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={`field-${field}`}
                    checked={selectedFields.includes(field)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFields((prev) => [...prev, field])
                      } else {
                        setSelectedFields((prev) => prev.filter((f) => f !== field))
                      }
                    }}
                  />
                  <Label htmlFor={`field-${field}`} className="text-sm">
                    {field}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Options */}
          {format === "pdf" && chartsAvailable && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-charts" 
                checked={includeCharts} 
                onCheckedChange={(checked) => setIncludeCharts(checked === true)}
              />
              <Label htmlFor="include-charts" className="text-sm">
                Include charts and visualizations
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={selectedFields.length === 0 || isProcessing}
          >
            {isProcessing ? "Processing..." : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
