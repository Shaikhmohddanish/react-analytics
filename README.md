# Delivery Analytics Dashboard

A comprehensive analytics dashboard for delivery challan data with advanced visualization, filtering, and reporting features.

![Delivery Analytics Dashboard](public/placeholder.jpg)

## Project Overview

This Next.js application provides a sophisticated analytics platform for analyzing delivery challan data. It offers various dashboards and views to help businesses gain insights into their delivery operations, customer performance, and product sales.

## Technologies Used

- **Framework**: Next.js 14 with React 18
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (with shadcn/ui styling)
- **Data Visualization**: Recharts
- **CSV Processing**: Papa Parse
- **Form Management**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Theme Support**: next-themes
- **Notifications**: Sonner toast notifications

## Core Features

### Data Management

- **Data Import**: Import delivery challan data from CSV files with validation
- **Cloud Storage**: Store and manage CSV files in Cloudinary cloud storage
- **Database Integration**: MongoDB Atlas for persistent data storage
- **Data Processing**: Automatic processing and categorization of imported data
- **Data Context**: Global state management for data across the application
- **Export Functionality**: Export data in CSV, Excel, and PDF formats

### Dashboard Pages

1. **Overview Dashboard** (`/overview`):
   - Key performance metrics (total sales, orders, customers)
   - Monthly sales trends
   - Category performance
   - Customer analysis
   - Sales growth rate visualization

2. **Dealer Dashboard** (`/dealer-dashboard`):
   - Comprehensive dealer performance metrics
   - Sales by category visualization
   - Temporal analysis of dealer performance
   - Comparative dealer rankings

3. **Dealer Analytics** (`/dealer-analytics`):
   - Advanced filtering by tiers, date ranges
   - Multiple view modes (grid, chart, comparison)
   - Sortable dealer data
   - Detailed individual dealer performance

4. **Weekly Flow** (`/weekly-flow`):
   - Week-by-week sales analysis
   - Temporal trends visualization
   - Weekly performance comparisons

5. **Yearly Trend** (`/yearly-trend`):
   - Year-over-year performance analysis
   - Long-term trend visualization
   - Annual growth metrics

6. **Advanced Reports** (`/advanced-reports`):
   - Customizable reporting interface
   - In-depth data analysis with pagination support
   - Orders by count, sales amount, category breakdown
   - Monthly category share analysis
   - Product-wise monthly share for top products

### Key Components

1. **App Sidebar** (`app-sidebar.tsx`):
   - Navigation menu with categorized sections
   - Links to all dashboard views
   - Responsive sidebar with mobile support

2. **Header** (`header.tsx`):
   - Application header with search functionality
   - Global filter toggle
   - Data import and export options
   - Theme toggle

3. **Data Import Dialog** (`data-import-dialog.tsx`):
   - CSV file upload interface with Cloudinary integration
   - Data validation with error reporting
   - Import mode selection (replace or append)
   - Data preview functionality
   - MongoDB storage of imported data

4. **Export Dialog** (`export-dialog.tsx`):
   - Multiple export format options (CSV, Excel, PDF)
   - Field selection for export
   - Options to include visualizations in exports

5. **Global Filters** (`global-filters.tsx`):
   - Advanced filtering by multiple dimensions:
     - Date range selection
     - Customer filtering
     - Category filtering
     - Amount range filtering
   - Filter reset functionality
   - Visual indicators for active filters

6. **Search with Suggestions** (`search-with-suggestions.tsx`):
   - Intelligent search across data

## API Integration

### MongoDB API Routes

The application includes several API routes for MongoDB operations:

- `POST /api/mongodb/store-csv-info` - Store metadata about uploaded CSV files
- `POST /api/mongodb/store-delivery-data` - Store parsed delivery data in MongoDB
- `GET /api/mongodb/get-csv-files` - Get a list of all uploaded CSV files
- `GET /api/mongodb/get-delivery-data` - Retrieve delivery data with optional filtering
- `GET /api/mongodb/test-connection` - Test the MongoDB connection
- `GET /api/mongodb/get-file-history` - Get history of uploaded CSV files

### Cloudinary API Routes

The application integrates with Cloudinary for cloud storage of CSV files:

- `GET /api/cloudinary/list-files` - List all CSV files stored in Cloudinary
- `POST /api/cloudinary/upload-file` - Upload a new CSV file to Cloudinary
- `POST /api/cloudinary/delete-file` - Delete a file from Cloudinary

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/pnpm
- MongoDB Atlas account (or local MongoDB instance)
- Cloudinary account (for cloud storage of CSV files)

### Installation

1. Clone the repository
2. Install dependencies using npm or pnpm:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. Configure environment variables:
   - Create a `.env.local` file with the following variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
     CLOUDINARY_API_KEY=your_cloudinary_api_key
     CLOUDINARY_API_SECRET=your_cloudinary_api_secret
     ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Test the MongoDB connection:
   - Use the VS Code task "Test MongoDB Connection"
   - Or navigate to `/api/mongodb/test-connection` in your browser

## Data Processing and Categorization

The application automatically processes and categorizes imported data using predefined category mappings in `data-processing.ts`. The system supports various product categories including:

- Bio-Fertilizers
- Micronutrients
- Chelated Micronutrients
- Bio-Stimulants
- And more...

Data is enhanced with additional fields for analysis, including:
- Month and year extraction from dates
- Category assignment based on product name
- Monetary value conversion
- Time-based aggregations

## Deployment

### Production Build

To create a production build:

```bash
npm run build
# or
pnpm build
```

Then start the production server:

```bash
npm run start
# or
pnpm start
```

### Deployment Platforms

This application can be deployed to:

1. **Vercel** (recommended for Next.js apps)
   - Connect your GitHub repository
   - Configure environment variables in the Vercel dashboard
   - Let Vercel handle the build and deployment process

2. **Netlify**
   - Connect your GitHub repository
   - Set the build command to `npm run build`
   - Configure environment variables

3. **Self-hosted server**
   - Build the application
   - Transfer the `.next` folder and other necessary files
   - Run with Node.js or within a Docker container

## Security Considerations

For a production deployment, ensure:

1. **Database Security**
   - Use strong MongoDB Atlas credentials
   - Set up proper IP allowlisting or VPC peering
   - Enable MongoDB Atlas encryption at rest

2. **API Security**
   - Add authentication to API routes
   - Implement rate limiting
   - Add CORS protection for production

3. **Cloudinary Security**
   - Use upload presets with restrictions
   - Keep API secrets in environment variables
   - Implement signed uploads for production

4. **General Security**
   - Keep dependencies updated
   - Implement proper error handling
   - Consider adding user authentication for production use

## License

[MIT](LICENSE)
   - Auto-suggestions as you type
   - Recent search history

## Context Providers

### Data Context (`contexts/data-context.tsx`)

Manages the application's core data with the following functionality:
- Data loading and processing
- Data state management
- Statistics calculation:
  - Total sales
  - Total orders
  - Total customers
  - Average order value
  - Top category
  - Growth rate
- Data import functionality
- Data refresh capabilities

### Filter Context (`contexts/filter-context.tsx`)

Manages the filtering state across the application:
- Date range filtering
- Customer filtering
- Category filtering
- Amount range filtering
- Search term handling
- Filter state management
- Quick filter application
- Filter clearing functionality

## Data Processing (`lib/data-processing.ts`)

- CSV parsing and data normalization
- Data categorization through mapping tables
- Date handling and formatting
- Numeric value processing
- Category detection through keywords
- Currency and number formatting utilities

## UI Components

The application uses a comprehensive set of UI components from the `components/ui` directory, built on Radix UI primitives with custom styling:
- Buttons, cards, badges
- Form elements (inputs, selects, checkboxes)
- Dialogs, popovers, tooltips
- Charts and data visualization components
- Navigation elements
- Layout components

## Project Structure

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

public/                   # Static assets
  data/                   # Sample data files
    delivery_challan.csv  # Sample delivery data

styles/                   # Global styles
  globals.css             # Global CSS styles
```

## Getting Started

### Prerequisites

- Node.js 16.8.0 or later
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

The application will be available at http://localhost:3000

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Cloud Storage Integration

The application uses Cloudinary for storing and retrieving CSV data files:
- CSV files uploaded through the import dialog are stored in Cloudinary
- Secure cloud storage with automatic backup
- Improved data persistence across sessions
- Ability to share dataset access across users

## Data Format

The application expects CSV data with the following required columns:
- Delivery Challan ID
- Challan Date
- Delivery Challan Number
- Customer Name
- Item Name
- Item Total

Additional columns will be preserved but may not be used in analysis.
# react-analytics
