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
import { validateCSV, fixCSVFormat } from "@/lib/csv-utils"

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

  const previewFile = async (file: File) => {
    try {
      // Validate the CSV file first
      const validation = await validateCSV(file);
      
      if (!validation.valid) {
        console.error("CSV validation error:", validation.message);
        
        // If we have some data despite validation issues, show it anyway
        if (validation.data && validation.data.length > 0) {
          console.log("Using partial data for preview despite validation issues");
          setPreviewData(validation.data.slice(0, 5));
          if (validation.meta?.fields) {
            validateColumns(validation.meta.fields);
            logAvailableColumns(validation.meta.fields);
          }
        } else {
          // Show error toast if no usable data
          toast({
            title: "CSV Validation Error",
            description: validation.message,
            variant: "destructive",
          });
          return;
        }
      } else {
        // File is valid, set the preview data
        setPreviewData(validation.data?.slice(0, 5) || []);
        if (validation.meta?.fields) {
          validateColumns(validation.meta.fields);
          logAvailableColumns(validation.meta.fields);
        }
        
        console.log("CSV Preview Results:", validation);
        console.log("Delimiter detected:", validation.meta?.delimiter);
        console.log("Sample data rows:", validation.data?.slice(0, 2));
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "File processing error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    }
  }

  const validateColumns = (columns: string[]) => {
    const requiredColumns = [
      "Delivery Challan ID",
      "Challan Date",
      "Delivery Challan Number",
      "Customer Name",
      "Item Name",
      "Item Total",
    ];
    
    // Make column validation more flexible
    const missingColumns = requiredColumns.filter((col) => !columns.some((column) => column.toLowerCase().includes(col.toLowerCase())));
    
    if (missingColumns.length > 0) {
      setValidationErrors(missingColumns.map(col => `Missing column: ${col}`));
    } else {
      setValidationErrors([]);  // Clear validation errors if columns are valid
    }
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

      // Download the CSV from Cloudinary as text
      const response = await fetch(`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${publicId}`);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const csvContent = await response.text();
      setProgress(50);

      // Fix: Remove BOM if present to avoid parsing issues
      const csvContentClean = csvContent.charCodeAt(0) === 0xFEFF ? csvContent.slice(1) : csvContent;

      // Parse the CSV content
      console.log("Raw CSV Content:", csvContent.slice(0, 500));
      console.log("Clean CSV content snippet:", csvContentClean.slice(0, 200));
      Papa.parse(csvContentClean, {
        header: true,
        skipEmptyLines: true,
        delimiter: ",",  // Force delimiter to comma
        dynamicTyping: true,
        transformHeader: (header: string) => header.trim(),
        complete: async (results: Papa.ParseResult<any>) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }
          
          // Log raw data for debugging
          console.log("Raw CSV data:", results.data.slice(0, 5));
          console.log("CSV fields:", results.meta.fields);
          if (!results.meta.fields) {
            console.error("Failed to detect headers in cloud CSV. Check file format.");
          }
          
          if (results.data.length === 0) {
            toast({
              title: "Invalid Data",
              description: "No valid data was found in the CSV file.",
              variant: "destructive",
            });
            setImporting(false);
            return;
          }
          
          // Process the data and complete the import
          const processedData = processParseResults(results);
          setProgress(80);
          
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
              recordCount: processedData.length,
              uploadDate: new Date(),
              lastAccessDate: new Date()
            });
            
            // Store the processed data in MongoDB
            console.log("Storing delivery data in MongoDB, data length:", processedData.length);
            const deliveryDataResult = await storeDeliveryData(processedData, fileInfo.insertedId.toString());
            console.log("MongoDB store delivery data result:", deliveryDataResult);
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
        
        // Log available columns for the first few rows to help with debugging
        if (nonEmptyRows.indexOf(row) < 3) {
          console.log("Available columns for row:", Object.keys(row));
        }
        
        return true; // Keep all non-empty rows for processing
      })
      .map((row: any) => {
        try {
          const today = new Date();
          
          // IMPROVED COLUMN DETECTION LOGIC
          // Improved date field detection – look for "date" but exclude "id" or "number"
          const dateField = Object.keys(row).find(k => {
            const kl = k.toLowerCase();
            return kl.includes('date') && !kl.includes('id') && !kl.includes('number');
          });

          // Improved item field detection – prefer "item"/"product"/"description" only
          const itemField = Object.keys(row).find(k => {
            const kl = k.toLowerCase();
            return kl.includes('item') || kl.includes('product') || kl.includes('descrip');
          });

          // Improved total field detection – prefer "item total", otherwise "total" but not "discount"
          const totalField = Object.keys(row).find(k => {
            const kl = k.toLowerCase();
            return kl.includes('item total') ||
                   (kl.includes('total') && !kl.includes('discount') && !kl.includes('sub') && !kl.includes('entity'));
          });

          // Improved customer field detection – only match "customer"/"client"/"buyer"/"company"
          const customerField = Object.keys(row).find(k => {
            const kl = k.toLowerCase();
            return kl.includes('customer') || kl.includes('client') || kl.includes('buyer') || kl.includes('company');
          });

          // Improved challan field detection – prefer "challan number" over "id"
          const challanField = Object.keys(row).find(k => {
            const kl = k.toLowerCase();
            return kl.includes('challan number') ||
                   (kl.includes('number') && kl.includes('challan')) ||
                   kl.includes('invoice number');
          });

          // Direct access to exact column names when available
          const deliveryChallanId = row['Delivery Challan ID']?.toString().trim() || '';
          const exactChallanDate = row['Challan Date'] ? new Date(row['Challan Date']) : null;
          const deliveryChallanNum = row['Delivery Challan Number']?.toString().trim() || '';
          const exactCustomerName = row['Customer Name']?.toString().trim() || '';
          const exactItemName = row['Item Name']?.toString().trim() || '';
          const exactItemTotal = row['Item Total'] ? 
            parseFloat(String(row['Item Total']).replace(/[₹,]/g, '')) || 0 : null;
          
          // Log chosen fields for debugging
          if (nonEmptyRows.indexOf(row) < 3) {
            console.log("Selected fields:", {
              dateField,
              itemField, 
              totalField,
              customerField,
              challanField,
              hasExactFields: {
                challanDate: !!exactChallanDate,
                customerName: !!exactCustomerName,
                itemName: !!exactItemName,
                itemTotal: exactItemTotal !== null
              }
            });
          }

          // Extract values with fallbacks, preferring exact matches when available
          const rawTotal = exactItemTotal !== null ? exactItemTotal : 
                          (totalField ? row[totalField] : "0");
          
          const totalValue = typeof rawTotal === 'number' 
            ? rawTotal 
            : parseFloat(String(rawTotal).replace(/[₹,]/g, "")) || 0;
            
          // Get date value
          let challanDate = today;
          if (exactChallanDate && !isNaN(exactChallanDate.getTime())) {
            challanDate = exactChallanDate;
          } else if (dateField && row[dateField]) {
            const parsedDate = new Date(row[dateField]);
            if (!isNaN(parsedDate.getTime())) {
              challanDate = parsedDate;
            }
          }
          
          // Extract values safely, preferring exact column names
          const itemName = exactItemName || (itemField ? row[itemField] : "Unnamed Item");
          const customerName = exactCustomerName || (customerField ? row[customerField] : "Unknown Customer");
          const challanNumber = deliveryChallanNum || (challanField ? row[challanField] : `DC-${Date.now()}`);
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
            "Challan Date": row['Challan Date'] || (dateField ? row[dateField] : today.toISOString().split('T')[0]),
            "Item Name": row['Item Name'] || itemName,
            "Item Total": row['Item Total'] || rawTotal,
            "Customer Name": row['Customer Name'] || customerName,
            "Delivery Challan Number": row['Delivery Challan Number'] || challanNumber,
            "Delivery Challan ID": row['Delivery Challan ID'] || deliveryChallanId,
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
    if (!file) return;

    setImporting(true);
    setProgress(0);

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

      console.log("Continue with local parsing");
      
      // Read the file with a FileReader to handle potential encoding issues
      const readFile = () => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = (e) => {
            if (!e.target || !e.target.result) {
              reject(new Error("Failed to read file content"));
              return;
            }
            
            let csvContent = e.target.result.toString();
            // Remove BOM character if present (common in Excel CSV exports)
            if (csvContent.charCodeAt(0) === 0xFEFF) {
              console.log("Removing BOM character from CSV file");
              csvContent = csvContent.slice(1);
            }
            
            // Try to auto-detect and normalize line endings
            if (!csvContent.includes("\r\n") && csvContent.includes("\n")) {
              console.log("Converting Unix line endings to Windows line endings");
              csvContent = csvContent.replace(/\n/g, "\r\n");
            }
            
            resolve(csvContent);
          };
          
          reader.onerror = () => {
            reject(new Error("Error reading file"));
          };
          
          reader.readAsText(file);
        });
      };
      
      // Read file and get content
      const csvContent = await readFile();
      console.log("File content begins with:", csvContent.substring(0, 200));
      
      // Now parse the content with Papa
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        delimiter: "",  // Auto-detect delimiter
        delimitersToGuess: [',', '\t', ';', '|'], // Try to guess delimiter
        comments: false,
        dynamicTyping: true, // Automatically convert types
        transformHeader: (header: string) => header.trim(),
        step: (results: Papa.ParseStepResult<any>, parser: any) => {
          // Update progress during parsing
          const progress = Math.round(30 + (results.meta.cursor / csvContent.length) * 50);
          setProgress(Math.min(80, progress)); // Scale to leave room for upload progress
          
          // Log steps for debugging
          if (results.meta.cursor < 1000) {
            console.log("Parsing step:", results.data);
          }
        },
        complete: async (results: Papa.ParseResult<any>) => {
          try {
            if (results.errors.length > 0) {
              console.warn("CSV parsing warnings:", results.errors);
            }
  
            // Debug what data we're working with
            console.log("Data before processing:", results.data.slice(0, 3));
            console.log("Available columns:", results.meta.fields);
            
            // Use our improved parsing logic
            const processedData = processParseResults(results);
  
            setProgress(90);
  
            // Log how many rows were processed
            console.log(`Processed ${processedData.length} rows out of ${results.data.length} total rows`);
  
            if (processedData.length === 0) {
              throw new Error("No valid data could be extracted from the CSV file. The file appears to be empty or in an unrecognized format.");
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
                recordCount: processedData.length,
                uploadDate: new Date(),
                lastAccessDate: new Date()
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
          console.error("CSV parsing error:", error);
          toast({
            title: "Parsing Error",
            description: error.message,
            variant: "destructive",
          });
          setImporting(false);
        }
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
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setProgress(0);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (!importing) {
      resetDialog();
      onOpenChange(false);
    }
  };

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
          {/* Import mode selection */}
          <div className="flex flex-col space-y-2">
            <Label className="text-sm font-medium">Import Mode</Label>
            <RadioGroup
              value={importMode}
              onValueChange={(value) => setImportMode(value as "replace" | "append")}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="replace" id="replace" className="peer sr-only" />
                <Label
                  htmlFor="replace"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="text-sm font-semibold">Replace Existing Data</span>
                  {existingDataCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Will replace {existingDataCount.toLocaleString()} existing records
                    </span>
                  )}
                </Label>
              </div>
              <div>
                <RadioGroupItem value="append" id="append" className="peer sr-only" />
                <Label
                  htmlFor="append"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="text-sm font-semibold">Append to Existing Data</span>
                  {existingDataCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Will add to {existingDataCount.toLocaleString()} existing records
                    </span>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Cloud storage toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Cloud Storage</span>
              <span className="text-xs text-muted-foreground">
                Store your CSV files in the cloud for future access
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {useCloud ? <CloudUpload size={18} /> : <CloudOff size={18} />}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseCloud(!useCloud)}
              >
                {useCloud ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">The CSV file is missing required columns:</div>
                <ul className="ml-4 mt-2 list-disc text-sm">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="flex flex-col items-center justify-center cursor-pointer py-2"
            >
              <FileText className="h-10 w-10 text-gray-400 mb-2" />
              <span className="text-sm font-medium mb-1">
                {file ? file.name : "Select a CSV file to import"}
              </span>
              <span className="text-xs text-gray-500">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : "Click to browse or drag and drop"}
              </span>
              <Button type="button" variant="outline" size="sm" className="mt-3">
                Browse Files
              </Button>
            </label>
          </div>

          {/* Data Preview Section */}
          {previewData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Data Preview</h3>
                <span className="text-xs text-muted-foreground">
                  {previewData.length} rows shown (limited preview)
                </span>
              </div>
              <div className="max-h-48 overflow-auto rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {Object.keys(previewData[0] || {}).slice(0, 6).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((row, i) => (
                      <tr key={i}>
                        {Object.keys(row).slice(0, 6).map((key) => (
                          <td key={key} className="px-3 py-2 text-sm text-gray-500 truncate max-w-[200px]">
                            {String(row[key] || "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cloud File Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Previously Uploaded Files</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCloudinaryFiles}
                disabled={cloudinaryLoading}
              >
                <Database className="h-3.5 w-3.5 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="max-h-48 overflow-auto rounded-md border p-1">
              {cloudinaryLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="text-sm text-muted-foreground">Loading stored files...</div>
                </div>
              ) : cloudinaryFiles.length === 0 ? (
                <div className="flex items-center justify-center h-24">
                  <div className="text-sm text-muted-foreground">No stored files found</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {cloudinaryFiles.map((cloudFile) => (
                    <div
                      key={cloudFile.public_id}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                        selectedCloudinaryFile === cloudFile.public_id ? "bg-gray-100" : ""
                      }`}
                      onClick={() => !importing && handleCloudinaryFileSelect(cloudFile.public_id)}
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[300px]">
                            {cloudFile.public_id.split("/").pop()}
                          </span>
                          {cloudFile.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {cloudFile.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cloudFile.recordCount
                          ? `${cloudFile.recordCount.toLocaleString()} records`
                          : new Date(cloudFile.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Importing data...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || importing || validationErrors.length > 0}>
            {importing ? "Importing..." : "Import Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
