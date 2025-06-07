
import { SignJWT } from 'jose';
import { GOOGLE_DRIVE_CONFIG, getServiceAccountConfig } from '@/config/googleDrive';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface DriveError extends Error {
  code?: string;
  status?: number;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private amanaFolderId: string | null = null;

  private async importPrivateKey(): Promise<CryptoKey> {
    try {
      const config = getServiceAccountConfig();
      const privateKeyPem = config.private_key
        .replace(/\\n/g, '\n')
        .trim();

      const privateKeyBase64 = privateKeyPem
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');

      const binaryDer = atob(privateKeyBase64);
      const keyBuffer = new Uint8Array(binaryDer.length);
      for (let i = 0; i < binaryDer.length; i++) {
        keyBuffer[i] = binaryDer.charCodeAt(i);
      }

      return await crypto.subtle.importKey(
        'pkcs8',
        keyBuffer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );
    } catch (error) {
      console.error('Error importing private key:', error);
      throw new Error('Failed to import Google Drive private key');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const config = getServiceAccountConfig();
      const now = Math.floor(Date.now() / 1000);
      
      console.log('Importing private key for JWT signing');
      const privateKey = await this.importPrivateKey();
      
      console.log('Creating JWT with imported private key');

      const jwt = await new SignJWT({
        iss: config.client_email,
        scope: "https://www.googleapis.com/auth/drive",
        aud: config.token_uri,
        exp: now + 3600,
        iat: now
      })
        .setProtectedHeader({ 
          alg: 'RS256',
          kid: config.private_key_id,
          typ: 'JWT'
        })
        .sign(privateKey);

      console.log('JWT created successfully');

      const response = await fetch(config.token_uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token request failed:', errorText);
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

      console.log('Successfully obtained access token');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      const driveError: DriveError = new Error('Failed to authenticate with Google Drive');
      driveError.code = 'AUTH_FAILED';
      throw driveError;
    }
  }

  private async findFolderByName(name: string, parentId?: string): Promise<string | null> {
    try {
      const accessToken = await this.getAccessToken();
      const query = parentId 
        ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
        : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const response = await fetch(
        `${GOOGLE_DRIVE_CONFIG.apiUrl}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        console.error('Search folder failed:', response.status, response.statusText);
        return null;
      }

      const result = await response.json();
      return result.files && result.files.length > 0 ? result.files[0].id : null;
    } catch (error) {
      console.error('Error finding folder:', error);
      return null;
    }
  }

  private async shareFolder(folderId: string, email: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      
      const permission = {
        role: 'writer',
        type: 'user',
        emailAddress: email
      };

      const response = await fetch(`${GOOGLE_DRIVE_CONFIG.apiUrl}/files/${folderId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permission)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Permission sharing failed:', errorText);
        throw new Error(`Failed to share folder: ${response.status} ${response.statusText}`);
      }

      console.log(`Folder ${folderId} shared with ${email}`);
    } catch (error) {
      console.error('Error sharing folder:', error);
      throw new Error('Failed to share folder with banking team');
    }
  }

  private async createFolder(name: string, parentId?: string): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();
      
      const metadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : ['root']
      };

      const response = await fetch(`${GOOGLE_DRIVE_CONFIG.apiUrl}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Folder creation failed:', errorText);
        throw new Error(`Failed to create folder: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`Folder '${name}' created:`, result.id);
      return result.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error('Failed to create folder in Google Drive');
    }
  }

  private async ensureAmanaFolder(): Promise<string> {
    if (this.amanaFolderId) {
      return this.amanaFolderId;
    }

    try {
      let folderId = await this.findFolderByName('amana');
      
      if (!folderId) {
        console.log('Creating amana folder...');
        folderId = await this.createFolder('amana');
        
        console.log(`Sharing amana folder with ${GOOGLE_DRIVE_CONFIG.bankingEmail}...`);
        await this.shareFolder(folderId, GOOGLE_DRIVE_CONFIG.bankingEmail);
      }

      this.amanaFolderId = folderId;
      return folderId;
    } catch (error) {
      console.error('Error ensuring amana folder:', error);
      throw new Error('Failed to create or access amana folder');
    }
  }

  async createCustomerFolder(customerName: string): Promise<string> {
    if (!customerName || typeof customerName !== 'string') {
      throw new Error('Valid customer name is required');
    }

    try {
      const amanaFolderId = await this.ensureAmanaFolder();
      
      let customerFolderId = await this.findFolderByName(customerName, amanaFolderId);
      
      if (!customerFolderId) {
        customerFolderId = await this.createFolder(customerName, amanaFolderId);
      }

      console.log(`Customer folder created/found: ${customerFolderId} for ${customerName}`);
      return customerFolderId;
    } catch (error) {
      console.error('Error creating customer folder:', error);
      const driveError: DriveError = new Error('Failed to create customer folder in Google Drive');
      driveError.code = 'FOLDER_CREATION_FAILED';
      throw driveError;
    }
  }

  async uploadFile(file: File, folderId: string, fileName?: string): Promise<DriveFile> {
    if (!file) {
      throw new Error('File is required for upload');
    }

    if (!folderId) {
      throw new Error('Folder ID is required for upload');
    }

    // Validate file size
    if (file.size > GOOGLE_DRIVE_CONFIG.maxFileSize) {
      throw new Error(`File size exceeds ${GOOGLE_DRIVE_CONFIG.maxFileSize / (1024 * 1024)}MB limit`);
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!Object.keys(GOOGLE_DRIVE_CONFIG.supportedFileTypes).includes(fileExtension)) {
      throw new Error(`File type not supported. Supported types: ${Object.keys(GOOGLE_DRIVE_CONFIG.supportedFileTypes).join(', ')}`);
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const metadata = {
        name: fileName || file.name,
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
      form.append('file', file);

      const response = await fetch(`${GOOGLE_DRIVE_CONFIG.uploadUrl}/files?uploadType=multipart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: form
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('File upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
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
      const driveError: DriveError = new Error('Failed to upload file to Google Drive');
      driveError.code = 'UPLOAD_FAILED';
      throw driveError;
    }
  }

  async listFiles(folderId: string): Promise<DriveFile[]> {
    if (!folderId) {
      throw new Error('Folder ID is required to list files');
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `${GOOGLE_DRIVE_CONFIG.apiUrl}/files?q='${folderId}' in parents&fields=files(id,name,mimeType,webViewLink)`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('List files failed:', errorText);
        return [];
      }

      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!fileId) {
      throw new Error('File ID is required for deletion');
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${GOOGLE_DRIVE_CONFIG.apiUrl}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('File deletion failed:', errorText);
        throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
      }

      console.log('File deleted from Drive:', fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }

  async getAmanaFolderId(): Promise<string> {
    return await this.ensureAmanaFolder();
  }

  // Health check method
  async isServiceHealthy(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Google Drive service health check failed:', error);
      return false;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
