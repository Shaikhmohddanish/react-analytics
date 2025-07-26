import { MongoClient, ObjectId } from 'mongodb';

// MongoDB Connection URI with credentials
const uri = "mongodb+srv://skmohddanish:UPcZkKtKVLoGf312@danish.3jczkjy.mongodb.net/?retryWrites=true&w=majority&appName=Danish";
const client = new MongoClient(uri);

// Database and collection names
const dbName = "delivery_analytics";
const csvFilesCollection = "csv_files";
const dataCollection = "delivery_data";

/**
 * Connect to MongoDB and get the database instance
 */
export async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db(dbName);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

/**
 * Store CSV file metadata in MongoDB
 * @param fileName Original file name
 * @param description Optional description
 * @param cloudinaryPublicId Cloudinary public ID if uploaded to cloud
 * @param cloudinaryUrl Cloudinary URL if uploaded to cloud
 * @param recordCount Number of records in the CSV
 */
export async function storeCSVFileInfo({
  fileName,
  description = "",
  cloudinaryPublicId = null,
  cloudinaryUrl = null,
  recordCount = 0,
}: {
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
      fileName,
      description,
      cloudinaryPublicId,
      cloudinaryUrl,
      recordCount,
      uploadDate: new Date(),
      lastAccessDate: new Date()
    });
    
    return result;
  } catch (error) {
    console.error("Error storing CSV file info:", error);
    throw error;
  }
}

/**
 * Get all CSV file entries from MongoDB
 */
export async function getCSVFileEntries() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(csvFilesCollection);
    
    return await collection.find().sort({ uploadDate: -1 }).toArray();
  } catch (error) {
    console.error("Error retrieving CSV file entries:", error);
    throw error;
  }
}

/**
 * Get a single CSV file entry by ID
 */
export async function getCSVFileById(id: string) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(csvFilesCollection);
    
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("Error retrieving CSV file entry:", error);
    throw error;
  }
}

/**
 * Update a CSV file entry
 */
export async function updateCSVFileEntry(id: string, updateData: any) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(csvFilesCollection);
    
    return await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, lastUpdated: new Date() } }
    );
  } catch (error) {
    console.error("Error updating CSV file entry:", error);
    throw error;
  }
}

/**
 * Delete a CSV file entry
 */
export async function deleteCSVFileEntry(id: string) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(csvFilesCollection);
    
    return await collection.deleteOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("Error deleting CSV file entry:", error);
    throw error;
  }
}

/**
 * Store processed delivery data in MongoDB
 */
export async function storeDeliveryData(data: any[], fileId: string | null = null) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(dataCollection);
    
    // Add fileId reference and import timestamp to each record
    const preparedData = data.map(record => ({
      ...record,
      fileId: fileId ? new ObjectId(fileId) : null,
      importedAt: new Date()
    }));
    
    const result = await collection.insertMany(preparedData);
    return result;
  } catch (error) {
    console.error("Error storing delivery data:", error);
    throw error;
  }
}

/**
 * Get delivery data with optional filtering
 */
export async function getDeliveryData(filter = {}) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(dataCollection);
    
    return await collection.find(filter).toArray();
  } catch (error) {
    console.error("Error retrieving delivery data:", error);
    throw error;
  }
}

/**
 * Delete delivery data by file ID
 */
export async function deleteDeliveryDataByFileId(fileId: string) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(dataCollection);
    
    return await collection.deleteMany({ fileId: new ObjectId(fileId) });
  } catch (error) {
    console.error("Error deleting delivery data:", error);
    throw error;
  }
}

/**
 * Clean up MongoDB connection
 */
export async function closeMongoDBConnection() {
  try {
    await client.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }
}
