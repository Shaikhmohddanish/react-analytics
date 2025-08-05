"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { debounce } from "@/lib/data-utils"

/**
 * Custom hook for optimized data filtering
 * @param data Source data array
 * @param filterFn Function to filter data items
 * @param options Configuration options
 * @returns Filtered data and filter management functions
 */
export function useOptimizedFilter<T>(
  data: T[],
  filterFn: (item: T, filters: any) => boolean,
  options: {
    initialFilters?: any;
    debounceTime?: number;
    enableIncrementalProcessing?: boolean;
    chunkSize?: number;
  } = {}
) {
  const {
    initialFilters = {},
    debounceTime = 200,
    enableIncrementalProcessing = true,
    chunkSize = 1000
  } = options;
  
  const [filters, setFilters] = useState(initialFilters);
  const [filteredData, setFilteredData] = useState<T[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Keep track of the latest data and filters for incremental processing
  const dataRef = useRef(data);
  const filtersRef = useRef(filters);
  
  // Update refs when props change
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  
  // Apply filters incrementally to avoid blocking the UI
  const applyFilters = useCallback(() => {
    const currentData = dataRef.current;
    const currentFilters = filtersRef.current;
    
    setIsFiltering(true);
    setProgress(0);
    
    // If incremental processing is disabled, do everything at once
    if (!enableIncrementalProcessing || currentData.length <= chunkSize) {
      const results = currentData.filter(item => filterFn(item, currentFilters));
      setFilteredData(results);
      setIsFiltering(false);
      setProgress(100);
      return;
    }
    
    // Otherwise, process data in chunks
    let results: T[] = [];
    let processedCount = 0;
    const totalItems = currentData.length;
    
    // Process one chunk at a time
    const processNextChunk = (startIndex: number) => {
      const endIndex = Math.min(startIndex + chunkSize, totalItems);
      
      // Process this chunk
      for (let i = startIndex; i < endIndex; i++) {
        if (filterFn(currentData[i], currentFilters)) {
          results.push(currentData[i]);
        }
        processedCount++;
      }
      
      // Update progress
      const progressPercent = Math.floor((processedCount / totalItems) * 100);
      setProgress(progressPercent);
      
      // If there's more data to process, schedule the next chunk
      if (endIndex < totalItems) {
        setTimeout(() => processNextChunk(endIndex), 0);
      } else {
        // We're done
        setFilteredData(results);
        setIsFiltering(false);
        setProgress(100);
      }
    };
    
    // Start processing
    if (totalItems > 0) {
      processNextChunk(0);
    } else {
      setFilteredData([]);
      setIsFiltering(false);
      setProgress(100);
    }
  }, [enableIncrementalProcessing, chunkSize, filterFn]);
  
  // Create a debounced version of applyFilters
  const debouncedApplyFilters = useMemo(
    () => debounce(applyFilters, debounceTime),
    [applyFilters, debounceTime]
  );
  
  // Apply filters when data or filters change
  useEffect(() => {
    debouncedApplyFilters();
  }, [data, filters, debouncedApplyFilters]);
  
  // Update specific filter values
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters((prev: Record<string, any>) => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Reset all filters to initial state
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);
  
  // Calculate filter stats
  const filterStats = useMemo(() => {
    return {
      totalItems: data.length,
      filteredItems: filteredData.length,
      filterRatio: data.length > 0 ? filteredData.length / data.length : 0,
      activeFilterCount: Object.keys(filters).filter(
        key => {
          const value = filters[key];
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'string') return value.trim() !== '';
          return value !== undefined && value !== null && value !== false;
        }
      ).length
    };
  }, [data.length, filteredData.length, filters]);
  
  return {
    filteredData,
    filters,
    updateFilter,
    resetFilters,
    setFilters,
    isFiltering,
    progress,
    filterStats
  };
}
