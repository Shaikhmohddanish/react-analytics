"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  CloudUpload, 
  CloudOff,
  Database
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Papa from "papaparse"
import { uploadCSVToCloudinary, getCloudinaryCSVFiles, downloadCSVFromCloudinary } from "@/lib/cloudinary"
import { storeCSVFileInfo, storeDeliveryData, getCSVFileEntries } from "@/lib/mongodb-client"
import { storeFileUploadHistory } from "@/lib/file-history-client"

interface DataImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: (data: any[], mode: "replace" | "append") => void
  existingDataCount: number
}

export function DataImportDialog({ open, onOpenChange, onImportComplete, existingDataCount }: DataImportDialogProps) {
  const [importMode, setImportMode] = useState<"replace" | "append">("replace")
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [cloudinaryFiles, setCloudinaryFiles] = useState<any[]>([])
  const [cloudinaryLoading, setCloudinaryLoading] = useState(false)
  const [selectedCloudinaryFile, setSelectedCloudinaryFile] = useState<string | null>(null)
  const [useCloud, setUseCloud] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const requiredColumns = [
    "Delivery Challan ID",
    "Challan Date",
    "Delivery Challan Number",
    "Customer Name",
    "Item Name",
    "Item Total",
  ]
  
  // Log available columns for debugging
  const logAvailableColumns = (fields: string[]) => {
    console.log("Available columns in CSV:", fields);
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      previewFile(selectedFile)
    }
  }

  const previewFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5, // Preview first 5 rows
      transformHeader: (header) => header.trim(),
      delimitersToGuess: [',', '\t', ';', '|'], // Try to guess delimiter
      complete: (results) => {
        console.log("CSV Preview Results:", results);
        console.log("Delimiter detected:", results.meta.delimiter);
        console.log("Sample data rows:", results.data.slice(0, 2));
        
        if (results.meta.fields) {
          logAvailableColumns(results.meta.fields);
        }
        setPreviewData(results.data)
        validateColumns(results.meta.fields || [])
      },
      error: (error: Error) => {
        console.error("CSV parsing error:", error);
        toast({
          title: "File parsing error",
          description: error.message,
          variant: "destructive",
        })
      },
    })
  }

  const validateColumns = (columns: string[]) => {
    // Log available columns for debugging
    console.log("Validating columns:", columns);
    
    const errors: string[] = []
    
    // Check for required fields using more flexible approach
    const hasDate = columns.some(col => col.includes("Date") || col.includes("date"));
    const hasItem = columns.some(col => col.includes("Item") || col.includes("Product") || col.includes("Description"));
    const hasTotal = columns.some(col => col.includes("Total") || col.includes("Amount") || col.includes("Price"));
    const hasCustomer = columns.some(col => col.includes("Customer") || col.includes("Client"));
    
    if (!hasDate) errors.push("Missing date column");
    if (!hasItem) errors.push("Missing item/product column");
    if (!hasTotal) errors.push("Missing total/amount column");
    if (!hasCustomer) errors.push("Missing customer/client column");
    
    // If more than 2 required types are missing, show warning
    if (errors.length > 2) {
      errors.push("This CSV file might not be in the expected format.");
    } else {
      // Clear errors if we have most of the needed fields - we'll try to process it anyway
      errors.length = 0;
    }

    setValidationErrors(errors)
  }
  
  // Load Cloudinary files when dialog opens
  useEffect(() => {
    if (open) {
      fetchCloudinaryFiles();
    }
  }, [open]);

  const fetchCloudinaryFiles = async () => {
    try {
      setCloudinaryLoading(true);
      
      // Get files from Cloudinary
      const cloudinaryResult = await getCloudinaryCSVFiles();
      
      // Get file entries from MongoDB to enhance with metadata
      const mongodbFiles = await getCSVFileEntries();
      
      // Combine results - prioritize MongoDB entries but include all Cloudinary files
      const combinedFiles = cloudinaryResult.resources.map((cloudFile: any) => {
        // Check if there's a matching MongoDB entry
        const matchingMongoFile = mongodbFiles.find(
          (mongoFile: any) => mongoFile.cloudinaryPublicId === cloudFile.public_id
        );
        
        if (matchingMongoFile) {
          // Return enhanced file with MongoDB data
          return {
            ...cloudFile,
            description: matchingMongoFile.description,
            recordCount: matchingMongoFile.recordCount,
            mongoId: matchingMongoFile._id.toString()
          };
        }
        
        // Just return the Cloudinary file data
        return cloudFile;
      });
      
      setCloudinaryFiles(combinedFiles || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast({
        title: "Storage Error",
        description: "Failed to fetch stored CSV files",
        variant: "destructive",
      });
    } finally {
      setCloudinaryLoading(false);
    }
  };

  const handleCloudinaryFileSelect = async (publicId: string) => {
    try {
      setSelectedCloudinaryFile(publicId);
      setImporting(true);
      setProgress(10);

      // Download the CSV from Cloudinary
      const csvContent = await downloadCSVFromCloudinary(publicId);
      setProgress(50);

      // Parse the CSV content
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results: Papa.ParseResult<any>) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }
          
          // Process the data and complete the import
          const processedData = processParseResults(results);
          setProgress(80);
          
          setTimeout(async () => {
            try {
              // Store CSV file metadata in MongoDB
              const fileName = publicId.split('/').pop() || "cloud-import";
              // Ensure filename ends with .csv
              const fileNameWithExt = fileName.toLowerCase().endsWith('.csv') ? fileName : `${fileName}.csv`;
              
              const fileInfo = await storeCSVFileInfo({
                fileName: fileNameWithExt,
                description: `Imported from Cloudinary on ${new Date().toLocaleDateString()}`,
                cloudinaryPublicId: publicId,
                cloudinaryUrl: publicId,
                recordCount: processedData.length
              });
              
              // Store the processed data in MongoDB
              const deliveryDataResult = await storeDeliveryData(processedData, fileInfo.insertedId.toString());
              if (!deliveryDataResult.success) {
                console.warn("Warning: MongoDB data storage had issues:", deliveryDataResult.error);
              }
              
              // Store file upload history with metadata
              const fileHistoryResult = await storeFileUploadHistory({
                fileName: publicId.split('/').pop() || "cloud-import",
                fileSize: csvContent.length, // Use content length as file size
                cloudinaryPublicId: publicId,
                cloudinaryUrl: publicId,
                recordCount: processedData.length,
                description: `Imported from Cloudinary on ${new Date().toLocaleDateString()}`
              });
              
              if (!fileHistoryResult.success) {
                console.warn("Warning: File history storage had issues:", fileHistoryResult.error);
              }
              
              setProgress(100);
              onImportComplete(processedData, importMode);
              toast({
                title: "Import successful",
                description: `Imported ${processedData.length.toLocaleString()} records from cloud storage`,
              });
              resetDialog();
            } catch (mongoError) {
              console.error("MongoDB storage error:", mongoError);
              toast({
                title: "Database Storage Warning",
                description: "Data imported successfully but there was an issue saving to the database.",
                variant: "destructive",
              });
              
              // Still complete the import even if MongoDB storage fails
              onImportComplete(processedData, importMode);
              resetDialog();
            }
          }, 500);
        },
        error: (error: Error) => {
          console.error("CSV parsing error:", error);
          toast({
            title: "Parsing error",
            description: error.message || "Failed to parse CSV data",
            variant: "destructive",
          });
          setImporting(false);
        },
      });
    } catch (error) {
      console.error("Error processing Cloudinary file:", error);
      toast({
        title: "Cloud Storage Error",
        description: "Failed to process the selected file",
        variant: "destructive",
      });
      setImporting(false);
    }
  };

  // Process parse results into the expected format
  const processParseResults = (results: Papa.ParseResult<any>) => {
    // Log the full data to help debug
    console.log("Processing CSV data, total rows:", results.data.length);
    
    // Filter out empty rows first
    const nonEmptyRows = results.data.filter(row => {
      return row && Object.keys(row).length > 0 && !Object.values(row).every(val => val === "");
    });
    
    console.log("Non-empty rows:", nonEmptyRows.length);
    
    return nonEmptyRows
      .filter((row: any) => {
        // More flexible check - check if the row has any data
        if (!row || Object.keys(row).length === 0) {
          return false;
        }
        
        // Check if row has at least some meaningful fields by looking at all keys
        const hasAnyDateField = Object.keys(row).some(k => 
          k.toLowerCase().includes('date') || k.toLowerCase().includes('time') || k.toLowerCase().includes('day')
        );
        
        const hasAnyItemField = Object.keys(row).some(k => 
          k.toLowerCase().includes('item') || k.toLowerCase().includes('product') || 
          k.toLowerCase().includes('descrip') || k.toLowerCase().includes('name')
        );
        
        const hasAnyTotalField = Object.keys(row).some(k => 
          k.toLowerCase().includes('total') || k.toLowerCase().includes('amount') || 
          k.toLowerCase().includes('price') || k.toLowerCase().includes('value')
        );
        
        // More lenient check - needs just 2 of the 3 required types of fields
        const hasRequiredFields = (hasAnyDateField && hasAnyItemField) || 
                                 (hasAnyDateField && hasAnyTotalField) || 
                                 (hasAnyItemField && hasAnyTotalField);
          
        if (!hasRequiredFields) {
          console.log("Filtering out row due to missing fields:", row);
        }
        
        return hasRequiredFields;
      })
      .map((row: any) => {
        try {
          const today = new Date();
          
          // Find fields using more flexible matching
          const dateField: string | undefined = Object.keys(row).find(k => 
            k.toLowerCase().includes('date') || k.toLowerCase().includes('time') || k.toLowerCase().includes('day')
          );
          
          const itemField: string | undefined = Object.keys(row).find(k => 
            k.toLowerCase().includes('item') || k.toLowerCase().includes('product') || 
            k.toLowerCase().includes('descrip') || k.toLowerCase().includes('name')
          );
          
          const totalField: string | undefined = Object.keys(row).find(k => 
            k.toLowerCase().includes('total') || k.toLowerCase().includes('amount') || 
            k.toLowerCase().includes('price') || k.toLowerCase().includes('value')
          );
          
          const customerField: string | undefined = Object.keys(row).find(k => 
            k.toLowerCase().includes('customer') || k.toLowerCase().includes('client') || 
            k.toLowerCase().includes('buyer') || k.toLowerCase().includes('company')
          );
          
          const challanField: string | undefined = Object.keys(row).find(k => 
            k.toLowerCase().includes('challan') || k.toLowerCase().includes('number') || 
            k.toLowerCase().includes('invoice') || k.toLowerCase().includes('id')
          );
          
          // Extract values with fallbacks
          const rawTotal = totalField ? row[totalField] : "0";
          const totalValue = typeof rawTotal === 'number' 
            ? rawTotal 
            : parseFloat((rawTotal + "").replace(/[^\d.-]/g, "")) || 0;
            
          // Get date value
          let challanDate = today;
          if (dateField && row[dateField]) {
            const parsedDate = new Date(row[dateField]);
            if (!isNaN(parsedDate.getTime())) {
              challanDate = parsedDate;
            }
          }
          
          // Extract values safely
          const itemName = itemField ? row[itemField] : "Unnamed Item";
          const customerName = customerField ? row[customerField] : "Unknown Customer";
          const challanNumber = challanField ? row[challanField] : `DC-${Date.now()}`;
          const itemNameCleaned = (itemName || "").toString().toLowerCase();
          
          // Category mapping (simplified version)
          const categoryMap: Record<string, string[]> = {
            "Bio-Fertilizers": [
              "consortia",
              "trichoderma",
              "psb",
              "azotobacter",
              "metarhizium",
              "psudomonas",
              "rhizo",
            ],
            Micronutrients: ["nutrisac", "micromax", "ferrous", "magnesium", "orient", "diamond"],
            "Chelated Micronutrients": ["iron man", "micro man", "eddha"],
            "Bio-Stimulants": [
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
            "Other Bulk Orders": ["biomass", "nandi", "calcimag"],
          }
  
          let category = "Uncategorized"
          for (const [cat, keywords] of Object.entries(categoryMap)) {
            if (keywords.some((keyword) => itemNameCleaned.includes(keyword))) {
              category = cat
              break
            }
          }
          
          return {
            ...row,
            "Challan Date": dateField ? row[dateField] : today.toISOString().split('T')[0],
            "Item Name": itemName,
            "Item Total": rawTotal,
            "Customer Name": customerName,
            "Delivery Challan Number": challanNumber,
            challanDate,
            itemTotal: totalValue,
            itemNameCleaned,
            category,
            month: challanDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            }),
            year: challanDate.getFullYear(),
            monthNum: challanDate.getMonth() + 1,
          };
        } catch (error) {
          console.warn("Error processing row:", row, error);
          return null;
        }
      })
      .filter((row: any): row is any => row !== null);
  };

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress(0)

    try {
      let cloudinaryResult = null;
      
      // If cloud storage is enabled, upload to Cloudinary first
      if (useCloud) {
        try {
          setProgress(10);
          toast({
            title: "Uploading to cloud storage",
            description: "Please wait while we upload your file...",
          });
          
          // Upload the file to Cloudinary using our secure server endpoint
          console.log("Starting Cloudinary upload via server endpoint for file:", file.name);
          console.log("File size:", file.size, "bytes");
          
          cloudinaryResult = await uploadCSVToCloudinary(file);
          console.log("Cloudinary upload successful, result:", cloudinaryResult);
          setProgress(30);
          
          if (!cloudinaryResult || !cloudinaryResult.secure_url) {
            console.error("Cloudinary upload response missing secure_url:", cloudinaryResult);
            toast({
              title: "Cloud Upload Warning",
              description: "File uploaded but response is missing expected fields. Continuing with import...",
              variant: "default", // Changed from "warning" to "default"
            });
          } else {
            toast({
              title: "Upload successful",
              description: "Your CSV file has been stored in the cloud",
            });
          }
        } catch (error) {
          console.error("Cloudinary upload error:", error);
          toast({
            title: "Cloud Upload Failed",
            description: error instanceof Error 
              ? `Error: ${error.message}. Continuing with local import only.`
              : "Continuing with local import only",
            variant: "destructive",
          });
          // Even if cloudinary fails, we'll continue with local import
          console.log("Proceeding with local import despite cloud upload failure");
        }
      }
      
      // Continue with local parsing
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: "",  // Auto-detect delimiter
        delimitersToGuess: [',', '\t', ';', '|'], // Try to guess delimiter
        comments: false,
        dynamicTyping: true, // Automatically convert types
        transformHeader: (header: string) => header.trim(),
        step: (results: Papa.ParseStepResult<any>, parser: any) => {
          // Update progress during parsing
          const progress = Math.round((results.meta.cursor / file.size) * 100)
          setProgress(Math.min(80, 30 + progress * 0.5)); // Scale to leave room for upload progress
          
          // Log steps for debugging
          if (results.meta.cursor < 1000) {
            console.log("Parsing step:", results.data);
          }
        },
        complete: async (results: Papa.ParseResult<any>) => {
          try {
            if (results.errors.length > 0) {
              console.warn("CSV parsing warnings:", results.errors)
            }
  
            // Debug what data we're working with
          console.log("Data before processing:", results.data.slice(0, 3));
          console.log("Available columns:", results.meta.fields);
          
          // Use a more flexible approach for column matching
          let processedData = results.data
              .filter((row: any) => {
                // Ensure row has some data
                if (!row || Object.keys(row).length === 0) return false;
                
                // Find date, item, total and customer fields with flexible matching
                const dateField = Object.keys(row).find(k => 
                  k.toLowerCase().includes('date') || k.toLowerCase().includes('challan')
                );
                const itemField = Object.keys(row).find(k => 
                  k.toLowerCase().includes('item') || k.toLowerCase().includes('product') || k.toLowerCase().includes('description')
                );
                const totalField = Object.keys(row).find(k => 
                  k.toLowerCase().includes('total') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('price')
                );
                const customerField = Object.keys(row).find(k => 
                  k.toLowerCase().includes('customer') || k.toLowerCase().includes('client') || k.toLowerCase().includes('name')
                );
                
                // For debugging
                if (!dateField || !itemField || !totalField || !customerField) {
                  console.log("Filtering out row due to missing fields:", {
                    row, 
                    hasDate: !!dateField, 
                    hasItem: !!itemField, 
                    hasTotal: !!totalField, 
                    hasCustomer: !!customerField
                  });
                }
                
                return !!(dateField && itemField && totalField && customerField);
              })
              .map((row: any) => {
                try {
                  // Find the date field using flexible matching
                  const dateField = Object.keys(row).find(k => 
                    k.toLowerCase().includes('date') || k.toLowerCase().includes('challan')
                  ) || "Challan Date";
                  
                  // Parse date
                  const challanDate = new Date(row[dateField])
                  if (isNaN(challanDate.getTime())) {
                    console.warn(`Invalid date: ${row[dateField]} for row:`, row);
                    // Set a default date instead of throwing
                    return null;
                  }
  
                  // Find field names using flexible matching
                  const totalField = Object.keys(row).find(k => 
                    k.toLowerCase().includes('total') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('price')
                  ) || "Item Total";
                  
                  const itemField = Object.keys(row).find(k => 
                    k.toLowerCase().includes('item') || k.toLowerCase().includes('product') || k.toLowerCase().includes('description')
                  ) || "Item Name";
                  
                  const customerField = Object.keys(row).find(k => 
                    k.toLowerCase().includes('customer') || k.toLowerCase().includes('client') || k.toLowerCase().includes('name')
                  ) || "Customer Name";
                  
                  const challanField = Object.keys(row).find(k => 
                    k.toLowerCase().includes('challan') && k.toLowerCase().includes('number')
                  ) || "Delivery Challan Number";
                  
                  // Clean and parse item total
                  const itemTotalStr = (row[totalField] || "0")
                    .toString()
                    .replace(/[₹,\s]/g, "")
                    .replace(/[^\d.-]/g, "")
  
                  const itemTotal = Number.parseFloat(itemTotalStr) || 0
  
                  // Clean item name for category mapping
                  const itemNameCleaned = (row[itemField] || "").trim().toLowerCase()
  
                  // Category mapping (simplified version)
                  const categoryMap: Record<string, string[]> = {
                    "Bio-Fertilizers": [
                      "consortia",
                      "trichoderma",
                      "psb",
                      "azotobacter",
                      "metarhizium",
                      "psudomonas",
                      "rhizo",
                    ],
                    Micronutrients: ["nutrisac", "micromax", "ferrous", "magnesium", "orient", "diamond"],
                    "Chelated Micronutrients": ["iron man", "micro man", "eddha"],
                    "Bio-Stimulants": [
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
                    "Other Bulk Orders": ["biomass", "nandi", "calcimag"],
                  }
  
                  let category = "Uncategorized"
                  for (const [cat, keywords] of Object.entries(categoryMap)) {
                    if (keywords.some((keyword) => itemNameCleaned.includes(keyword))) {
                      category = cat
                      break
                    }
                  }
  
                  // Create a standardized object with our expected fields
                  return {
                    ...row,
                    "Challan Date": row[dateField] || row["Challan Date"],
                    "Item Name": row[itemField] || row["Item Name"],
                    "Item Total": row[totalField] || row["Item Total"],
                    "Customer Name": row[customerField] || row["Customer Name"],
                    "Delivery Challan Number": row[challanField] || row["Delivery Challan Number"] || "Unknown",
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
              .filter((row): row is any => row !== null)
  
            setProgress(90)
  
            // Log how many rows were processed
            console.log(`Processed ${processedData.length} rows out of ${results.data.length} total rows`);
  
            if (processedData.length === 0 && results.data.length > 0) {
              // If we have data but couldn't process any of it, try a fallback approach
              console.error("Filtered data is empty. Original data:", results.data.slice(0, 5));
              console.log("Attempting fallback processing method...");
              
              // Fallback: Just use the raw data with minimal validation
              const fallbackData = results.data
                .filter(row => row && Object.keys(row).length > 0)
                .map((row: any, index: number) => {
                  // Create basic required fields for MongoDB storage
                  const today = new Date();
                  
                  // Find the best fields available using a more aggressive approach
                  const bestDateField: string | undefined = Object.keys(row).find(k => 
                    k.toLowerCase().includes('date') || k.toLowerCase().includes('time') || k.toLowerCase().includes('day')
                  );
                  
                  const bestItemField: string | undefined = Object.keys(row).find(k => 
                    k.toLowerCase().includes('item') || k.toLowerCase().includes('product') || 
                    k.toLowerCase().includes('descrip') || k.toLowerCase().includes('name')
                  );
                  
                  const bestAmountField: string | undefined = Object.keys(row).find(k => 
                    k.toLowerCase().includes('total') || k.toLowerCase().includes('amount') || 
                    k.toLowerCase().includes('price') || k.toLowerCase().includes('value') || 
                    k.toLowerCase().includes('sum')
                  );
                  
                  const bestCustomerField: string | undefined = Object.keys(row).find(k => 
                    k.toLowerCase().includes('customer') || k.toLowerCase().includes('client') || 
                    k.toLowerCase().includes('buyer') || k.toLowerCase().includes('name') || 
                    k.toLowerCase().includes('company')
                  );

                  const bestChallanField: string | undefined = Object.keys(row).find(k => 
                    k.toLowerCase().includes('challan') || k.toLowerCase().includes('number') || 
                    k.toLowerCase().includes('id') || k.toLowerCase().includes('invoice')
                  );
                  
                  // Try to parse a date value or use current date
                  let challanDate = today;
                  if (bestDateField && row[bestDateField]) {
                    const parsedDate = new Date(row[bestDateField]);
                    if (!isNaN(parsedDate.getTime())) {
                      challanDate = parsedDate;
                    }
                  }
                  
                  // Try to extract a numeric value for item total
                  let itemTotal = 0;
                  if (bestAmountField && row[bestAmountField]) {
                    const amountStr = (row[bestAmountField] + "").replace(/[^\d.-]/g, "");
                    itemTotal = parseFloat(amountStr) || 0;
                  }
                  
                  const itemName = bestItemField ? (row[bestItemField] || `Item ${index + 1}`) : `Item ${index + 1}`;
                  const customerName = bestCustomerField ? (row[bestCustomerField] || "Unknown Customer") : "Unknown Customer";
                  const challanNumber = bestChallanField ? (row[bestChallanField] || `DC-${Date.now()}-${index}`) : `DC-${Date.now()}-${index}`;
                  const dateString = bestDateField ? (row[bestDateField] || today.toISOString().split('T')[0]) : today.toISOString().split('T')[0];
                  const totalString = bestAmountField ? (row[bestAmountField] || "0") : "0";
                  
                  return {
                    ...row, // Keep all original fields
                    
                    // Add standardized fields
                    "Challan Date": dateString,
                    "Item Name": itemName,
                    "Item Total": totalString,
                    "Customer Name": customerName,
                    "Delivery Challan Number": challanNumber,
                    
                    // Add processed fields
                    challanDate,
                    itemTotal,
                    itemNameCleaned: itemName.toString().toLowerCase(),
                    category: "Uncategorized",
                    month: challanDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    }),
                    year: challanDate.getFullYear(),
                    monthNum: challanDate.getMonth() + 1
                  };
                });
              
              processedData = fallbackData;
              
              console.log("Fallback processing created", processedData.length, "records");
            }
            
            if (processedData.length === 0) {
              throw new Error("No valid data could be extracted from the CSV file. The file appears to be empty or in an unrecognized format.")
            }
            
            // Store CSV file metadata in MongoDB
            let fileInfo;
            try {
              console.log("Storing CSV file metadata in MongoDB...");
              fileInfo = await storeCSVFileInfo({
                fileName: file.name,
                description: `Imported on ${new Date().toLocaleDateString()}`,
                cloudinaryPublicId: cloudinaryResult?.public_id || null,
                cloudinaryUrl: cloudinaryResult?.secure_url || null,
                recordCount: processedData.length
              });
              console.log("CSV file metadata stored successfully with ID:", fileInfo.insertedId.toString());
            } catch (error) {
              console.error("Failed to store CSV file metadata:", error);
              throw new Error(`MongoDB error storing file metadata: ${error instanceof Error ? error.message : String(error)}`);
            }
            
            // Store the processed data in MongoDB
            try {
              console.log(`Storing ${processedData.length} delivery records in MongoDB...`);
              const deliveryDataResult = await storeDeliveryData(processedData, fileInfo.insertedId.toString());
              if (!deliveryDataResult.success) {
                throw new Error(deliveryDataResult.error || "Unknown error storing delivery data");
              }
              console.log("Delivery data stored successfully");
            } catch (error) {
              console.error("Failed to store delivery data:", error);
              throw new Error(`MongoDB error storing delivery data: ${error instanceof Error ? error.message : String(error)}`);
            }
            
            // Store file upload history
            try {
              console.log("Storing file upload history...");
              const fileHistoryResult = await storeFileUploadHistory({
                fileName: file.name,
                fileSize: file.size,
                cloudinaryPublicId: cloudinaryResult?.public_id || null,
                cloudinaryUrl: cloudinaryResult?.secure_url || null,
                recordCount: processedData.length,
                description: `Imported on ${new Date().toLocaleDateString()}`
              });
              
              if (fileHistoryResult.success) {
                console.log("File upload history stored successfully");
              } else {
                console.warn("Warning: File history storage had issues:", fileHistoryResult.error);
              }
            } catch (error) {
              console.error("Failed to store file upload history:", error);
              // Non-critical, don't throw
            }
            
            setProgress(100);
            
            toast({
              title: "Import successful",
              description: `Processed ${processedData.length} records from ${results.data.length} total rows. Data stored in MongoDB.`,
            });
            
            onImportComplete(processedData, importMode);
            onOpenChange(false);
            resetDialog();
          } catch (error) {
            console.error("Error in complete handler:", error);
            setImporting(false);
            toast({
              title: "Import Error",
              description: error instanceof Error ? error.message : "Unknown error occurred",
              variant: "destructive",
            });
          }
        },
        error: (error: Error) => {
          throw new Error(`CSV parsing failed: ${error.message}`);
        },
      });
    } catch (error) {
      console.error("Import error:", error);
      // Check if this is a MongoDB specific error
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      const isMongoDBError = errorMessage.includes("MongoDB") || 
                           errorMessage.includes("database") || 
                           errorMessage.includes("collection");
      
      toast({
        title: isMongoDBError ? "Database storage failed" : "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If MongoDB failed but we might have a cloudinary URL, provide guidance
      if (isMongoDBError && errorMessage.includes("Cloudinary")) {
        toast({
          title: "File upload partially succeeded",
          description: "The file was uploaded to cloud storage, but there was an error saving to the database. Try again when the database connection is restored.",
          variant: "default",
        });
      }
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const resetDialog = () => {
    setFile(null)
    setPreviewData([])
    setValidationErrors([])
    setProgress(0)
    setImporting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    if (!importing) {
      resetDialog()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </DialogTitle>
          <DialogDescription>Upload a CSV file to import delivery challan data into the dashboard</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Import Mode</Label>
            <RadioGroup value={importMode} onValueChange={(value: "replace" | "append") => setImportMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  Replace all existing data
                  {existingDataCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      (will remove {existingDataCount.toLocaleString()} existing records)
                    </span>
                  )}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="append" id="append" />
                <Label htmlFor="append" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Append to existing data
                  {existingDataCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      (add to {existingDataCount.toLocaleString()} existing records)
                    </span>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Cloud Storage Option */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Storage Options</Label>
            <RadioGroup value={useCloud ? "cloud" : "local"} onValueChange={(value: string) => setUseCloud(value === "cloud")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cloud" id="cloud" />
                <Label htmlFor="cloud" className="flex items-center gap-2">
                  <CloudUpload className="h-4 w-4 text-blue-500" />
                  Use Cloud Storage
                  <span className="text-sm text-muted-foreground">
                    (Store CSV file in Cloudinary for future use)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="local" id="local" />
                <Label htmlFor="local" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Local Import Only
                  <span className="text-sm text-muted-foreground">
                    (Don't store file in cloud)
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Cloudinary Stored Files */}
          {useCloud && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Previously Uploaded Files</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchCloudinaryFiles}
                  disabled={cloudinaryLoading}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {cloudinaryLoading ? "Loading..." : "Refresh"}
                </Button>
              </div>
              
              <div className="border rounded-md p-2 h-36 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {cloudinaryLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                    <span>Loading files...</span>
                  </div>
                ) : cloudinaryFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <CloudOff className="h-8 w-8 mb-2" />
                    <span>No stored files found</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {cloudinaryFiles.map((file) => (
                      <div 
                        key={file.public_id} 
                        className={`
                          flex flex-col p-2 rounded hover:bg-accent cursor-pointer
                          ${selectedCloudinaryFile === file.public_id ? 'bg-primary/10 border border-primary/30' : ''}
                        `}
                        onClick={() => handleCloudinaryFileSelect(file.public_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm font-medium">
                              {file.public_id.split('/').pop() || 'Untitled File'}
                              {!file.public_id.toLowerCase().includes('.csv') && '.csv'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(file.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Show MongoDB metadata if available */}
                        {file.recordCount && (
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {file.recordCount.toLocaleString()} records
                            </span>
                            {file.description && (
                              <span className="text-xs text-muted-foreground max-w-48 truncate" title={file.description}>
                                {file.description}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select CSV File</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={importing}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="mb-2"
              >
                <FileText className="h-4 w-4 mr-2" />
                Choose CSV File
              </Button>
              <p className="text-sm text-muted-foreground">Select a CSV file with delivery challan data</p>
              {file && (
                <p className="text-sm font-medium mt-2 text-green-600">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Validation Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Data Preview */}
          {previewData.length > 0 && validationErrors.length === 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Data Preview (First 5 rows)</Label>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {requiredColumns.map((col) => (
                        <th key={col} className="p-2 text-left font-medium border-r">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                        {requiredColumns.map((col) => (
                          <td key={col} className="p-2 border-r max-w-32 truncate" title={row[col]}>
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Import Progress</Label>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">Processing CSV file... Please wait.</p>
            </div>
          )}

          {/* Required Columns Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Required Columns:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {requiredColumns.map((col) => (
                <div key={col} className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {col}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          {useCloud && (
            <div className="text-xs text-blue-600 flex items-center mr-auto">
              <CloudUpload className="h-3 w-3 mr-1" />
              Cloud storage enabled
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={importing}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={(!file && !selectedCloudinaryFile) || validationErrors.length > 0 || importing}
              variant="default"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : selectedCloudinaryFile ? (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Import from Cloud
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data {useCloud && "& Save to Cloud"}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
