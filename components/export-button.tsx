"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExportDialog } from "@/components/export-dialog"
import { Download } from "lucide-react"

interface ExportButtonProps {
  chartSelectors?: string[]
  title?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ExportButton({ 
  chartSelectors = [], 
  title = "Delivery Analytics",
  variant = "outline",
  size = "default",
  className = ""
}: ExportButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      
      <ExportDialog 
        open={open} 
        onOpenChange={setOpen} 
        chartSelectors={chartSelectors}
        title={title}
      />
    </>
  )
}
