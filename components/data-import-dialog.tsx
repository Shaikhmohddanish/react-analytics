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
      complete: (results) => {
        setPreviewData(results.data)
        validateColumns(results.meta.fields || [])
      },
      error: (error: Error) => {
        toast({
          title: "File parsing error",
          description: error.message,
          variant: "destructive",
        })
      },
    })
  }

  const validateColumns = (columns: string[]) => {
    const errors: string[] = []
    const missingColumns = requiredColumns.filter((col) => !columns.includes(col))

    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(", ")}`)
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
              const fileInfo = await storeCSVFileInfo({
                fileName: publicId.split('/').pop() || "cloud-import",
                description: `Imported from Cloudinary on ${new Date().toLocaleDateString()}`,
                cloudinaryPublicId: publicId,
                cloudinaryUrl: publicId,
                recordCount: processedData.length
              });
              
              // Store the processed data in MongoDB
              await storeDeliveryData(processedData, fileInfo.insertedId.toString());
              
              // Store file upload history with metadata
              await storeFileUploadHistory({
                fileName: publicId.split('/').pop() || "cloud-import",
                fileSize: csvContent.length, // Use content length as file size
                cloudinaryPublicId: publicId,
                cloudinaryUrl: publicId,
                recordCount: processedData.length,
                description: `Imported from Cloudinary on ${new Date().toLocaleDateString()}`
              });
              
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
    return results.data
      .filter((row: any) => {
        return (
          row &&
          row["Challan Date"] &&
          row["Item Name"] &&
          row["Item Total"] &&
          row["Customer Name"] &&
          row["Delivery Challan Number"]
        );
      })
      .map((row: any) => {
        try {
          return {
            ...row,
            itemTotal: parseFloat(row["Item Total"].replace(/[^\d.-]/g, "")) || 0,
          };
        } catch (error) {
          console.warn("Error processing row:", row, error);
          return null;
        }
      })
      .filter((row: any): row is any => row !== null && row.itemTotal > 0);
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
          
          // Upload the file to Cloudinary using browser-compatible approach
          cloudinaryResult = await uploadCSVToCloudinary(file);
          setProgress(30);
          
          if (!cloudinaryResult || !cloudinaryResult.secure_url) {
            throw new Error("Upload failed");
          }
          
          toast({
            title: "Upload successful",
            description: "Your CSV file has been stored in the cloud",
          });
        } catch (error) {
          console.error("Cloudinary upload error:", error);
          toast({
            title: "Cloud Upload Failed",
            description: "Continuing with local import only",
            variant: "destructive",
          });
        }
      }
      
      // Continue with local parsing
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        step: (results: Papa.ParseStepResult<any>, parser: any) => {
          // Update progress during parsing
          const progress = Math.round((results.meta.cursor / file.size) * 100)
          setProgress(Math.min(80, 30 + progress * 0.5)); // Scale to leave room for upload progress
        },
        complete: async (results: Papa.ParseResult<any>) => {
          try {
            if (results.errors.length > 0) {
              console.warn("CSV parsing warnings:", results.errors)
            }
  
            const processedData = results.data
              .filter((row: any) => {
                return (
                  row &&
                  row["Challan Date"] &&
                  row["Item Name"] &&
                  row["Item Total"] &&
                  row["Customer Name"] &&
                  row["Delivery Challan Number"]
                )
              })
              .map((row: any) => {
                try {
                  // Parse date
                  const challanDate = new Date(row["Challan Date"])
                  if (isNaN(challanDate.getTime())) {
                    throw new Error(`Invalid date: ${row["Challan Date"]}`)
                  }
  
                  // Clean and parse item total
                  const itemTotalStr = (row["Item Total"] || "0")
                    .toString()
                    .replace(/[₹,\s]/g, "")
                    .replace(/[^\d.-]/g, "")
  
                  const itemTotal = Number.parseFloat(itemTotalStr) || 0
  
                  // Clean item name for category mapping
                  const itemNameCleaned = (row["Item Name"] || "").trim().toLowerCase()
  
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
              .filter((row): row is any => row !== null && row.itemTotal > 0)
  
            setProgress(90)
  
            if (processedData.length === 0) {
              throw new Error("No valid data found in CSV file")
            }
            
            // Store CSV file metadata in MongoDB
            const fileInfo = await storeCSVFileInfo({
              fileName: file.name,
              description: `Imported on ${new Date().toLocaleDateString()}`,
              cloudinaryPublicId: cloudinaryResult?.public_id || null,
              cloudinaryUrl: cloudinaryResult?.secure_url || null,
              recordCount: processedData.length
            });
            
            // Store the processed data in MongoDB
            await storeDeliveryData(processedData, fileInfo.insertedId.toString());
            
            // Store file upload history
            await storeFileUploadHistory({
              fileName: file.name,
              fileSize: file.size,
              cloudinaryPublicId: cloudinaryResult?.public_id || null,
              cloudinaryUrl: cloudinaryResult?.secure_url || null,
              recordCount: processedData.length,
              description: `Imported on ${new Date().toLocaleDateString()}`
            });
            
            setProgress(100);
            
            toast({
              title: "Import successful",
              description: `Processed ${processedData.length} records from ${results.data.length} total rows`,
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
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
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
                            <span className="text-sm font-medium">{file.public_id.split('/').pop()}</span>
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
