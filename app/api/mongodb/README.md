# MongoDB API Integration

This directory contains API routes for MongoDB operations, allowing secure server-side interactions with the database.

## API Endpoints

- `POST /api/mongodb/store-csv-info` - Store metadata about a CSV file
  - Request body: `{ fileName: string, description?: string, cloudinaryPublicId?: string, cloudinaryUrl?: string, recordCount?: number }`
  - Response: `{ success: boolean, insertedId?: string, error?: string }`

- `POST /api/mongodb/store-delivery-data` - Store parsed delivery data
  - Request body: `{ data: any[], fileId: string }`
  - Response: `{ success: boolean, insertedCount?: number, error?: string }`

- `GET /api/mongodb/get-csv-files` - Get a list of all CSV file entries
  - Response: `{ success: boolean, data?: any[], error?: string }`

- `GET /api/mongodb/get-delivery-data` - Get delivery data
  - Query parameters: `fileId` (optional, filters by specific file)
  - Response: `{ success: boolean, data?: any[], error?: string }`

## Security Note

For a production application, consider:
1. Adding authentication to these endpoints
2. Using environment variables for database credentials
3. Adding rate limiting
4. Implementing proper error handling and validation
