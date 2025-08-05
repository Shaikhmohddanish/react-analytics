/**
 * Utilities for efficiently processing large datasets
 */

/**
 * Processes data in chunks to avoid blocking the main thread
 * @param data The array of data to process
 * @param processFn The function to apply to each item
 * @param chunkSize The number of items to process in each chunk
 * @param onProgress Optional callback for progress updates
 * @returns Promise with processed data
 */
export async function processInChunks<T, R>(
  data: T[],
  processFn: (item: T) => R,
  chunkSize = 1000,
  onProgress?: (processedCount: number, total: number) => void
): Promise<R[]> {
  return new Promise((resolve) => {
    const total = data.length;
    const result: R[] = new Array(total);
    let processed = 0;
    
    // Process one chunk at a time
    function processChunk(startIndex: number) {
      const endIndex = Math.min(startIndex + chunkSize, total);
      
      // Process this chunk
      for (let i = startIndex; i < endIndex; i++) {
        result[i] = processFn(data[i]);
        processed++;
      }
      
      // Report progress
      if (onProgress) {
        onProgress(processed, total);
      }
      
      // If there's more data to process, schedule the next chunk with requestAnimationFrame
      if (endIndex < total) {
        window.requestAnimationFrame(() => processChunk(endIndex));
      } else {
        // We're done, resolve the promise
        resolve(result);
      }
    }
    
    // Start processing the first chunk
    if (total > 0) {
      processChunk(0);
    } else {
      resolve([]);
    }
  });
}

/**
 * Creates a paginated subset of data
 * @param data Full dataset
 * @param page Current page (1-based)
 * @param pageSize Number of items per page
 * @returns Object with paginated data and pagination info
 */
export function paginateData<T>(data: T[], page: number = 1, pageSize: number = 10) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      totalItems: data.length,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(data.length / pageSize),
      hasNextPage: endIndex < data.length,
      hasPreviousPage: page > 1
    }
  };
}

/**
 * Sorts data efficiently using memoization
 * @param data Data to sort
 * @param sortField Field to sort by
 * @param sortDirection Sort direction (asc or desc)
 * @returns Sorted data
 */
export function sortData<T>(
  data: T[],
  sortField: keyof T,
  sortDirection: 'asc' | 'desc' = 'asc'
): T[] {
  // Create a copy to avoid mutating the original array
  const sortedData = [...data];
  
  sortedData.sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    // Handle undefined or null values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
    if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
    
    // Compare based on value type
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // For numbers, dates, etc.
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    
    return 0;
  });
  
  return sortedData;
}

/**
 * Throttles a function to limit how often it can be called
 * @param func The function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const context = this;
    
    if (now - lastCall >= limit) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      func.apply(context, args);
    } else {
      // Save the latest arguments
      lastArgs = args;
      
      // If we don't have a timeout scheduled, schedule one
      if (timeoutId === null) {
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          timeoutId = null;
          if (lastArgs) {
            func.apply(context, lastArgs);
            lastArgs = null;
          }
        }, limit - (now - lastCall));
      }
    }
  };
}

/**
 * Debounces a function to delay its execution until after a period of inactivity
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const context = this;
    
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func.apply(context, args);
    }, wait);
  };
}
