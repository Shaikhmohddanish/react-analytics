// MongoDB Connection Troubleshooter
// Use this file to test and troubleshoot MongoDB connection issues

import { MongoClient, ServerApiVersion } from 'mongodb';

// Connection string variations to try
const connectionStrings = [
  // Standard connection string without appName
  "mongodb+srv://skmohddanish:UPcZkKtKVLoGf312@cluster0.3jczkjy.mongodb.net/?retryWrites=true&w=majority",
  
  // With encoded username/password (if special characters are present)
  "mongodb+srv://skmohddanish:UPcZkKtKVLoGf312@cluster0.3jczkjy.mongodb.net/?retryWrites=true&w=majority",
  
  // With serverApi version setting
  "mongodb+srv://skmohddanish:UPcZkKtKVLoGf312@cluster0.3jczkjy.mongodb.net/?retryWrites=true&w=majority",
];

// Connection options to try
const connectionOptions = [
  // Basic options
  {},
  
  // With server API
  {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  },
  
  // With timeouts
  {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  },
];

/**
 * Try different connection strategies to MongoDB
 * @returns The result of the connection tests
 */
export async function troubleshootMongoDBConnection() {
  const results: {
    connectionString: string;
    options: any;
    success: boolean;
    error?: string;
    pingResult?: any;
  }[] = [];

  for (const connString of connectionStrings) {
    for (const options of connectionOptions) {
      try {
        console.log(`Trying connection with options:`, options);
        
        const client = new MongoClient(connString, options);
        await client.connect();
        
        // Test the connection with a ping
        const db = client.db("delivery_analytics");
        const pingResult = await db.command({ ping: 1 });
        
        // If we reach here, connection was successful
        results.push({
          connectionString: connString,
          options,
          success: true,
          pingResult,
        });
        
        // Close the connection
        await client.close();
      } catch (error: any) {
        results.push({
          connectionString: connString,
          options,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return {
    results,
    successfulConnections: results.filter(r => r.success),
    failedConnections: results.filter(r => !r.success),
  };
}

/**
 * Recommend the best connection approach based on test results
 */
export function getBestConnectionApproach(testResults: ReturnType<typeof troubleshootMongoDBConnection> extends Promise<infer T> ? T : never) {
  const successfulConnections = testResults.successfulConnections;
  
  if (successfulConnections.length === 0) {
    return {
      success: false,
      message: "No successful connections found. Please check your MongoDB credentials and network.",
    };
  }
  
  // Find the connection with the fastest ping
  const bestConnection = successfulConnections[0]; // Just pick the first successful one for simplicity
  
  return {
    success: true,
    message: "Found a working connection strategy!",
    connectionString: bestConnection.connectionString,
    options: bestConnection.options,
    implementation: `
    // Recommended MongoDB Connection Implementation
    import { MongoClient } from 'mongodb';
    
    const uri = "${bestConnection.connectionString}";
    const client = new MongoClient(uri, ${JSON.stringify(bestConnection.options, null, 2)});
    
    // Connect to MongoDB and get the database instance
    async function connectToDatabase() {
      try {
        await client.connect();
        return client.db("delivery_analytics");
      } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
      }
    }
    `,
  };
}
