
import { googleDriveService } from '@/services/googleDriveService';
import { GOOGLE_DRIVE_CONFIG } from '@/config/googleDrive';

export const SUPPORTED_FILE_TYPES = GOOGLE_DRIVE_CONFIG.supportedFileTypes;
export const MAX_FILE_SIZE = GOOGLE_DRIVE_CONFIG.maxFileSize;

export interface FileValidation {
  isValid: boolean;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileAccessInfo {
  fileId: string;
  isAccessible: boolean;
  webViewLink?: string;
  downloadUrl?: string;
  lastChecked: Date;
}

export const validateFile = (file: File): FileValidation => {
  if (!file) {
    return {
      isValid: false,
      error: 'No file selected'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File appears to be empty'
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

  // Check for potentially dangerous file names
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      isValid: false,
      error: 'Invalid file name. File name cannot contain path characters'
    };
  }

  return { isValid: true };
};

export const uploadFile = async (
  file: File, 
  customerId: string, 
  documentId: string,
  customerFolderId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    console.log(`Starting upload: ${file.name} to folder ${customerFolderId} for document ${documentId}`);

    // Validate inputs
    if (!file) {
      throw new Error('File is required');
    }

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    if (!customerFolderId) {
      throw new Error('Customer folder ID is required');
    }

    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Check if Google Drive service is healthy
    const isHealthy = await googleDriveService.isServiceHealthy();
    if (!isHealthy) {
      throw new Error('Google Drive service is currently unavailable');
    }

    // Simulate progress if callback provided
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, percentage: 0 });
    }

    // Upload to Google Drive
    const driveFile = await googleDriveService.uploadFile(
      file, 
      customerFolderId, 
      `${documentId}-${file.name}`
    );

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    console.log(`File uploaded successfully: ${driveFile.id}`);

    // Store file access information for future verification
    const fileAccessInfo: FileAccessInfo = {
      fileId: driveFile.id,
      isAccessible: true,
      webViewLink: driveFile.webViewLink,
      downloadUrl: driveFile.downloadUrl,
      lastChecked: new Date()
    };

    // Store in localStorage for tracking
    const fileAccessKey = `file_access_${driveFile.id}`;
    localStorage.setItem(fileAccessKey, JSON.stringify(fileAccessInfo));

    // Return the complete file path with both view and download links
    return JSON.stringify({
      fileId: driveFile.id,
      webViewLink: driveFile.webViewLink,
      downloadUrl: driveFile.downloadUrl,
      name: driveFile.name
    });
    
  } catch (error) {
    console.error('Upload failed:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('AUTH_FAILED')) {
        throw new Error('Authentication with Google Drive failed. Please contact support.');
      }
      if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('Storage quota exceeded. Please contact support.');
      }
      if (error.message.includes('NETWORK')) {
        throw new Error('Network error occurred. Please check your connection and try again.');
      }
      throw error;
    }
    
    throw new Error('Upload failed due to an unexpected error');
  }
};

export const verifyFileAccess = async (filePath: string): Promise<boolean> => {
  try {
    // Parse the file path to get file ID
    const fileInfo = JSON.parse(filePath);
    const fileId = fileInfo.fileId;
    
    if (!fileId) {
      console.error('No file ID found in file path');
      return false;
    }

    // Check if file is still accessible
    const isAccessible = await googleDriveService.verifyFileAccess(fileId);
    
    // Update access info in localStorage
    const fileAccessKey = `file_access_${fileId}`;
    const existingInfo = localStorage.getItem(fileAccessKey);
    
    if (existingInfo) {
      const accessInfo: FileAccessInfo = JSON.parse(existingInfo);
      accessInfo.isAccessible = isAccessible;
      accessInfo.lastChecked = new Date();
      localStorage.setItem(fileAccessKey, JSON.stringify(accessInfo));
    }

    return isAccessible;
  } catch (error) {
    console.error('Error verifying file access:', error);
    return false;
  }
};

export const getFileViewLink = (filePath: string): string | null => {
  try {
    const fileInfo = JSON.parse(filePath);
    return fileInfo.webViewLink || null;
  } catch (error) {
    console.error('Error parsing file path:', error);
    return null;
  }
};

export const getFileDownloadLink = (filePath: string): string | null => {
  try {
    const fileInfo = JSON.parse(filePath);
    return fileInfo.downloadUrl || null;
  } catch (error) {
    console.error('Error parsing file path:', error);
    return null;
  }
};

export const getFileName = (filePath: string): string => {
  try {
    const fileInfo = JSON.parse(filePath);
    return fileInfo.name || 'Unknown File';
  } catch (error) {
    console.error('Error parsing file path:', error);
    return 'Unknown File';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return '🖼️';
    case 'txt':
      return '📋';
    default:
      return '📎';
  }
};

// Function to clean up file access info for deleted files
export const cleanupFileAccessInfo = (fileId: string): void => {
  const fileAccessKey = `file_access_${fileId}`;
  localStorage.removeItem(fileAccessKey);
};

// Function to get all file access info for monitoring
export const getAllFileAccessInfo = (): FileAccessInfo[] => {
  const accessInfoList: FileAccessInfo[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('file_access_')) {
      try {
        const accessInfo = JSON.parse(localStorage.getItem(key) || '');
        accessInfoList.push(accessInfo);
      } catch (error) {
        console.error('Error parsing file access info:', error);
      }
    }
  }
  
  return accessInfoList;
};
