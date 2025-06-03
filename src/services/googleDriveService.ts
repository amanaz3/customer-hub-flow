
// Note: In production, API credentials should be stored securely on the backend
const GOOGLE_DRIVE_API_KEY = 'e4557508a92e7dfea6336302d941fd0329260d0d';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

class GoogleDriveService {
  private gapi: any;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Load Google API
    await this.loadGAPI();
    
    await this.gapi.load('client:auth2', async () => {
      await this.gapi.client.init({
        apiKey: GOOGLE_DRIVE_API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      this.isInitialized = true;
    });
  }

  private loadGAPI(): Promise<void> {
    return new Promise((resolve) => {
      if (window.gapi) {
        this.gapi = window.gapi;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.gapi = window.gapi;
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async createCustomerFolder(customerName: string, customerId: string): Promise<string> {
    await this.initialize();

    const folderName = `${customerName} - ${customerId}`;
    
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['root'] // Create in root directory
    };

    try {
      const response = await this.gapi.client.drive.files.create({
        resource: metadata
      });
      
      console.log('Customer folder created:', response.result.id);
      return response.result.id;
    } catch (error) {
      console.error('Error creating customer folder:', error);
      throw new Error('Failed to create customer folder');
    }
  }

  async uploadFile(file: File, folderId: string, fileName?: string): Promise<DriveFile> {
    await this.initialize();

    const metadata = {
      name: fileName || file.name,
      parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    form.append('file', file);

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({
          'Authorization': `Bearer ${await this.getAccessToken()}`
        }),
        body: form
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('File uploaded to Drive:', result.id);
      
      return {
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        webViewLink: result.webViewLink
      };
    } catch (error) {
      console.error('Error uploading file to Drive:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }

  private async getAccessToken(): Promise<string> {
    // This would require OAuth authentication in a real implementation
    // For now, return the API key (not ideal for production)
    return GOOGLE_DRIVE_API_KEY;
  }

  async listFiles(folderId: string): Promise<DriveFile[]> {
    await this.initialize();

    try {
      const response = await this.gapi.client.drive.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id,name,mimeType,webViewLink)'
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.initialize();

    try {
      await this.gapi.client.drive.files.delete({
        fileId: fileId
      });
      console.log('File deleted from Drive:', fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }
}

export const googleDriveService = new GoogleDriveService();
