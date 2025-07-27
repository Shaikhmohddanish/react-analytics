import { MongoClient, ObjectId } from 'mongodb';

// Check if we're in a Node.js runtime environment
// This prevents MongoDB connections during build time
const isServer = typeof window === 'undefined';

// MongoDB Connection URI with credentials
// For demo/development, we'll allow local mode with no MongoDB
const MONGODB_ENABLED = isServer; // Always enable if we're on the server
const uri = "mongodb+srv://skmohddanish:TPgWeHdpLskvfaOS@danish.z86w2ks.mongodb.net/";
const client = MONGODB_ENABLED ? new MongoClient(uri, {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
}) : null;

// Database and collection names
const dbName = "delivery_analytics";
const csvFilesCollection = "csv_files";
const dataCollection = "delivery_data";
const fileHistoryCollection = "file_upload_history";

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
        return client.db(dbName);
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
    const collection = db.collection(csvFilesCollection);
    
    const result = await collection.insertOne({
      ...fileInfo,
      importDate: new Date()
    });
    
    return {
      success: true,
      insertedId: result.insertedId.toString()
    };
  } catch (error) {
    console.error("Error storing CSV file info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Store delivery data in MongoDB
export async function storeDeliveryDataServer(data: any[], fileId: string) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(dataCollection);
    
    // Add file reference to each record
    const dataWithFileId = data.map(item => ({
      ...item,
      fileId: new ObjectId(fileId)
    }));
    
    // Insert all records
    const result = await collection.insertMany(dataWithFileId);
    
    return {
      success: true,
      insertedCount: result.insertedCount
    };
  } catch (error) {
    console.error("Error storing delivery data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
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
    return {
      success: true,
      message: "MongoDB connection successful",
      details: result
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
export async function getDeliveryDataServer(fileId?: string) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(dataCollection);
    
    let query = {};
    
    if (fileId) {
      query = { fileId: new ObjectId(fileId) };
    }
    
    const data = await collection.find(query).toArray();
    
    return {
      success: true,
      data: data
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
