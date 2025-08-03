/**
 * Data models for the delivery analytics system
 * These models represent the structure of data throughout the application
 */

import { ObjectId } from 'mongodb';

/**
 * Base interface for MongoDB documents
 */
export interface MongoDocument {
  _id?: string | ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Raw delivery data from CSV or initial import
 */
export interface DeliveryDataRaw {
  "Delivery Challan ID": string;
  "Challan Date": string;
  "Delivery Challan Number": string;
  "Customer Name": string;
  "Item Name": string;
  "Item Total": string;
  [key: string]: string;
}

/**
 * CSV File metadata
 */
export interface CSVFileInfo extends MongoDocument {
  fileName: string;
  description?: string;
  cloudinaryPublicId?: string | null;
  cloudinaryUrl?: string | null;
  recordCount?: number;
  uploadDate: Date;
  lastAccessDate: Date;
  fileSize?: number;
}

/**
 * File upload history record
 */
export interface FileUploadHistory extends MongoDocument {
  fileName: string;
  fileSize: number;
  cloudinaryPublicId: string | null;
  cloudinaryUrl: string | null;
  recordCount: number;
  importDate: Date;
  description?: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Processed delivery data with calculated fields
 */
export interface DeliveryData extends MongoDocument {
  // Original fields from CSV
  deliveryChallanId: string;
  challanDate: string;
  deliveryChallanNumber: string;
  customerName: string;
  itemName: string;
  itemTotalRaw: string;
  
  // Processed fields
  challanDateObj: Date | null;
  month: string;
  year: number;
  monthNum: number;
  itemTotal: number;
  itemNameCleaned: string;
  category: string;
  
  // Additional metadata
  fileId: string | ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fully processed data for frontend use
 */
export interface ProcessedData {
  // Original fields with string type
  "Delivery Challan ID": string;
  "Challan Date": string;
  "Delivery Challan Number": string;
  "Customer Name": string;
  "Item Name": string;
  "Item Total": string;
  
  // Additional fields for analytics
  challanDate: Date; // Must be a proper Date object
  itemNameCleaned: string;
  category: string;
  month: string;
  year: number;
  monthNum: number;
  itemTotal: number;
  
  // Any other dynamic fields
  [key: string]: string | Date | number;
}

/**
 * Analytics data used for charts and summaries
 */
export interface AnalyticsSummary {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  topCategory: string;
  categorySales: Record<string, number>;
  monthlySales: Record<string, number>;
  customerSales: Record<string, number>;
}

/**
 * Convert MongoDB document fields to proper format
 */
export function normalizeMongoData(data: any): DeliveryData {
  // Process date object first to ensure it's valid
  let challanDateObj = null;
  
  if (data.challanDateObj) {
    // If already a Date object, use it
    if (data.challanDateObj instanceof Date) {
      challanDateObj = data.challanDateObj;
    } else {
      // Try to convert to Date
      try {
        const parsed = new Date(data.challanDateObj);
        if (!isNaN(parsed.getTime())) {
          challanDateObj = parsed;
        }
      } catch (e) {
        console.error("Error parsing date object:", e);
      }
    }
  } 
  
  // If still null, try to parse from string date
  if (!challanDateObj && data.challanDate) {
    try {
      const parsed = new Date(data.challanDate);
      if (!isNaN(parsed.getTime())) {
        challanDateObj = parsed;
      }
    } catch (e) {
      console.error("Error parsing date string:", e);
    }
  }
  
  // If still null, use current date as fallback
  if (!challanDateObj) {
    challanDateObj = new Date();
  }
  
  return {
    // Convert MongoDB _id to string if it exists
    _id: data._id ? (typeof data._id === 'string' ? data._id : data._id.toString()) : undefined,
    
    // Original fields from CSV with proper naming
    deliveryChallanId: data.deliveryChallanId || data["Delivery Challan ID"] || "",
    challanDate: data.challanDate || data["Challan Date"] || "",
    deliveryChallanNumber: data.deliveryChallanNumber || data["Delivery Challan Number"] || "",
    customerName: data.customerName || data["Customer Name"] || "",
    itemName: data.itemName || data["Item Name"] || "",
    itemTotalRaw: data.itemTotalRaw || String(data["Item Total"] || "0"),
    
    // Processed date fields
    challanDateObj,
    month: data.month || "",
    year: typeof data.year === 'number' ? data.year : 0,
    monthNum: typeof data.monthNum === 'number' ? data.monthNum : 0,
    
    // Processed numeric and category fields
    itemTotal: typeof data.itemTotal === 'number' ? data.itemTotal : 0,
    itemNameCleaned: data.itemNameCleaned || "",
    category: data.category || "Other",
    
    // Metadata
    fileId: data.fileId ? (typeof data.fileId === 'string' ? data.fileId : data.fileId.toString()) : "",
    createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
    updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date()
  };
}

/**
 * Convert normalized data to frontend-friendly format
 */
export function convertToProcessedData(data: DeliveryData): ProcessedData {
  // Ensure challanDate is a proper Date object
  let challanDateObj: Date;
  
  if (data.challanDateObj instanceof Date) {
    challanDateObj = data.challanDateObj;
  } else if (data.challanDateObj) {
    // Try to parse from existing object
    try {
      challanDateObj = new Date(data.challanDateObj);
      if (isNaN(challanDateObj.getTime())) {
        challanDateObj = new Date(); // Default to current date if invalid
      }
    } catch (e) {
      challanDateObj = new Date(); // Default to current date if parsing fails
    }
  } else {
    // Try to parse from string date
    try {
      challanDateObj = new Date(data.challanDate);
      if (isNaN(challanDateObj.getTime())) {
        challanDateObj = new Date(); // Default to current date if invalid
      }
    } catch (e) {
      challanDateObj = new Date(); // Default to current date if parsing fails
    }
  }
  
  const processed: ProcessedData = {
    "Delivery Challan ID": data.deliveryChallanId,
    "Challan Date": data.challanDate,
    "Delivery Challan Number": data.deliveryChallanNumber,
    "Customer Name": data.customerName,
    "Item Name": data.itemName,
    "Item Total": data.itemTotalRaw,
    challanDate: challanDateObj,
    itemNameCleaned: data.itemNameCleaned,
    category: data.category,
    month: data.month,
    year: data.year,
    monthNum: data.monthNum,
    itemTotal: data.itemTotal
  };
  
  return processed;
}
