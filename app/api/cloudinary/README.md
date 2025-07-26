# Cloudinary API Integration

This directory contains API routes for Cloudinary integration, allowing secure server-side operations with the Cloudinary API.

## Setup Required

1. **Create an upload preset in your Cloudinary dashboard:**
   - Log into your Cloudinary account
   - Go to Settings > Upload
   - Scroll down to "Upload presets"
   - Create a new preset named "ml_default" (or update the code to match your preset name)
   - Set it to "Unsigned" for client-side uploads
   - Configure any other settings as needed (folder structure, tags, etc.)

2. **Environment Variables:**
   - The API credentials are currently hardcoded in the code for demonstration
   - In a production environment, move these to environment variables

## API Endpoints

- `GET /api/cloudinary/list-files` - Returns a list of CSV files stored in Cloudinary
- `POST /api/cloudinary/delete-file` - Deletes a file from Cloudinary (requires `publicId` in request body)

## Security Note

For a production application, consider:
1. Adding authentication to these endpoints
2. Using environment variables for API credentials 
3. Adding rate limiting
4. Validating upload file types and sizes
