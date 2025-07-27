// Cloudinary configuration for storing CSV files - Browser-compatible version
// This file uses Fetch API instead of the Node.js Cloudinary SDK

const CLOUD_NAME = "dc6yx9za3";  // Updated to correct cloud name
const API_KEY = "863685715778465";
// API_SECRET should only be used server-side, not in browser code

// Define interface for Cloudinary response
interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  [key: string]: any;
}

/**
 * Upload a CSV file to Cloudinary using Fetch API
 * @param file - The file to upload
 * @param filename - Optional custom filename
 * @returns Promise with upload result
 */
export async function uploadCSVToCloudinary(file: File | Blob): Promise<CloudinaryResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "csv_data");
    formData.append("tags", "csv,delivery_data");
    
    if (file instanceof File) {
      // Keep the original filename but ensure it ends with .csv
      const fileName = file.name.toLowerCase().endsWith('.csv') 
        ? file.name.replace(/\.csv$/i, '') 
        : file.name;
      formData.append("public_id", fileName || `import_${Date.now()}`);
    } else {
      formData.append("public_id", `import_${Date.now()}`);
    }
    
    // Always add .csv extension to the file
    formData.append("filename_override", "true");

    // Use our secure server-side endpoint instead of direct Cloudinary API
    fetch(`/api/cloudinary/upload-file`, {
      method: "POST",
      body: formData,
    })
      .then(async response => {
        if (!response.ok) {
          console.error("Upload error status:", response.status, response.statusText);
          // Try to get the detailed error message from response
          const errorText = await response.text().catch(() => "");
          throw new Error(`Upload failed with status: ${response.status} ${response.statusText}. ${errorText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Upload response:", data);
        if (data.error) {
          reject(new Error(data.error.message || "Upload failed"));
        } else {
          resolve(data);
        }
      })
      .catch(error => {
        console.error("Upload error:", error);
        reject(error);
      });
  });
}

/**
 * Get a list of CSV files stored in Cloudinary
 * @returns Promise with list of resources
 */
export async function getCloudinaryCSVFiles(): Promise<{resources: CloudinaryResponse[]}> {
  // This requires server-side authentication, so we'll use an API route
  // For now, we'll mock the response structure for type safety
  try {
    const response = await fetch("/api/cloudinary/list-files");
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch Cloudinary files:", error);
    return { resources: [] };
  }
}

/**
 * Download a CSV file from Cloudinary
 * @param publicId - The public ID of the file in Cloudinary
 * @returns Promise with the CSV content as string
 */
export async function downloadCSVFromCloudinary(publicId: string): Promise<string> {
  const url = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${publicId}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Delete a CSV file from Cloudinary
 * @param publicId - The public ID of the file in Cloudinary
 * @returns Promise with deletion result
 */
export async function deleteCloudinaryFile(publicId: string): Promise<any> {
  // This requires server-side authentication, so we'll use an API route
  try {
    const response = await fetch("/api/cloudinary/delete-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to delete Cloudinary file:", error);
    throw error;
  }
}
