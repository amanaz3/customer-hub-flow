
import { googleDriveService } from '@/services/googleDriveService';

export const uploadToGoogleDrive = async (
  file: File, 
  customerId: string, 
  documentId: string
): Promise<string> => {
  try {
    // Ensure authentication
    if (!googleDriveService.isAuthenticated()) {
      await googleDriveService.initializeAuth();
    }

    // Create customer folder if it doesn't exist
    const customerFolderName = `Customer_${customerId}`;
    let customerFolderId: string;
    
    try {
      customerFolderId = await googleDriveService.createFolder(customerFolderName);
    } catch (error) {
      // Folder might already exist, for now we'll create a new one
      // In production, you'd want to search for existing folders
      customerFolderId = await googleDriveService.createFolder(`${customerFolderName}_${Date.now()}`);
    }

    // Upload file
    const fileName = `${documentId}_${file.name}`;
    const fileId = await googleDriveService.uploadFile(file, fileName, customerFolderId);
    
    // Get shareable link
    const fileLink = await googleDriveService.getFileLink(fileId);
    
    return fileLink;
  } catch (error) {
    console.error('Google Drive upload failed:', error);
    throw new Error(`Failed to upload to Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const validateFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const supportedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${(maxSize / (1024 * 1024)).toFixed(1)}MB`
    };
  }

  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not supported. Please use PDF, JPEG, PNG, DOC, or DOCX files.'
    };
  }

  return { isValid: true };
};

export const SUPPORTED_FILE_TYPES = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
