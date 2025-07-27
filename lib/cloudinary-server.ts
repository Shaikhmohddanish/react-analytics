import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary with hardcoded credentials
cloudinary.config({
  cloud_name: "dc6yx9za3",
  api_key: "863685715778465",
  api_secret: "Q2v55Jp_lf2Bz1B6qUI2ppApNZA",
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
