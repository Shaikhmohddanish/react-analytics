# Delivery Analytics Dashboard

A comprehensive analytics dashboard for delivery challan data with advanced visualization, filtering, and reporting features.

## Project Overview

This Next.js application provides a sophisticated analytics platform for analyzing delivery challan data. It offers various dashboards and views to help businesses gain insights into their delivery operations, customer performance, and product sales.

## Technologies Used

- **Framework**: Next.js 14 with React 18
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
   - In-depth data analysis
   - Cross-referencing capabilities

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
   - CSV file upload interface
   - Data validation with error reporting
   - Import mode selection (replace or append)
   - Data preview functionality

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
