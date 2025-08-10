// Client-side MongoDB interface that uses API routes
// No direct MongoDB imports in this file to keep it client compatible
import { DeliveryData, ProcessedData, CSVFileInfo as CSVFileInfoModel, FileUploadHistory } from '@/models';

/**
 * Interface for CSV file info (keeping for backward compatibility)
 */
export type CSVFileInfo = CSVFileInfoModel;

/**
 * Interface for MongoDB response
 */
interface MongoDBResponse {
  success: boolean;
  data?: any;
  error?: string;
  insertedId?: string;
}

/**
 * Store CSV file metadata in MongoDB via API
 */
export async function storeCSVFileInfo(fileInfo: CSVFileInfo): Promise<{insertedId: {toString: () => string}}> {
  try {
    const response = await fetch('/api/mongodb/store-csv-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fileInfo),
    });
    
    const result: MongoDBResponse = await response.json();
    
    if (!result.success || !result.insertedId) {
      throw new Error(result.error || 'Failed to store CSV file info');
    }
    
    // Return compatible structure with original function
    return {
      insertedId: {
        toString: () => result.insertedId!
      }
    };
  } catch (error) {
    console.error('Error storing CSV file info:', error);
    throw error;
  }
}

/**
 * Store delivery data in MongoDB via API
 */
export async function storeDeliveryData(data: any[], fileId: string): Promise<{ success: boolean, error?: string }> {
  try {
    const response = await fetch('/api/mongodb/store-delivery-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, fileId }),
    });
    
    const result: MongoDBResponse = await response.json();
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to store delivery data'
      };
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error storing delivery data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error storing delivery data'
    };
  }
}

/**
 * Get CSV file entries from MongoDB via API
 */
export async function getCSVFileEntries(): Promise<any[]> {
  try {
    const response = await fetch('/api/mongodb/get-csv-files');
    const result: MongoDBResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch CSV file entries');
    }
    
    return result.data || [];
  } catch (error) {
    console.error('Error fetching CSV file entries:', error);
    return [];
  }
}

/**
 * Get delivery data from MongoDB via API
 */
export async function getDeliveryData(fileId?: string): Promise<DeliveryData[]> {
  try {
    const url = fileId 
      ? `/api/mongodb/get-delivery-data?fileId=${encodeURIComponent(fileId)}`
      : '/api/mongodb/get-delivery-data';
      
    console.log("Fetching delivery data from:", url);
    const response = await fetch(url);
    const result: MongoDBResponse = await response.json();
    
    if (!result.success) {
      console.error("Failed to fetch delivery data:", result.error);
      throw new Error(result.error || 'Failed to fetch delivery data');
    }
    
    // Log record count
    const recordCount = Array.isArray(result.data) ? result.data.length : 0;
    console.log(`Retrieved ${recordCount} delivery records from MongoDB`);
    
    // Ensure the data is properly typed
    if (Array.isArray(result.data)) {
      return result.data.filter(item => 
        // Basic validation to ensure only valid data is returned
        item && 
        (item.deliveryChallanId || item["Delivery Challan ID"])
      );
    }
    
    console.warn("No valid data returned from MongoDB");
    return [];
  } catch (error) {
    console.error('Error fetching delivery data:', error);
    return [];
  }
}

/**
 * Delete all delivery data from MongoDB via API
 */
export async function deleteAllDeliveryData(): Promise<{ success: boolean, deletedCount?: number, error?: string }> {
  try {
    const response = await fetch('/api/mongodb/delete-all-delivery-data', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result: MongoDBResponse & { deletedCount?: number } = await response.json();
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete all delivery data'
      };
    }
    
    return {
      success: true,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    console.error('Error deleting all delivery data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting all delivery data'
    };
  }
}
