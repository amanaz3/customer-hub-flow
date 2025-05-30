
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    };
  }

  // Check file type
  if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.type}. Supported types: PDF, JPEG, PNG, DOCX, DOC`
    };
  }

  return { isValid: true };
};

export const uploadFile = async (file: File, customerId: string, documentId: string): Promise<string> => {
  // Simulate file upload - In a real app, this would upload to a cloud storage service
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate occasional upload failures for testing
      if (Math.random() < 0.1) {
        reject(new Error('Upload failed due to network error. Please try again.'));
        return;
      }
      
      // Generate a mock file path
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `/uploads/${customerId}/${documentId}/${fileName}`;
      
      console.log(`File uploaded successfully: ${fileName}`);
      resolve(filePath);
    }, 2000); // 2 second delay to simulate upload
  });
};
