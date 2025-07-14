// Enhanced file upload with comprehensive error handling and monitoring
import { supabase } from '@/lib/supabase';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  maxRetries?: number;
  chunkSize?: number;
}

export class OptimizedFileUploader {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

  static async uploadWithRetry(
    file: File,
    path: string,
    options: UploadOptions = {}
  ): Promise<{ success: boolean; data?: any; error?: string; metrics?: any }> {
    const startTime = Date.now();
    const { maxRetries = 3, onProgress } = options;

    // Pre-upload validation
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      return { 
        success: false, 
        error: validation.errors.join(', '),
        metrics: { duration: 0, attempts: 0, fileSize: file.size }
      };
    }

    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt + 1} for file: ${file.name}`);
        
        // Simulate progress if callback provided
        if (onProgress) {
          onProgress({ loaded: 0, total: file.size, percentage: 0 });
        }

        const { data, error } = await supabase.storage
          .from('customer-documents')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            // Add metadata for monitoring
            metadata: {
              uploadedAt: new Date().toISOString(),
              attempt: attempt + 1,
              originalName: file.name,
              userAgent: navigator.userAgent
            }
          });

        if (error) {
          lastError = error;
          console.error(`Upload attempt ${attempt + 1} failed:`, error);
          
          // Don't retry on certain errors
          if (error.message?.includes('duplicate') || error.message?.includes('permissions')) {
            break;
          }
          
          // Wait before retry
          if (attempt < maxRetries - 1) {
            await this.delay(this.RETRY_DELAYS[attempt] || 4000);
          }
          continue;
        }

        // Success
        const metrics = {
          duration: Date.now() - startTime,
          attempts: attempt + 1,
          fileSize: file.size,
          uploadSpeed: file.size / ((Date.now() - startTime) / 1000) // bytes per second
        };

        if (onProgress) {
          onProgress({ loaded: file.size, total: file.size, percentage: 100 });
        }

        // Log success metrics for monitoring
        console.log('Upload success metrics:', metrics);
        
        return { success: true, data, metrics };

      } catch (error) {
        lastError = error;
        console.error(`Upload attempt ${attempt + 1} exception:`, error);
        
        if (attempt < maxRetries - 1) {
          await this.delay(this.RETRY_DELAYS[attempt] || 4000);
        }
      }
    }

    // All attempts failed
    const metrics = {
      duration: Date.now() - startTime,
      attempts: maxRetries,
      fileSize: file.size,
      finalError: lastError?.message || 'Unknown error'
    };

    return { 
      success: false, 
      error: `Upload failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
      metrics 
    };
  }

  private static validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Size check
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    // Type check
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.ALLOWED_TYPES.includes(extension)) {
      errors.push(`File type .${extension} not allowed. Allowed: ${this.ALLOWED_TYPES.join(', ')}`);
    }

    // Content type check (additional security)
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedMimeTypes.includes(file.type)) {
      errors.push(`MIME type ${file.type} not allowed`);
    }

    // File integrity check
    if (file.size === 0) {
      errors.push('File appears to be empty');
    }

    return { isValid: errors.length === 0, errors };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Monitor upload success rates
  static getUploadMetrics(): { successRate: number; avgDuration: number; commonErrors: string[] } {
    // This would integrate with your monitoring service
    // For now, return placeholder data
    return {
      successRate: 0.95, // 95% success rate target
      avgDuration: 2500, // 2.5 seconds average
      commonErrors: ['Network timeout', 'File too large', 'Invalid file type']
    };
  }
}