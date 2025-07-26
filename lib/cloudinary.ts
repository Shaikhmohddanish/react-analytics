// Cloudinary configuration for storing CSV files - Browser-compatible version
// This file uses Fetch API instead of the Node.js Cloudinary SDK

const CLOUD_NAME = "dsmyl2zgy";  // Updated to correct cloud name
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
    formData.append("upload_preset", "ml_default"); // Create this unsigned preset in your Cloudinary dashboard
    formData.append("cloud_name", CLOUD_NAME);
    formData.append("folder", "csv_data");
    formData.append("resource_type", "raw");
    formData.append("tags", "csv,delivery_data");
    
    if (file instanceof File) {
      formData.append("public_id", file.name.replace(/\.[^/.]+$/, "") || `import_${Date.now()}`);
    } else {
      formData.append("public_id", `import_${Date.now()}`);
    }

    fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
      method: "POST",
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          reject(new Error(data.error.message));
        } else {
          resolve(data);
        }
      })
      .catch(error => reject(error));
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
