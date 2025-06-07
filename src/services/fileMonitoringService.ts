
import { googleDriveService } from '@/services/googleDriveService';
import { getAllFileAccessInfo, cleanupFileAccessInfo } from '@/utils/fileUpload';

export interface FileMonitoringResult {
  totalFiles: number;
  accessibleFiles: number;
  inaccessibleFiles: number;
  deletedFiles: string[];
  errors: string[];
}

class FileMonitoringService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  startMonitoring(intervalMinutes: number = 30) {
    if (this.isMonitoring) {
      console.log('File monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting file monitoring with ${intervalMinutes} minute intervals`);

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performFileCheck();
      } catch (error) {
        console.error('Error during file monitoring:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Perform initial check
    this.performFileCheck();
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('File monitoring stopped');
  }

  async performFileCheck(): Promise<FileMonitoringResult> {
    console.log('Performing file accessibility check...');

    const result: FileMonitoringResult = {
      totalFiles: 0,
      accessibleFiles: 0,
      inaccessibleFiles: 0,
      deletedFiles: [],
      errors: []
    };

    try {
      const allFileInfo = getAllFileAccessInfo();
      result.totalFiles = allFileInfo.length;

      for (const fileInfo of allFileInfo) {
        try {
          const isAccessible = await googleDriveService.verifyFileAccess(fileInfo.fileId);
          
          if (isAccessible) {
            result.accessibleFiles++;
          } else {
            result.inaccessibleFiles++;
            result.deletedFiles.push(fileInfo.fileId);
            
            // Clean up access info for inaccessible files
            cleanupFileAccessInfo(fileInfo.fileId);
            
            console.warn(`File ${fileInfo.fileId} is no longer accessible`);
          }
        } catch (error) {
          result.errors.push(`Error checking file ${fileInfo.fileId}: ${error}`);
          console.error(`Error checking file ${fileInfo.fileId}:`, error);
        }
      }

      console.log('File check completed:', result);
      return result;
    } catch (error) {
      console.error('Error performing file check:', error);
      result.errors.push(`General error: ${error}`);
      return result;
    }
  }

  async checkSpecificFile(fileId: string): Promise<boolean> {
    try {
      return await googleDriveService.verifyFileAccess(fileId);
    } catch (error) {
      console.error(`Error checking specific file ${fileId}:`, error);
      return false;
    }
  }

  async getMonitoringStats(): Promise<FileMonitoringResult> {
    return await this.performFileCheck();
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}

export const fileMonitoringService = new FileMonitoringService();

// Auto-start monitoring when service is imported
if (typeof window !== 'undefined') {
  // Start monitoring in browser environment
  fileMonitoringService.startMonitoring(30); // Check every 30 minutes
}
