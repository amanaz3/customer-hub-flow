
// Security utility functions
export const sanitizeInput = (input: string): string => {
  // Basic XSS prevention - escape HTML entities
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const validateFileType = (fileName: string, allowedTypes: string[]): boolean => {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  return fileExtension ? allowedTypes.includes(fileExtension) : false;
};

export const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

export const enforcePasswordPolicy = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const rateLimiter = (() => {
  const attempts: { [key: string]: { count: number; lastAttempt: number } } = {};
  
  return {
    canAttempt: (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
      const now = Date.now();
      const userAttempts = attempts[key];
      
      if (!userAttempts) {
        attempts[key] = { count: 1, lastAttempt: now };
        return true;
      }
      
      // Reset if window has passed
      if (now - userAttempts.lastAttempt > windowMs) {
        attempts[key] = { count: 1, lastAttempt: now };
        return true;
      }
      
      // Check if under limit
      if (userAttempts.count < maxAttempts) {
        userAttempts.count++;
        userAttempts.lastAttempt = now;
        return true;
      }
      
      return false;
    },
    
    reset: (key: string): void => {
      delete attempts[key];
    }
  };
})();
