import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function listCloudinaryFiles() {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.api.resources(
        {
          type: "upload",
          resource_type: "raw",
          prefix: "csv_data",
          max_results: 100,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Error listing Cloudinary files:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteCloudinaryFile(publicId: string) {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: "raw" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Error deleting Cloudinary file:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
