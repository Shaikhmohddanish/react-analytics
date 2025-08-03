import Papa from "papaparse"
import { getDeliveryData } from "@/lib/mongodb-client"
import { getCloudinaryCSVFiles, downloadCSVFromCloudinary } from "./cloudinary"
import { ProcessedData, DeliveryData as DeliveryDataModel, convertToProcessedData } from "@/models"

// Import types for backward compatibility
export type { ProcessedData } from "@/models";
export type DeliveryData = {
  "Delivery Challan ID": string;
  "Challan Date": string;
  "Delivery Challan Number": string;
  "Customer Name": string;
  "Item Name": string;
  "Item Total": string;
  [key: string]: string;
};

// Cache for MongoDB data to prevent redundant API calls
let dataCache: {
  data: ProcessedData[];
  timestamp: number;
} = {
  data: [],
  timestamp: 0
};

// Cache expiry time in milliseconds (5 minutes)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

const categoryMap: Record<string, string[]> = {
  "Bio-Fertilizers": [
    "peek sanjivani - consortia",
    "bio surakshak - tryka (trichoderma)",
    "peek sanjivani - p (psb)",
    "sanjivani kit (5 ltrs)",
    "peek sanjivani - k (kmb)",
    "peek sanjivani - p (azotobacter)",
    "bio surakshak - ryzia (metarhizium)",
    "bio surakshak - rekha (psudomonas)",
    "peek sanjivani - n (azotobacter)",
    "sanjivani granules",
    "rhizo-vishwa (200 gm)",
    "consortia",
    "trichoderma",
    "psb",
    "azotobacter",
    "metarhizium",
    "psudomonas",
    "rhizo",
  ],
  Micronutrients: [
    "nutrisac kit - (50 kg)",
    "nutrisac kit - (25 kg)",
    "nutrisac kit - (10 kg)",
    "dimond kit 50kg",
    "micromax kit (50 kg)",
    "ferrous sulphate (feso4) - 20 kg",
    "nutrisac mg -20kg",
    "nutrisac fe - 10 kg",
    "nutrisac mg - 10 kg",
    "nutrisac fe  - 20 kg",
    "jackpot kit",
    "orient kit - (50 kg)",
    "magnesium sulphate (mgso4) - 20 kg",
    "orient kit - (53 kg)",
    "diamond kit 50kg",
    "ferrous sulphate - feso4 (20 kg bag)",
    "nutrisac",
    "micromax",
    "ferrous",
    "magnesium",
    "orient",
    "diamond",
  ],
  "Chelated Micronutrients": [
    "iron man - eddha ferrous (500 gm)",
    "micro man - fe (500 gm)",
    "micro man - fe (250 gm)",
    "micro man - zn (250 gm)",
    "micro man - zn (500 gm)",
    "micro man - pro (1 ltr)",
    "micro man - pro (500 ml)",
    "micro man pro (250 ml)",
    "iron man - eddha ferrous (1 kg)",
    "iron man",
    "micro man",
    "eddha",
  ],
  "Bio-Stimulants": [
    "titanic kit - (25 kg)",
    "jeeto - 95 (100 ml)",
    "jeeto - 95 (200 ml)",
    "flora - 95 (100 ml)",
    "flora - 95 (200 ml)",
    "mantra humic acid (500 gm)",
    "mantra humic acid (250 gm)",
    "mantra humic acid (1 kg)",
    "jeeto - 95 (400 ml)",
    "pickup - 99 (100 ml)",
    "pickup - 99 (200 ml)",
    "pickup - 99 (400 ml)",
    "micro man plus (250 gm)",
    "micro man plus (500 gm)",
    "flora - 95 (400 ml)",
    "boomer - 90 (100 ml)",
    "boomer - 90 (200 ml)",
    "boomer - 90 (400 ml)",
    "bingo 100 ml",
    "bingo 200 ml",
    "bingo 400 ml",
    "rainbow 200",
    "rainbow 400",
    "rainbow 100ml",
    "mantra humic acid (100 gm)",
    "zumbaa",
    "turma max",
    "simba",
    "captain (100 ml)",
    "ferrari (200 ml)",
    "ferrari (400 ml)",
    "bio stimulant - f",
    "bio stimulant - j",
    "ozone power (10 kg bucket)",
    "fountain 1 liter",
    "fountain 500 ml",
    "titanic",
    "jeeto",
    "flora",
    "humic",
    "pickup",
    "boomer",
    "bingo",
    "rainbow",
    "zumbaa",
    "turma",
  ],
}

/**
 * Load and process delivery data from various sources
 * 
 * Data sources are tried in this order:
 * 1. Cache (if not expired and not forcing refresh)
 * 2. MongoDB
 * 3. Cloudinary CSV file
 * 4. Local CSV file
 * 
 * @param forceRefresh Whether to bypass cache and force a refresh
 * @returns Processed delivery data
 */
export async function loadAndProcessData(forceRefresh = false): Promise<ProcessedData[]> {
  try {
    // Check cache first if not forcing refresh
    const currentTime = Date.now();
    if (!forceRefresh && 
        dataCache.data.length > 0 && 
        currentTime - dataCache.timestamp < CACHE_EXPIRY_TIME) {
      console.log(`Using cached data (${dataCache.data.length} records)`);
      return dataCache.data;
    }
    
    // First try to load data from MongoDB
    try {
      console.log("Attempting to load data from MongoDB");
      const mongoData = await getDeliveryData();
      
      if (mongoData && mongoData.length > 0) {
        console.log(`Loaded ${mongoData.length} records from MongoDB`);
        
        // Process the MongoDB data to ensure it matches our schema
        const processedData = mongoData.map((item: any): ProcessedData => {
          // Handle different data structures that might come from MongoDB
          // First try to interpret it as our normalized DeliveryDataModel
          if (item.deliveryChallanId !== undefined && 
              item.challanDate !== undefined && 
              item.deliveryChallanNumber !== undefined) {
            // Ensure challanDateObj is a proper Date
            let challanDateObj: Date;
            if (item.challanDateObj instanceof Date) {
              challanDateObj = item.challanDateObj;
            } else if (item.challanDateObj) {
              challanDateObj = new Date(item.challanDateObj);
            } else {
              challanDateObj = new Date(); // Default fallback
            }
            
            return {
              "Delivery Challan ID": item.deliveryChallanId || "",
              "Challan Date": item.challanDate || "",
              "Delivery Challan Number": item.deliveryChallanNumber || "",
              "Customer Name": item.customerName || "",
              "Item Name": item.itemName || "",
              "Item Total": item.itemTotalRaw || "0",
              challanDate: challanDateObj,
              itemNameCleaned: item.itemNameCleaned || "",
              category: item.category || "Other",
              month: item.month || "",
              year: item.year || 0,
              monthNum: item.monthNum || 0,
              itemTotal: item.itemTotal || 0
            };
          }
          
          // Otherwise, try to interpret it using the raw field names
          // Create a proper Date object for challanDate
          let challanDateObj: Date = new Date();
          
          // Try to parse date from item
          try {
            if (item.challanDate) {
              const parsed = new Date(item.challanDate);
              if (!isNaN(parsed.getTime())) {
                challanDateObj = parsed;
              }
            } else if (item["Challan Date"]) {
              const parsed = new Date(item["Challan Date"]);
              if (!isNaN(parsed.getTime())) {
                challanDateObj = parsed;
              }
            }
          } catch (e) {
            console.error("Error parsing date:", e);
          }
          
          return {
            "Delivery Challan ID": String(item.deliveryChallanId || item["Delivery Challan ID"] || ""),
            "Challan Date": String(item.challanDate || item["Challan Date"] || ""),
            "Delivery Challan Number": String(item.deliveryChallanNumber || item["Delivery Challan Number"] || ""),
            "Customer Name": String(item.customerName || item["Customer Name"] || ""),
            "Item Name": String(item.itemName || item["Item Name"] || ""),
            "Item Total": String(item.itemTotalRaw || item["Item Total"] || "0"),
            challanDate: challanDateObj,
            itemNameCleaned: String(item.itemName || item["Item Name"] || "").toLowerCase().trim(),
            category: String(item.category || "Other"),
            month: String(item.month || ""),
            year: Number(item.year || 0),
            monthNum: Number(item.monthNum || 0),
            itemTotal: typeof item.itemTotal === 'number' ? item.itemTotal : 0
          };
        });
        
        // Validate the processed data
        const validData = validateProcessedData(processedData);
        console.log(`Validated ${validData.length} records out of ${processedData.length}`);
        
        // Update cache with processed data
        dataCache = {
          data: validData,
          timestamp: currentTime
        };
        
        return dataCache.data;
      }
      
      console.log("No data found in MongoDB, falling back to CSV import");
    } catch (mongoError) {
      console.warn("Failed to load from MongoDB, falling back to CSV file:", mongoError);
    }
    
    let csvText = "";
    
    // Try loading from Cloudinary next
    try {
      const cloudFiles = await getCloudinaryCSVFiles();
      if (cloudFiles && cloudFiles.resources && cloudFiles.resources.length > 0) {
        // Use the most recently uploaded file
        const latestFile = cloudFiles.resources.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        console.log("Found CSV file in Cloudinary:", latestFile.public_id);
        csvText = await downloadCSVFromCloudinary(latestFile.public_id);
      } else {
        console.log("No CSV files found in Cloudinary, trying local file");
      }
    } catch (cloudError) {
      console.warn("Failed to load from Cloudinary, falling back to local CSV file:", cloudError);
    }
    
    // If no data from Cloudinary, try local file
    if (!csvText) {
      try {
        // Local file fallback
        const response = await fetch("/data/delivery_challan.csv");
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        csvText = await response.text();
        console.log("Loaded local CSV file");
      } catch (csvError) {
        console.error("Failed to load local CSV file:", csvError);
        throw new Error("No data could be loaded from any source");
      }
    }
    
    // Parse CSV data
    const parsed = Papa.parse(csvText, { 
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });
    
    if (!parsed.data || parsed.data.length === 0) {
      throw new Error("CSV file contains no data or is invalid");
    }

    // Process the data
    const processedData = (parsed.data as Record<string, unknown>[])
      .filter((row: Record<string, unknown>) => 
        // Filter out empty rows or rows without required fields
        row && 
        row["Challan Date"] && 
        row["Item Name"] && 
        row["Item Total"]
      )
      .map((row: Record<string, unknown>) => {
        try {
          // Process date
          const challanDateStr = String(row["Challan Date"]);
          const dateParts = challanDateStr.split('/');
          let challanDate: Date;
          
          if (dateParts.length === 3) {
            // Handle MM/DD/YYYY format
            const month = parseInt(dateParts[0], 10) - 1; // 0-indexed month
            const day = parseInt(dateParts[1], 10);
            let year = parseInt(dateParts[2], 10);
            
            // Handle 2-digit years
            if (year < 100) {
              year += year < 50 ? 2000 : 1900;
            }
            
            challanDate = new Date(year, month, day);
          } else {
            // Fallback for other formats
            challanDate = new Date(challanDateStr);
          }
          
          // Extract month and year
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const month = monthNames[challanDate.getMonth()];
          const year = challanDate.getFullYear();
          const monthNum = challanDate.getMonth() + 1;
          
          // Process item name
          const itemName = String(row["Item Name"] || "").toLowerCase().trim();
          
          // Determine category
          let category = "Other";
          for (const [cat, keywords] of Object.entries(categoryMap)) {
            if (keywords.some(keyword => itemName.includes(keyword))) {
              category = cat;
              break;
            }
          }
          
          // Parse item total
          let itemTotal = 0;
          if (row["Item Total"]) {
            // Remove currency symbols and commas, then parse
            const numStr = String(row["Item Total"])
              .replace(/[₹$,]/g, '')
              .trim();
            itemTotal = parseFloat(numStr) || 0;
          }
          
          // Create a properly typed object by explicitly defining each field
          const processedRow: ProcessedData = {
            "Delivery Challan ID": String(row["Delivery Challan ID"] || ""),
            "Challan Date": String(row["Challan Date"] || ""),
            "Delivery Challan Number": String(row["Delivery Challan Number"] || ""),
            "Customer Name": String(row["Customer Name"] || ""),
            "Item Name": String(row["Item Name"] || ""),
            "Item Total": String(row["Item Total"] || ""),
            challanDate,
            itemNameCleaned: itemName,
            category,
            month,
            year,
            monthNum,
            itemTotal
          };
          
          // Add any other fields from the original row
          for (const key in row) {
            if (
              key !== "Delivery Challan ID" && 
              key !== "Challan Date" && 
              key !== "Delivery Challan Number" && 
              key !== "Customer Name" && 
              key !== "Item Name" && 
              key !== "Item Total"
            ) {
              (processedRow as any)[key] = row[key];
            }
          }
          
          return processedRow;
        } catch (err) {
          console.error("Error processing row:", row, err);
          return null;
        }
      })
      .filter(Boolean) as ProcessedData[];

    // Update cache with processed data
    dataCache = {
      data: processedData,
      timestamp: currentTime
    };
      
    return processedData;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format a number with appropriate suffixes (K, M, B)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Validate processed data and remove invalid entries
 * 
 * @param data Data to validate
 * @returns Validated data array
 */
export function validateProcessedData(data: ProcessedData[]): ProcessedData[] {
  return data.filter(item => {
    // Basic validation - ensure required fields exist
    if (!item) return false;
    
    // Handle and fix date field if needed
    if (!item.challanDate) {
      return false;
    }
    
    // If challanDate isn't a Date object, try to convert it
    if (!(item.challanDate instanceof Date)) {
      try {
        // @ts-ignore - We know this might not be a Date yet
        item.challanDate = new Date(item.challanDate);
      } catch (e) {
        console.error("Failed to convert challanDate to Date object:", e);
        return false;
      }
    }
    
    // Check if it's a valid date after conversion
    if (isNaN(item.challanDate.getTime())) {
      return false;
    }
    
    // Validate item total
    if (typeof item.itemTotal !== 'number' || isNaN(item.itemTotal)) {
      // Try to convert if possible
      try {
        // Use "Item Total" string field instead if available
        if (item["Item Total"] && typeof item["Item Total"] === 'string') {
          const numStr = item["Item Total"].replace(/[₹$,]/g, '').trim();
          item.itemTotal = parseFloat(numStr) || 0;
        } else {
          item.itemTotal = 0;
        }
      } catch (e) {
        item.itemTotal = 0;
      }
    }
    
    // Ensure other required fields are present
    if (!item["Delivery Challan ID"] || !item["Item Name"]) {
      return false;
    }
    
    return true;
  });
}
