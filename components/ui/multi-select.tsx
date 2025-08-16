"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"

type MultiSelectProps = {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = "Search...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const clearAll = () => onChange([])
  const selectAll = () => onChange(options)

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        {selected.length > 0 && (
          <div className="flex gap-1">
            <Badge variant="secondary" className="text-xs">{selected.length}</Badge>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={clearAll}>Clear</Button>
          </div>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="truncate text-left">
              {selected.length === 0 ? `Select ${label.toLowerCase()}` : selected.slice(0, 2).join(", ")}
              {selected.length > 2 ? ` +${selected.length - 2}` : ""}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[min(92vw,420px)]" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder={placeholder} className="text-sm" />
            <CommandList className="max-h-64">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <div className="flex items-center gap-2 px-2 py-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={selectAll}>Select all</Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={clearAll}>Clear</Button>
                </div>
                {options.map((opt) => (
                  <CommandItem key={opt} value={opt} onSelect={() => toggle(opt)} className="cursor-pointer">
                    <div className="flex items-center gap-2 w-full">
                      <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
                      <span className="truncate text-sm">{opt}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}


