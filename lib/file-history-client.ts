// Client-side file history operations
// This file contains functions to interact with the file history API endpoints

/**
 * Store file upload history in MongoDB
 * @param fileData The file metadata to store
 * @returns The response from the API
 */
export async function storeFileUploadHistory(fileData: {
  fileName: string;
  fileSize: number;
  cloudinaryPublicId?: string | null;
  cloudinaryUrl?: string | null;
  recordCount?: number;
  description?: string;
}): Promise<{ success: boolean, fileId?: string, error?: string }> {
  try {
    const response = await fetch('/api/mongodb/store-file-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fileData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error storing file upload history:', error);
    throw error;
  }
}

/**
 * Get file upload history from MongoDB
 * @param includeDeleted Whether to include files marked as deleted
 * @returns The file history data
 */
export async function getFileUploadHistory(includeDeleted = false) {
  try {
    const response = await fetch(`/api/mongodb/get-file-history?includeDeleted=${includeDeleted}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching file upload history:', error);
    throw error;
  }
}

/**
 * Mark a file as deleted in the history
 * @param fileId The ID of the file to mark as deleted
 * @returns The response from the API
 */
export async function markFileDeleted(fileId: string) {
  try {
    const response = await fetch('/api/mongodb/mark-file-deleted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error marking file as deleted:', error);
    throw error;
  }
}
