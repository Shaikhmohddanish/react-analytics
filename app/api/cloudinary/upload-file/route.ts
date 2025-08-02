import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configure body size limit for larger files
export const bodyParser = {
  sizeLimit: '50mb',
};

export async function POST(request: NextRequest) {
  try {
    // Get the file data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Get other form data fields
    const folder = formData.get('folder') || 'csv_data';
    const tags = formData.get('tags') || 'csv,delivery_data';
    
    // Convert File to buffer for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate a filename/public_id
    let publicId = formData.get('public_id') as string;
    if (!publicId) {
      publicId = file.name ? 
        file.name : 
        `import_${Date.now()}`;
    }
    
    // Ensure the publicId ends with .csv
    if (!publicId.toLowerCase().endsWith('.csv')) {
      publicId += '.csv';
    }
    
    // Upload to Cloudinary using the Node SDK
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder as string,
          public_id: publicId,
          resource_type: 'raw',
          tags: tags as string,
          use_filename: true,
          unique_filename: false,
          filename_override: "true",
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      // Convert buffer to stream and pipe to Cloudinary
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Server-side upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
