/**
 * Utility for offloading heavy data processing to Web Workers
 */

// Define function to run in worker
export type WorkerFunction<T, R> = (data: T) => R

// Create a typed worker creator
export function createDataWorker<T, R>(processingFn: WorkerFunction<T, R>): (data: T) => Promise<R> {
  // Create a function that will be stringified and sent to the web worker
  const workerScript = (workerFnStr: string) => {
    // Parse the serialized function
    // @ts-ignore - this is running in the web worker context
    const fn = new Function('return ' + workerFnStr)();
    
    // Listen for messages from the main thread
    // @ts-ignore - this is running in the web worker context
    self.addEventListener('message', (e) => {
      try {
        // Process the data
        // @ts-ignore - this is running in the web worker context
        const result = fn(e.data);
        // Send the result back to the main thread
        // @ts-ignore - this is running in the web worker context
        self.postMessage({ success: true, result });
      } catch (error) {
        // Send any errors back to the main thread
        // @ts-ignore - this is running in the web worker context
        self.postMessage({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  };

  // Return a function that creates a worker and processes data
  return (data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      // Check if Web Workers are supported
      if (typeof Worker === 'undefined') {
        // Fall back to processing on the main thread
        try {
          const result = processingFn(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
        return;
      }
      
      // Create a blob URL for the worker script
      const workerFnStr = processingFn.toString();
      const blob = new Blob(
        [`(${workerScript.toString()})(${JSON.stringify(workerFnStr)})`],
        { type: 'application/javascript' }
      );
      const url = URL.createObjectURL(blob);
      
      // Create the worker
      const worker = new Worker(url);
      
      // Listen for messages from the worker
      worker.onmessage = (e) => {
        if (e.data.success) {
          resolve(e.data.result);
        } else {
          reject(new Error(e.data.error));
        }
        
        // Clean up
        worker.terminate();
        URL.revokeObjectURL(url);
      };
      
      // Handle worker errors
      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
        URL.revokeObjectURL(url);
      };
      
      // Send data to the worker
      worker.postMessage(data);
    });
  };
}

// Example usage:
/*
// Define a CPU-intensive function
const calculateProductMetrics = (data: ProcessedData[]) => {
  // Heavy processing logic
  return processedData;
};

// Create a worker processor
export const processProductDataInWorker = createDataWorker(calculateProductMetrics);

// Use in component
useEffect(() => {
  const processData = async () => {
    try {
      setLoading(true);
      const result = await processProductDataInWorker(rawData);
      setProcessedData(result);
    } catch (error) {
      console.error("Error processing data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  processData();
}, [rawData]);
*/
