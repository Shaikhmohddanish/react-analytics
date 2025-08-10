import { MongoClient, ObjectId } from 'mongodb';
import { DeliveryData, CSVFileInfo, FileUploadHistory, normalizeMongoData } from '@/models';

// Check if we're in a Node.js runtime environment
// This prevents MongoDB connections during build time
const isServer = typeof window === 'undefined';

// MongoDB Connection URI with credentials from environment variables
const MONGODB_ENABLED = isServer && process.env.MONGODB_URI; // Enable if we're on server and have URI
const uri = process.env.MONGODB_URI || "";
const client = MONGODB_ENABLED ? new MongoClient(uri, {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
}) : null;

// Database and collection names
const dbName = "delivery_analytics";
const csvFilesCollection = "csv_files";
const dataCollection = "delivery_data";
const fileHistoryCollection = "file_upload_history";

// Ensure all required collections exist
async function ensureCollectionsExist(db: any) {
  try {
    console.log("Ensuring collections exist...");
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c: any) => c.name);
    
    // Create collections if they don't exist
    if (!collectionNames.includes(csvFilesCollection)) {
      console.log(`Creating collection: ${csvFilesCollection}`);
      await db.createCollection(csvFilesCollection);
    }
    
    if (!collectionNames.includes(dataCollection)) {
      console.log(`Creating collection: ${dataCollection}`);
      await db.createCollection(dataCollection);
    }
    
    if (!collectionNames.includes(fileHistoryCollection)) {
      console.log(`Creating collection: ${fileHistoryCollection}`);
      await db.createCollection(fileHistoryCollection);
    }
    
    console.log("All collections verified.");
  } catch (error) {
    console.error("Error ensuring collections exist:", error);
    // Continue despite errors - MongoDB will create collections on first insert anyway
  }
}

// A local storage solution for when MongoDB is not available
// This is for demo/development purposes only
class LocalStorage {
  private collections: Record<string, any[]> = {};
  
  collection(name: string) {
    if (!this.collections[name]) {
      this.collections[name] = [];
    }
    
    return {
      find: () => ({
        sort: () => ({
          toArray: async () => [...this.collections[name]]
        })
      }),
      insertOne: async (doc: any) => {
        const id = Math.random().toString(36).substring(2, 15);
        const docWithId = { ...doc, _id: { toString: () => id } };
        this.collections[name].push(docWithId);
        return { insertedId: { toString: () => id } };
      },
      insertMany: async (docs: any[]) => {
        const insertedIds = [];
        for (const doc of docs) {
          const id = Math.random().toString(36).substring(2, 15);
          const docWithId = { ...doc, _id: { toString: () => id } };
          this.collections[name].push(docWithId);
          insertedIds.push(id);
        }
        return { insertedCount: docs.length };
      },
      updateMany: async () => ({ modifiedCount: 0 }),
      findOne: async () => null,
      deleteMany: async () => ({ deletedCount: 0 })
    };
  }

  command(cmd: any) {
    return Promise.resolve({ ok: 1 });
  }
}

// Singleton instance for local storage
const localStorage = new LocalStorage();

// Connect to MongoDB or use local storage
async function connectToDatabase() {
  // During build time or if not on server, use local storage
  if (!isServer) {
    console.log("Not on server. Using local storage mode.");
    return localStorage as any;
  }
  
  try {
    // Try to connect with retries
    let retries = 3;
    let lastError: Error | null = null;
    
    while (retries > 0) {
      try {
        if (!client) throw new Error("MongoDB client is null");
        await client.connect();
        console.log("Successfully connected to MongoDB");
        
        // Get database reference
        const db = client.db(dbName);
        
        // Ensure collections exist
        await ensureCollectionsExist(db);
        
        return db;
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`Connection attempt failed (${retries} retries left):`, lastError.message);
        retries--;
        // Wait a bit before retrying
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // If we get here, all retries failed
    console.error("Failed to connect to MongoDB after multiple attempts:", lastError);
    console.log("Falling back to local storage mode for demo/development.");
    return localStorage as any;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    console.log("Falling back to local storage mode for demo/development.");
    return localStorage as any;
  }
}

// Store CSV file info in MongoDB
export async function storeCSVFileInfoServer(fileInfo: {
  fileName: string;
  description?: string;
  cloudinaryPublicId?: string | null;
  cloudinaryUrl?: string | null;
  recordCount?: number;
}) {
  try {
    const db = await connectToDatabase();
    // Check if we're using local storage fallback
    if (db === localStorage) {
      console.log("Using local storage for CSV file info storage");
    }
    
    const collection = db.collection(csvFilesCollection);
    console.log(`Inserting into ${csvFilesCollection}:`, fileInfo.fileName);
    
    // Add importDate to ensure we can find the most recent file
    const result = await collection.insertOne({
      ...fileInfo,
      importDate: new Date()
    });
    
    console.log("CSV file info stored successfully with ID:", result.insertedId.toString());
    return {
      success: true,
      insertedId: result.insertedId.toString()
    };
  } catch (error) {
    console.error("Error storing CSV file info:", error);
    // More detailed error handling
    let errorMessage = "Unknown database error";
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Add more context if possible
      if (errorMessage.includes("not connected")) {
        errorMessage = "Database connection failed. Please check your MongoDB connection string and network.";
      } else if (errorMessage.includes("authorization") || errorMessage.includes("authentication")) {
        errorMessage = "Database authentication failed. Please check your MongoDB credentials.";
      } else if (errorMessage.includes("duplicate key")) {
        errorMessage = "A file with this information already exists in the database.";
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Store delivery data in MongoDB
export async function storeDeliveryDataServer(data: any[], fileId: string) {
  try {
    if (!data || data.length === 0) {
      throw new Error("No data to store");
    }
    
    if (!fileId) {
      throw new Error("File ID is required");
    }
    
    console.log(`Storing ${data.length} delivery records for file ID: ${fileId}`);
    const db = await connectToDatabase();
    
    // Check if we're using local storage fallback
    if (db === localStorage) {
      console.log("Using local storage for delivery data storage");
    }
    
    const collection = db.collection(dataCollection);
    
    // Process the data to ensure proper formatting and structure
    const processedData = data.map((item: any) => {
      // First normalize the data using our model
      const normalizedItem = normalizeMongoData({
        ...item,
        // Add any missing fields with defaults
        challanDateObj: item.challanDateObj || new Date(),
        deliveryChallanId: item.deliveryChallanId || item["Delivery Challan ID"] || "",
        challanDate: item.challanDate || item["Challan Date"] || "",
        deliveryChallanNumber: item.deliveryChallanNumber || item["Delivery Challan Number"] || "",
        customerName: item.customerName || item["Customer Name"] || "",
        itemName: item.itemName || item["Item Name"] || "",
        itemTotalRaw: item.itemTotalRaw || item["Item Total"] || "0",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return normalizedItem;
    });
    
    // Filter out any invalid data
    const validData = processedData.filter((item: DeliveryData) => 
      item.deliveryChallanId && 
      item.challanDate && 
      item.itemName
    );
    
    console.log(`Filtered out ${processedData.length - validData.length} invalid records`);
    
    // Add file reference to each record
    let dataWithFileId;
    try {
      dataWithFileId = validData.map(item => ({
        ...item,
        fileId: new ObjectId(fileId)
      }));
    } catch (error) {
      console.error("Error creating ObjectId:", error);
      // Fallback if ObjectId creation fails
      dataWithFileId = validData.map(item => ({
        ...item,
        fileId: fileId
      }));
    }
    
    if (dataWithFileId.length === 0) {
      throw new Error("No valid data to store after processing");
    }
    
    // Insert all records
    const result = await collection.insertMany(dataWithFileId);
    console.log(`Successfully inserted ${result.insertedCount} records`);
    
    return {
      success: true,
      insertedCount: result.insertedCount
    };
  } catch (error) {
    console.error("Error storing delivery data:", error);
    
    // More detailed error handling
    let errorMessage = "Unknown database error";
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Add more context if possible
      if (errorMessage.includes("not connected")) {
        errorMessage = "Database connection failed. Please check your MongoDB connection string and network.";
      } else if (errorMessage.includes("authorization") || errorMessage.includes("authentication")) {
        errorMessage = "Database authentication failed. Please check your MongoDB credentials.";
      } else if (errorMessage.includes("document too large")) {
        errorMessage = "Some data records are too large. Try splitting the data into smaller chunks.";
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Get CSV file entries from MongoDB
export async function getCSVFileEntriesServer() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(csvFilesCollection);
    
    const files = await collection.find().sort({ importDate: -1 }).toArray();
    
    return {
      success: true,
      data: files
    };
  } catch (error) {
    console.error("Error getting CSV file entries:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Test MongoDB connection
export async function testMongoDBConnection() {
  try {
    const db = await connectToDatabase();
    // Try a simple command to verify connection
    const result = await db.command({ ping: 1 });
    
    // Check collections
    const collections = [csvFilesCollection, dataCollection, fileHistoryCollection];
    const collectionList = await db.listCollections().toArray();
    const collectionNames = collectionList.map((c: any) => c.name);
    
    const missingCollections = collections.filter(c => !collectionNames.includes(c));
    
    // Create missing collections
    for (const collection of missingCollections) {
      try {
        console.log(`Creating missing collection: ${collection}`);
        await db.createCollection(collection);
      } catch (err) {
        console.error(`Failed to create collection ${collection}:`, err);
      }
    }
    
    // Check collections again
    const updatedCollectionList = await db.listCollections().toArray();
    const updatedCollectionNames = updatedCollectionList.map((c: any) => c.name);
    
    return {
      success: true,
      message: "MongoDB connection successful",
      details: result,
      collections: {
        required: collections,
        existing: updatedCollectionNames,
        missing: collections.filter(c => !updatedCollectionNames.includes(c)),
        created: missingCollections.filter(c => updatedCollectionNames.includes(c))
      }
    };
  } catch (error) {
    console.error("MongoDB connection test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Get delivery data from MongoDB
/**
 * Get delivery data from the database with proper data normalization and processing
 * @param fileId Optional file ID to filter data by specific file
 * @returns Processed delivery data or error
 */
export async function getDeliveryDataServer(fileId?: string) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(dataCollection);
    const csvFilesCol = db.collection(csvFilesCollection);
    
    let query = {};
    
    if (fileId) {
      console.log("Using provided fileId for query:", fileId);
      try {
        query = { fileId: new ObjectId(fileId) };
      } catch (e) {
        // If the fileId is not a valid ObjectId, use it as a string
        query = { fileId: fileId };
      }
    } else {
      // If no fileId provided, get the most recent file
      console.log("No fileId provided, finding most recent file");
      const recentFiles = await csvFilesCol.find()
        .sort({ importDate: -1 })
        .limit(1)
        .toArray();
      
      if (recentFiles && recentFiles.length > 0) {
        const mostRecentFile = recentFiles[0];
        console.log("Found most recent file:", mostRecentFile._id.toString());
        query = { fileId: mostRecentFile._id };
      } else {
        console.log("No files found in database");
      }
    }
    
    // Get data from MongoDB
    const rawData = await collection.find(query).toArray();
    
    // Process the data to ensure consistent structure
    const processedData = rawData.map((item: any) => {
      // Process date fields
      let challanDateObj = null;
      let month = '';
      let year = 0;
      let monthNum = 0;
      
      // Get date value from either processed field or original field
      const dateStr = item.challanDate || item["Challan Date"];
      
      if (dateStr) {
        try {
          const dateParts = String(dateStr).split('/');
          
          if (dateParts.length === 3) {
            // Handle MM/DD/YYYY format
            const m = parseInt(dateParts[0], 10) - 1; // 0-indexed month
            const d = parseInt(dateParts[1], 10);
            let y = parseInt(dateParts[2], 10);
            
            // Handle 2-digit years
            if (y < 100) {
              y += y < 50 ? 2000 : 1900;
            }
            
            challanDateObj = new Date(y, m, d);
            if (!isNaN(challanDateObj.getTime())) {
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              month = monthNames[challanDateObj.getMonth()];
              year = challanDateObj.getFullYear();
              monthNum = challanDateObj.getMonth() + 1;
            }
          } else {
            // Try direct date parsing as fallback
            challanDateObj = new Date(dateStr);
            if (!isNaN(challanDateObj.getTime())) {
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              month = monthNames[challanDateObj.getMonth()];
              year = challanDateObj.getFullYear();
              monthNum = challanDateObj.getMonth() + 1;
            }
          }
        } catch (e) {
          console.error("Error processing date:", dateStr, e);
        }
      }
      
      // Process itemTotal
      const itemTotalStr = item.itemTotalRaw || item["Item Total"] || "0";
      let itemTotal = 0;
      
      try {
        // Remove currency symbols and commas, then parse
        const numStr = String(itemTotalStr).replace(/[₹$,]/g, '').trim();
        itemTotal = parseFloat(numStr) || 0;
      } catch (e) {
        console.error("Error parsing item total:", itemTotalStr, e);
      }
      
      // Process item name and category
      const itemName = item.itemName || item["Item Name"] || "";
      const itemNameCleaned = String(itemName).toLowerCase().trim();
      
      // Create normalized document using our model
      return normalizeMongoData({
        _id: item._id,
        deliveryChallanId: String(item.deliveryChallanId || item["Delivery Challan ID"] || ""),
        challanDate: String(dateStr || ""),
        deliveryChallanNumber: String(item.deliveryChallanNumber || item["Delivery Challan Number"] || ""),
        customerName: String(item.customerName || item["Customer Name"] || ""),
        itemName: String(itemName || ""),
        itemTotalRaw: String(itemTotalStr || "0"),
        challanDateObj: challanDateObj || null,
        month: String(month || ""),
        year: Number(year || 0),
        monthNum: Number(monthNum || 0),
        itemTotal: Number(itemTotal || 0),
        itemNameCleaned: String(itemNameCleaned || ""),
        category: String(item.category || "Other"),
        fileId: item.fileId,
        createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(),
        updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date()
      });
    });
    
    // Filter out any potentially invalid data
    const validData = processedData.filter((item: DeliveryData) => 
      item.deliveryChallanId && 
      item.challanDateObj && 
      !isNaN(item.itemTotal)
    );
    
    console.log(`Filtered ${processedData.length - validData.length} invalid records out of ${processedData.length}`);
    
    return {
      success: true,
      data: validData
    };
  } catch (error) {
    console.error("Error getting delivery data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Store file upload history with metadata
export async function storeFileUploadHistoryServer(fileData: {
  fileName: string;
  fileSize: number;
  cloudinaryPublicId: string | null;
  cloudinaryUrl: string | null;
  recordCount: number;
  importDate?: Date;
  description?: string;
}) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(fileHistoryCollection);
    const currentTimestamp = new Date();
    
    // Mark all previous files as deleted
    await collection.updateMany(
      { is_deleted: false }, 
      { 
        $set: { 
          is_deleted: true, 
          updated_at: currentTimestamp
        } 
      }
    );
    
    // Insert new file history record
    const result = await collection.insertOne({
      ...fileData,
      is_deleted: false,
      created_at: currentTimestamp,
      updated_at: currentTimestamp,
      importDate: fileData.importDate || currentTimestamp
    });
    
    return {
      success: true,
      insertedId: result.insertedId.toString()
    };
  } catch (error) {
    console.error("Error storing file upload history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Get file upload history
export async function getFileUploadHistoryServer(includeDeleted = false) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(fileHistoryCollection);
    
    // Create query based on whether to include deleted files
    const query = includeDeleted ? {} : { is_deleted: false };
    
    const files = await collection.find(query)
                                 .sort({ created_at: -1 })
                                 .toArray();
    
    return {
      success: true,
      data: files
    };
  } catch (error) {
    console.error("Error getting file upload history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Mark a file as deleted in the history
export async function markFileDeletedServer(fileId: string) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(fileHistoryCollection);
    const currentTimestamp = new Date();
    
    // Update the file record
    const result = await collection.updateOne(
      { _id: new ObjectId(fileId) },
      { 
        $set: { 
          is_deleted: true,
          updated_at: currentTimestamp
        } 
      }
    );
    
    return {
      success: true,
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    console.error("Error marking file as deleted:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Delete all delivery data from the database
 */
export async function deleteAllDeliveryDataServer() {
  try {
    console.log("Deleting all delivery data from database...");
    const db = await connectToDatabase();
    
    // Check if we're using local storage fallback
    if (db === localStorage) {
      console.log("Using local storage for delivery data deletion");
      // Clear the local storage collection
      localStorage.collections[dataCollection] = [];
      return { success: true, deletedCount: 0 };
    }
    
    const collection = db.collection(dataCollection);
    
    // Delete all documents in the collection
    const result = await collection.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} delivery records`);
    
    return {
      success: true,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    console.error("Error deleting all delivery data:", error);
    
    let errorMessage = "Unknown database error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
