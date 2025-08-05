# Delivery Analytics Dashboard - Complete Project Documentation

This documentation provides a comprehensive overview of the Delivery Analytics Dashboard project, including its purpose, structure, components, APIs, and functionalities.

## 1. Project Overview

The Delivery Analytics Dashboard is a Next.js-based web application designed to provide comprehensive analytics for delivery challan data. It offers various dashboards and visualizations to help businesses gain insights into their delivery operations, customer performance, and product sales.

### 1.1 Tech Stack

- **Framework**: Next.js 14 with React 18
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Styling**: Tailwind CSS with shadcn/ui components
- **UI Components**: Radix UI primitives
- **Data Visualization**: Recharts
- **CSV Processing**: Papa Parse
- **Form Management**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Theme Support**: next-themes
- **Notifications**: Sonner toast notifications

### 1.2 Key Features

- Data import from CSV files with validation
- Cloud storage for CSV files using Cloudinary
- MongoDB integration for persistent data storage
- Multiple dashboards for different analytics perspectives
- Advanced filtering capabilities
- Data export in multiple formats
- Responsive design for desktop and mobile devices

## 2. Project Structure

The project follows a modular structure with clear separation of concerns:

```
app/                      # Next.js app router pages
  globals.css            
  layout.tsx              # Root layout with providers
  page.tsx                # Root page (redirects to overview)
  advanced-reports/       # Advanced reporting page
  dealer-analytics/       # Dealer analysis page
  dealer-dashboard/       # Dealer dashboard page
  overview/               # Overview dashboard page
  weekly-flow/            # Weekly analysis page
  yearly-trend/           # Yearly trends page
  api/                    # API routes for MongoDB and Cloudinary

components/               # Reusable components
  app-sidebar.tsx         # Main navigation sidebar
  data-import-dialog.tsx  # Data import functionality
  export-dialog.tsx       # Data export functionality
  global-filters.tsx      # Global filtering interface
  header.tsx              # App header with controls
  search-with-suggestions.tsx # Enhanced search component
  theme-provider.tsx      # Theme management
  ui/                     # UI component library

contexts/                 # React context providers
  data-context.tsx        # Data state management
  filter-context.tsx      # Filter state management

hooks/                    # Custom React hooks
  use-mobile.ts           # Responsive design helper
  use-toast.ts            # Toast notification hook

lib/                      # Utility functions
  data-processing.ts      # Data processing logic
  export-utils.ts         # Export functionality
  utils.ts                # General utilities
  cloudinary.ts           # Cloudinary integration
  mongodb-client.ts       # MongoDB client-side operations
  mongodb-server.ts       # MongoDB server-side operations

models/                   # Data models
  index.ts                # Contains all data interfaces

public/                   # Static assets
  data/                   # Sample data files
    delivery_challan.csv  # Sample delivery data

styles/                   # Global styles
  globals.css             # Global CSS styles
```

## 3. Core Components Documentation

### 3.1 Context Providers

#### 3.1.1 Data Context (`contexts/data-context.tsx`)

The Data Context manages the application's core data state and provides data-related functionality to the entire application.

**State:**
- `data`: Array of processed delivery data
- `loading`: Boolean flag for data loading state
- `error`: Error message if data loading fails
- `lastUpdated`: Timestamp of when data was last updated
- `stats`: Calculated statistics from the data

**Functions:**
- `refreshData()`: Forces a refresh of the data from the API
- `importData(newData, mode)`: Imports new data with "replace" or "append" mode
- `loadData(forceRefresh)`: Internal function to load data from API

**Statistics Calculation:**
- Total sales
- Total orders
- Total customers
- Average order value
- Top-selling category
- Year-over-year growth rate

#### 3.1.2 Filter Context (`contexts/filter-context.tsx`)

The Filter Context manages filtering state across the application, allowing consistent filtering across all dashboard views.

**State:**
- `filters`: Object containing all filter criteria
  - `dateRange`: Date range filter (from/to dates)
  - `customers`: Selected customer filters
  - `categories`: Selected category filters
  - `amountRange`: Minimum and maximum amount range
  - `searchTerm`: Search term for text searching
- `filteredData`: Data filtered according to current filter settings

**Functions:**
- `setFilters(newFilters)`: Updates filter state
- `setSearchTerm(term)`: Updates search term
- `clearAllFilters()`: Resets all filters to default values
- `applyQuickFilter(type, value)`: Quickly applies a specific filter

### 3.2 UI Components

#### 3.2.1 App Sidebar (`components/app-sidebar.tsx`)

The application's main navigation sidebar, organizing links into categories.

**Features:**
- Responsive design
- Organized navigation categories:
  - Main Analytics
  - Advanced Features
  - Visualizations
- Active page highlighting
- Icon-based navigation

#### 3.2.2 Data Import Dialog (`components/data-import-dialog.tsx`)

Complex dialog component for importing CSV data into the application.

**Features:**
- File upload with drag-and-drop support
- Cloudinary integration for cloud storage
- CSV validation with error reporting
- Data preview before import
- Import mode selection (replace or append)
- Progress tracking during import
- Error handling and validation

#### 3.2.3 Export Dialog (`components/export-dialog.tsx`)

Dialog for exporting data in various formats.

**Features:**
- Multiple export format options:
  - CSV
  - Excel
  - PDF
- Field selection for export
- Options to include visualizations in exports

#### 3.2.4 Global Filters (`components/global-filters.tsx`)

Component for filtering data across the application.

**Features:**
- Date range selection
- Customer filtering
- Category filtering
- Amount range filtering
- Filter reset functionality
- Visual indicators for active filters

#### 3.2.5 Header (`components/header.tsx`)

Application header with search functionality and controls.

**Features:**
- Search with suggestions
- Global filter toggle
- Data import and export options
- Theme toggle

### 3.3 Dashboard Pages

#### 3.3.1 Overview Dashboard (`/app/overview/page.tsx`)

The main dashboard showing key performance metrics and trends.

**Features:**
- Key performance metrics:
  - Total sales
  - Total orders
  - Total customers
  - Average order value
- Monthly sales trends
- Category performance
- Customer analysis
- Sales growth rate visualization

#### 3.3.2 Dealer Dashboard (`/app/dealer-dashboard/page.tsx`)

Dashboard focused on dealer performance analysis.

**Features:**
- Comprehensive dealer performance metrics
- Sales by category visualization
- Temporal analysis of dealer performance
- Comparative dealer rankings

#### 3.3.3 Dealer Analytics (`/app/dealer-analytics/page.tsx`)

Advanced dealer analytics with multiple views and filtering options.

**Features:**
- Advanced filtering by tiers, date ranges
- Multiple view modes (grid, chart, comparison)
- Sortable dealer data
- Detailed individual dealer performance

#### 3.3.4 Weekly Flow (`/app/weekly-flow/page.tsx`)

Weekly sales analysis and trends.

**Features:**
- Week-by-week sales analysis
- Temporal trends visualization
- Weekly performance comparisons

#### 3.3.5 Yearly Trend (`/app/yearly-trend/page.tsx`)

Year-over-year analysis and long-term trends.

**Features:**
- Year-over-year performance analysis
- Long-term trend visualization
- Annual growth metrics

#### 3.3.6 Advanced Reports (`/app/advanced-reports/page.tsx`)

Customizable reporting interface for in-depth analysis.

**Features:**
- Customizable reporting interface
- In-depth data analysis with pagination
- Orders by count, sales amount, category breakdown
- Monthly category share analysis
- Product-wise monthly share for top products

## 4. API Documentation

### 4.1 MongoDB API Routes

#### 4.1.1 Store CSV Info

- **Endpoint**: `/api/mongodb/store-csv-info`
- **Method**: POST
- **Purpose**: Store metadata about uploaded CSV files
- **Request Body**:
  ```json
  {
    "fileName": "example.csv",
    "description": "Example file",
    "cloudinaryPublicId": "public_id",
    "cloudinaryUrl": "https://example.com/file.csv",
    "recordCount": 100,
    "uploadDate": "2023-08-01T00:00:00.000Z",
    "lastAccessDate": "2023-08-01T00:00:00.000Z",
    "fileSize": 1024
  }
  ```

#### 4.1.2 Store Delivery Data

- **Endpoint**: `/api/mongodb/store-delivery-data`
- **Method**: POST
- **Purpose**: Store parsed delivery data in MongoDB
- **Request Body**:
  ```json
  {
    "data": [/* Array of delivery data objects */],
    "fileId": "file_id_from_store_csv_info"
  }
  ```

#### 4.1.3 Get CSV Files

- **Endpoint**: `/api/mongodb/get-csv-files`
- **Method**: GET
- **Purpose**: Get a list of all uploaded CSV files

#### 4.1.4 Get Delivery Data

- **Endpoint**: `/api/mongodb/get-delivery-data`
- **Method**: GET
- **Purpose**: Retrieve delivery data with optional filtering
- **Query Parameters**:
  - `fileId`: Filter by specific file ID
  - `limit`: Limit the number of results
  - `skip`: Skip a number of results (for pagination)

#### 4.1.5 Test Connection

- **Endpoint**: `/api/mongodb/test-connection`
- **Method**: GET
- **Purpose**: Test the MongoDB connection

#### 4.1.6 Get File History

- **Endpoint**: `/api/mongodb/get-file-history`
- **Method**: GET
- **Purpose**: Get history of uploaded CSV files

### 4.2 Cloudinary API Routes

#### 4.2.1 List Files

- **Endpoint**: `/api/cloudinary/list-files`
- **Method**: GET
- **Purpose**: List all CSV files stored in Cloudinary

#### 4.2.2 Upload File

- **Endpoint**: `/api/cloudinary/upload-file`
- **Method**: POST
- **Purpose**: Upload a new CSV file to Cloudinary
- **Request Body**: FormData with file

#### 4.2.3 Delete File

- **Endpoint**: `/api/cloudinary/delete-file`
- **Method**: POST
- **Purpose**: Delete a file from Cloudinary
- **Request Body**:
  ```json
  {
    "publicId": "cloudinary_public_id"
  }
  ```

## 5. Data Processing

### 5.1 CSV Data Processing

The application processes CSV data through several steps:

1. **CSV Parsing**: Using Papa Parse to parse CSV files with proper header detection
2. **Data Validation**: Ensuring required columns exist
3. **Data Transformation**:
   - Converting date strings to Date objects
   - Extracting month and year from dates
   - Converting numeric strings to numbers
   - Categorizing products based on predefined mappings
4. **Data Enhancement**:
   - Adding calculated fields
   - Assigning categories based on item names
   - Cleaning and normalizing data

### 5.2 Category Mapping

The application uses a predefined category mapping system in `data-processing.ts` to categorize products:

- **Bio-Fertilizers**: Products like "peek sanjivani", "bio surakshak", etc.
- **Micronutrients**: Products like "nutrisac kit", "ferrous sulphate", etc.
- **Chelated Micronutrients**: Products like "iron man", "micro man", etc.
- **Bio-Stimulants**: Products like "titanic kit", "jeeto", "flora", etc.
- **Other**: Products that don't match any defined category

## 6. Models and Data Structures

### 6.1 Key Data Models

#### 6.1.1 DeliveryData

Raw data model for delivery data from MongoDB:

```typescript
interface DeliveryData extends MongoDocument {
  // Original fields from CSV
  deliveryChallanId: string;
  challanDate: string;
  deliveryChallanNumber: string;
  customerName: string;
  itemName: string;
  itemTotalRaw: string;
  
  // Processed fields
  challanDateObj: Date | null;
  month: string;
  year: number;
  monthNum: number;
  itemTotal: number;
  itemNameCleaned: string;
  category: string;
  
  // Additional metadata
  fileId: string | ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6.1.2 ProcessedData

Frontend-friendly data format used throughout the application:

```typescript
interface ProcessedData {
  // Original fields with string type
  "Delivery Challan ID": string;
  "Challan Date": string;
  "Delivery Challan Number": string;
  "Customer Name": string;
  "Item Name": string;
  "Item Total": string;
  
  // Additional fields for analytics
  challanDate: Date;
  itemNameCleaned: string;
  category: string;
  month: string;
  year: number;
  monthNum: number;
  itemTotal: number;
  
  // Any other dynamic fields
  [key: string]: string | Date | number;
}
```

#### 6.1.3 CSV File Info

Metadata for uploaded CSV files:

```typescript
interface CSVFileInfo extends MongoDocument {
  fileName: string;
  description?: string;
  cloudinaryPublicId?: string | null;
  cloudinaryUrl?: string | null;
  recordCount?: number;
  uploadDate: Date;
  lastAccessDate: Date;
  fileSize?: number;
}
```

## 7. Setup and Configuration

### 7.1 Environment Variables

The application requires the following environment variables:

```
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 7.2 MongoDB Setup

1. Create a MongoDB Atlas account or use a local MongoDB instance
2. Create a database for the application
3. Set up collections:
   - `csv_files`: Stores metadata about uploaded files
   - `delivery_data`: Stores the actual delivery data
   - `file_history`: Stores history of file uploads

### 7.3 Cloudinary Setup

1. Create a Cloudinary account
2. Set up a dedicated folder for CSV files
3. Configure upload presets for secure uploads

## 8. Deployment Guide

### 8.1 Development Environment

```bash
# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

### 8.2 Production Build

```bash
# Build for production
npm run build
# or
pnpm build

# Start production server
npm start
# or
pnpm start
```

### 8.3 Deployment Platforms

#### 8.3.1 Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy using Vercel's automated deployment

#### 8.3.2 Netlify

1. Connect your GitHub repository to Netlify
2. Set the build command to `npm run build`
3. Configure environment variables in the Netlify dashboard

#### 8.3.3 Self-hosted Server

1. Build the application
2. Transfer the `.next` folder and necessary files to the server
3. Run with Node.js or in a Docker container

## 9. Security Considerations

### 9.1 MongoDB Security

- Use strong MongoDB Atlas credentials
- Set up IP allowlisting or VPC peering
- Enable MongoDB Atlas encryption at rest

### 9.2 API Security

- Add authentication to API routes for production use
- Implement rate limiting
- Add CORS protection

### 9.3 Cloudinary Security

- Use upload presets with restrictions
- Keep API secrets in environment variables
- Implement signed uploads for production

## 10. Performance Optimization

### 10.1 Data Caching

The application implements data caching to prevent redundant API calls:

```typescript
// Cache for MongoDB data
let dataCache: {
  data: ProcessedData[];
  timestamp: number;
} = {
  data: [],
  timestamp: 0
};

// Cache expiry time in milliseconds (5 minutes)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;
```

### 10.2 Memoization

React's `useMemo` and `useCallback` are used throughout the application to optimize rendering performance:

```typescript
const filteredData = useMemo(() => {
  // Filtering logic
}, [data, filters, searchTerm]);
```

### 10.3 Lazy Loading

The application uses Next.js's built-in code splitting and lazy loading for improved performance.

## 11. Future Enhancements

### 11.1 Authentication and User Management

Add user authentication with role-based access control:
- Admin users with full access
- Regular users with read-only access
- Custom roles with specific permissions

### 11.2 Advanced Analytics Features

- Predictive analytics using machine learning
- Custom report builder
- Real-time data updates

### 11.3 Additional Integrations

- Integration with ERP systems
- Email report scheduling
- Mobile app companion

## 12. Troubleshooting Guide

### 12.1 MongoDB Connection Issues

If the MongoDB connection test fails:
1. Verify the MongoDB URI in environment variables
2. Check network connectivity
3. Ensure IP address is whitelisted in MongoDB Atlas
4. Verify database user permissions

### 12.2 Cloudinary Upload Issues

If file uploads to Cloudinary fail:
1. Verify Cloudinary credentials in environment variables
2. Check upload preset configuration
3. Verify file size limits
4. Check browser console for CORS errors

### 12.3 Data Import Issues

If data import fails:
1. Verify CSV file format
2. Check for required columns
3. Inspect validation errors in the import dialog
4. Try with a smaller subset of data first

## 13. Contact and Support

For issues, suggestions, or contributions, please:
1. Open an issue on the GitHub repository
2. Contact the project maintainer at [maintainer-email]
3. Submit a pull request with proposed changes

---

© 2025 Delivery Analytics Dashboard. All Rights Reserved.
