import Papa from "papaparse"
import { getDeliveryData } from "@/lib/mongodb-client"

export interface DeliveryData {
  "Delivery Challan ID": string
  "Challan Date": string
  "Delivery Challan Number": string
  "Customer Name": string
  "Item Name": string
  "Item Total": string
  [key: string]: string
}

export interface ProcessedData {
  "Delivery Challan ID": string
  "Challan Date": string
  "Delivery Challan Number": string
  "Customer Name": string
  "Item Name": string
  "Item Total": string
  [key: string]: string | Date | number
  challanDate: Date
  itemNameCleaned: string
  category: string
  month: string
  year: number
  monthNum: number
  itemTotal: number
}

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
    "simba",
    "captain",
    "ferrari",
    "fountain",
  ],
  "Other Bulk Orders": ["biomass briquette", "nandi choona", "calcimag", "biomass", "nandi", "calcimag"],
}

const reverseMap: Record<string, string> = {}
Object.entries(categoryMap).forEach(([category, items]) => {
  items.forEach((item) => {
    reverseMap[item.toLowerCase()] = category
  })
})

import { getCloudinaryCSVFiles, downloadCSVFromCloudinary } from "./cloudinary"

export async function loadAndProcessData(): Promise<ProcessedData[]> {
  try {
    // First try to load data from MongoDB
    try {
      console.log("Attempting to load data from MongoDB");
      const mongoData = await getDeliveryData();
      
      if (mongoData && mongoData.length > 0) {
        console.log(`Loaded ${mongoData.length} records from MongoDB`);
        return mongoData as unknown as ProcessedData[];
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
        
        console.log("Loading CSV from Cloudinary:", latestFile.public_id);
        csvText = await downloadCSVFromCloudinary(latestFile.public_id);
      }
    } catch (cloudError) {
      console.warn("Failed to load from Cloudinary, falling back to local file:", cloudError);
    }
    
    // If both MongoDB and Cloudinary failed, use local fallback
    if (!csvText) {
      const response = await fetch("/data/delivery_challan.csv");
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      }
      csvText = await response.text();
    }

    return new Promise((resolve, reject) => {
      Papa.parse<DeliveryData>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          try {
            if (results.errors.length > 0) {
              console.warn("CSV parsing warnings:", results.errors)
            }

            const processedData: ProcessedData[] = results.data
              .filter((row) => {
                return (
                  row &&
                  row["Challan Date"] &&
                  row["Item Name"] &&
                  row["Item Total"] &&
                  row["Customer Name"] &&
                  row["Delivery Challan Number"]
                )
              })
              .map((row) => {
                try {
                  const challanDate = new Date(row["Challan Date"])
                  if (isNaN(challanDate.getTime())) {
                    throw new Error(`Invalid date: ${row["Challan Date"]}`)
                  }

                  const itemNameCleaned = (row["Item Name"] || "").trim().toLowerCase()
                  const category =
                    reverseMap[itemNameCleaned] || findCategoryByKeywords(itemNameCleaned) || "Uncategorized"

                  // Handle different number formats
                  const itemTotalStr = (row["Item Total"] || "0")
                    .toString()
                    .replace(/[₹,\s]/g, "")
                    .replace(/[^\d.-]/g, "")

                  const itemTotal = Number.parseFloat(itemTotalStr) || 0

                  return {
                    ...row,
                    challanDate,
                    itemNameCleaned,
                    category,
                    month: challanDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    }),
                    year: challanDate.getFullYear(),
                    monthNum: challanDate.getMonth() + 1,
                    itemTotal,
                  }
                } catch (error) {
                  console.warn("Error processing row:", row, error)
                  return null
                }
              })
              .filter((row): row is ProcessedData => row !== null && row.itemTotal > 0)

            console.log(`Successfully processed ${processedData.length} records from ${results.data.length} total rows`)

            if (processedData.length === 0) {
              throw new Error("No valid data found in CSV file")
            }

            resolve(processedData)
          } catch (error) {
            console.error("Error processing CSV data:", error)
            reject(error)
          }
        },
        error: (error: Error, file?: any) => {
          console.error("Papa Parse error:", error)
          reject(new Error(`CSV parsing failed: ${error.message}`))
        },
      })
    })
  } catch (error) {
    console.error("Error loading CSV:", error)
    throw new Error(`Failed to load data: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function findCategoryByKeywords(itemName: string): string | null {
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((keyword) => itemName.includes(keyword.toLowerCase()))) {
      return category
    }
  }
  return null
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "₹0"
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) {
    return "0"
  }

  return new Intl.NumberFormat("en-IN").format(num)
}
