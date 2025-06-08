
import { supabase } from '@/lib/supabase';

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

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const validateFile = (file: File): FileValidation => {
  if (!file) {
    return {
      isValid: false,
      error: 'No file selected'
    };
  }

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

  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!Object.keys(SUPPORTED_FILE_TYPES).includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type not supported. Supported types: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}`
    };
  }

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
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    console.log(`Starting upload: ${file.name} for customer ${customerId}, document ${documentId}`);

    if (!file || !customerId || !documentId || !userId) {
      throw new Error('Missing required parameters for file upload');
    }

    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, percentage: 0 });
    }

    // Create file path: userId/customerId/documentId-filename
    const filePath = `${userId}/${customerId}/${documentId}-${file.name}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('customer-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    console.log(`File uploaded successfully: ${data.path}`);

    // Return the file path for storage in database
    return JSON.stringify({
      filePath: data.path,
      name: file.name,
      uploadedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Upload failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('row-level security')) {
        throw new Error('Authentication required for file upload. Please sign in.');
      }
      if (error.message.includes('storage')) {
        throw new Error('Storage service error. Please try again.');
      }
      throw error;
    }
    
    throw new Error('Upload failed due to an unexpected error');
  }
};

export const verifyFileAccess = async (filePath: string): Promise<boolean> => {
  try {
    const fileInfo = JSON.parse(filePath);
    const path = fileInfo.filePath;
    
    if (!path) {
      console.error('No file path found');
      return false;
    }

    // Check if the file exists by trying to get its metadata
    const { data, error } = await supabase.storage
      .from('customer-documents')
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      });

    const isAccessible = !error && data && data.length > 0;
    
    console.log(`File access verification for ${path}:`, isAccessible);
    return isAccessible;
  } catch (error) {
    console.error('Error verifying file access:', error);
    return false;
  }
};

export const getFileViewLink = (filePath: string): string | null => {
  try {
    const fileInfo = JSON.parse(filePath);
    const path = fileInfo.filePath;
    
    if (!path) {
      console.error('No file path found in:', filePath);
      return null;
    }

    // Always get fresh public URL from Supabase Storage
    const { data: publicUrlData } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(path);

    console.log('Generated view URL for:', path, publicUrlData.publicUrl);
    return publicUrlData.publicUrl || null;
  } catch (error) {
    console.error('Error getting file view link:', error);
    return null;
  }
};

export const getFileDownloadLink = (filePath: string): string | null => {
  try {
    const fileInfo = JSON.parse(filePath);
    const path = fileInfo.filePath;
    
    if (!path) {
      console.error('No file path found in:', filePath);
      return null;
    }

    // Always get fresh public URL from Supabase Storage
    const { data: publicUrlData } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(path);

    console.log('Generated download URL for:', path, publicUrlData.publicUrl);
    return publicUrlData.publicUrl || null;
  } catch (error) {
    console.error('Error getting file download link:', error);
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
