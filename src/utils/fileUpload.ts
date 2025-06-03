
import { googleDriveService } from '@/services/googleDriveService';

export const SUPPORTED_FILE_TYPES = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.txt': 'text/plain'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidation {
  isValid: boolean;
  error?: string;
}

export const validateFile = (file: File): FileValidation => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    };
  }

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!Object.keys(SUPPORTED_FILE_TYPES).includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type not supported. Supported types: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}`
    };
  }

  return { isValid: true };
};

export const uploadFile = async (
  file: File, 
  customerId: string, 
  documentId: string,
  customerFolderId?: string
): Promise<string> => {
  try {
    console.log(`Uploading file ${file.name} for customer ${customerId}, document ${documentId}`);

    // If no folder ID provided, we'll need to get it from somewhere
    // In a real implementation, this would be stored with the customer data
    if (!customerFolderId) {
      throw new Error('Customer folder ID not found');
    }

    // Upload to Google Drive
    const driveFile = await googleDriveService.uploadFile(
      file, 
      customerFolderId, 
      `${documentId}-${file.name}`
    );

    // Return the Drive file ID as the file path
    return `/drive/${driveFile.id}`;
    
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Upload failed');
  }
};
