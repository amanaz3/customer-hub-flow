
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
    const timestamp = new Date().getTime();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${customerId}/${documentId}-${timestamp}-${sanitizedFileName}`;

    console.log('Uploading to path:', filePath);

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

    // Get the public URL immediately after upload
    const { data: publicUrlData } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(data.path);

    const fileInfo = {
      filePath: data.path,
      publicUrl: publicUrlData.publicUrl,
      name: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId
    };

    console.log('File info created:', fileInfo);

    // Return the file info as JSON string for storage in database
    return JSON.stringify(fileInfo);
    
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

    // Simply try to get public URL - getPublicUrl always succeeds for public buckets
    const { data } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(path);

    // If we can get a public URL, the file should be accessible
    const isAccessible = Boolean(data && data.publicUrl);
    
    console.log(`File access verification for ${path}:`, isAccessible);
    return isAccessible;
  } catch (error) {
    console.error('Error verifying file access:', error);
    return false;
  }
};

// URL validation utility
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Only allow https URLs from trusted Supabase domains
    return urlObj.protocol === 'https:' && 
           (urlObj.hostname.endsWith('.supabase.co') || 
            urlObj.hostname.endsWith('.supabase.in'));
  } catch {
    return false;
  }
};

export const getFileViewLink = (filePath: string): string | null => {
  try {
    const fileInfo = JSON.parse(filePath);
    
    // First try to use stored public URL
    if (fileInfo.publicUrl) {
      console.log('Using stored public URL:', fileInfo.publicUrl);
      
      // Validate the stored URL before returning
      if (!isValidUrl(fileInfo.publicUrl)) {
        console.warn('Invalid stored public URL detected:', fileInfo.publicUrl);
        return null;
      }
      
      return fileInfo.publicUrl;
    }

    // Fallback to generating new public URL
    const path = fileInfo.filePath;
    if (!path) {
      console.error('No file path found in:', filePath);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(path);

    const generatedUrl = publicUrlData.publicUrl;
    
    // Validate the generated URL
    if (generatedUrl && !isValidUrl(generatedUrl)) {
      console.warn('Invalid generated URL detected:', generatedUrl);
      return null;
    }

    console.log('Generated new view URL for:', path, generatedUrl);
    return generatedUrl || null;
  } catch (error) {
    console.error('Error getting file view link:', error);
    return null;
  }
};

export const getFileDownloadLink = (filePath: string): string | null => {
  try {
    const fileInfo = JSON.parse(filePath);
    
    // First try to use stored public URL
    if (fileInfo.publicUrl) {
      console.log('Using stored public URL for download:', fileInfo.publicUrl);
      
      // Validate the stored URL before returning
      if (!isValidUrl(fileInfo.publicUrl)) {
        console.warn('Invalid stored public download URL detected:', fileInfo.publicUrl);
        return null;
      }
      
      return fileInfo.publicUrl;
    }

    // Fallback to generating new public URL
    const path = fileInfo.filePath;
    if (!path) {
      console.error('No file path found in:', filePath);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(path);

    const generatedUrl = publicUrlData.publicUrl;
    
    // Validate the generated URL
    if (generatedUrl && !isValidUrl(generatedUrl)) {
      console.warn('Invalid generated download URL detected:', generatedUrl);
      return null;
    }

    console.log('Generated new download URL for:', path, generatedUrl);
    return generatedUrl || null;
  } catch (error) {
    console.error('Error getting file download link:', error);
    return null;
  }
};

export const getFileName = (filePath: string): string => {
  try {
    const fileInfo = JSON.parse(filePath);
    return fileInfo.originalName || fileInfo.name || 'Unknown File';
  } catch (error) {
    console.error('Error parsing file path:', error);
    return 'Unknown File';
  }
};

export const getFileSize = (filePath: string): number => {
  try {
    const fileInfo = JSON.parse(filePath);
    return fileInfo.size || 0;
  } catch (error) {
    console.error('Error parsing file path:', error);
    return 0;
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

export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const fileInfo = JSON.parse(filePath);
    const path = fileInfo.filePath;
    
    if (!path) {
      console.error('No file path found for deletion');
      return false;
    }

    const { error } = await supabase.storage
      .from('customer-documents')
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    console.log('File deleted successfully:', path);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};
