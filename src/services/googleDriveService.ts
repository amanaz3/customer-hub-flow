import { SignJWT } from 'jose';

// Service Account Configuration
const SERVICE_ACCOUNT_CONFIG = {
  type: "service_account",
  project_id: "inbound-pattern-461813-p5",
  private_key_id: "e4557508a92e7dfea6336302d941fd0329260d0d",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCrUaWzpKh/RMdz\nesazodFfPowMFvMnca8oc400izaOmhekUXvWZg9fVMpXtRbUHp0/bOSloBAMJZrr\nh/Rfp2ljhQ4ycOkq3lo/jsxVUV90SXlelzV7cH7B+l0bdyLiTq1HjCaZOo4HW49b\nCBaf/Bc1FbvcKbyghF7yP4dCPdNkSBb1H6vufI4vZxBpHk9qV/dtX5OCOLRaxUUb\nrQyjiqBEVFHmWAvQFKuidEYjmH3BSymLr+Ui4S6M9K0hYhRgQRXlVUPnnOZCUKqc\nwND4K6sCc3DX4xf38AgLE12iqle9pc4cFid9XwPgXQLRb87tqV9dcgE31BxGJHwg\nxPLLko/9AgMBAAECggEAAfeTh/8FgkSXZ6+KtYhPn6DXudHPo+3NvZCqF+bbTwLc\n76GR4vHUDluqYRxusSvS0WYeL/qpBIKwBzFN8IU7FA30jka2nqvj7GPm27nt9yda\n0ee5kPvHMNH/nK+fAms12SL2VH8UH2iBOmHa5KZf29euiwYdqNgsQOrS0kNkeHvI\nlRTc4XDgAF7R3BlIqzjQqyqW6gWIM8gIcpcl0Srf73BliWmhZC/rmW9A+TgVxd7Z\nTu8YF8AX2N4P1qhTmKj7c8kC0dlxYVfQifADedoR9Q/jUs1LvkAxT+o90vLopUoW\nQthJWX/Y7EnPC2WoNZYYuqeNu89/yML9wBjTc3BvXwKBgQDpwLlR8Qj4eO3ILxpX\nr5cigQXuWEPjSL+fNGetrkUTWphWFFDlTYyJEbqTa8rkHjMZw+6j5a2PCCkhla3F\n2H5+I2rRbUJ5EFnBF4cx0wAQMUeleKAxsWlY9zpmNwMiEiBWzVUoYutdQ1Wsxk7k\nysFBxATxy5cNvsrQdjbB5iKgEwKBgQC7n8BY3bnbB6wQSqLrevipYk/AgxtaZ4CN\nXffWQsWZu91U2PH0ZHz7Js2hjBFNcpL7nMC8RidXwAVPFfBviMEGD6nxlwK/QYwh\nOjF8fZtBTLdQqmegLbahbtUkmi5oH0ez4uT90LtKCHPqo/rGrD4/tDSgDcEFmEQ7\n4Xi9/R6xrwKBgGdbUhYLT/4d6nXjbfBrsZYOGsNCv/HVjvUkRNuk/OIL4uPc49Ag\nNA2/ixH4TaQEPnAcFH7f5Zgi8ZzqBAZBLd00Z9zmRMgnFKiucJb1R0fhol5mMd8H\nJR+zYV0k4fvErAv1irvq0UtRpKZaoTPE+yLLO6x2avom7KK0Qo4F5jWFAoGACbPI\nIZBNtRrfdfQ2GpFAXJn938mn13P0vNq4HzdSupFxb5rMYEP2BpLKHWl915BuM162\nxMWn8Sy32ZAb39iliqeytRCHDtbX5Tv6JSLlrWnHLP+y3iCfChgOI5dpgO7lKVM5\nXjq2BK0NOXwDUtTDX031TrWHXr+x/5q4QLLfLHcCgYA1jqQP1H9LZSymYSiTodY3\nhuNWhlyPdWncMxI1WnYT0R0LfSScrYW8PySfXdzeq3PVdU40sEUE3aD1sVOYGldk\nGiCcLJVs35N7sDeHWI/7FXiJoNuHZSOJyW5u+0i51HD1M08Meb8KaxY7r24+Of50\nOZiWh/G4y0GwK+OuOdJAig==\n-----END PRIVATE KEY-----\n",
  client_email: "amana-912@inbound-pattern-461813-p5.iam.gserviceaccount.com",
  client_id: "103117814412564644548",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/amana-912%40inbound-pattern-461813-p5.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const GOOGLE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async importPrivateKey(): Promise<CryptoKey> {
    // Clean and format the private key
    const privateKeyPem = SERVICE_ACCOUNT_CONFIG.private_key
      .replace(/\\n/g, '\n')
      .trim();

    // Remove the header and footer
    const privateKeyBase64 = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');

    // Convert base64 to binary
    const binaryDer = atob(privateKeyBase64);
    const keyBuffer = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      keyBuffer[i] = binaryDer.charCodeAt(i);
    }

    // Import the key
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
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Create JWT for service account authentication using jose
      const now = Math.floor(Date.now() / 1000);
      
      console.log('Importing private key for JWT signing');
      const privateKey = await this.importPrivateKey();
      
      console.log('Creating JWT with imported private key');

      // Create and sign JWT using jose
      const jwt = await new SignJWT({
        iss: SERVICE_ACCOUNT_CONFIG.client_email,
        scope: "https://www.googleapis.com/auth/drive",
        aud: SERVICE_ACCOUNT_CONFIG.token_uri,
        exp: now + 3600, // 1 hour
        iat: now
      })
        .setProtectedHeader({ 
          alg: 'RS256',
          kid: SERVICE_ACCOUNT_CONFIG.private_key_id,
          typ: 'JWT'
        })
        .sign(privateKey);

      console.log('JWT created successfully');

      const response = await fetch(SERVICE_ACCOUNT_CONFIG.token_uri, {
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
        throw new Error('Failed to get access token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety

      console.log('Successfully obtained access token');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to authenticate with Google Drive');
    }
  }

  async createCustomerFolder(customerName: string, customerId: string): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();
      const folderName = `${customerName} - ${customerId}`;
      
      const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['root']
      };

      const response = await fetch(`${GOOGLE_DRIVE_API_URL}/files`, {
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
        throw new Error(`Failed to create folder: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Customer folder created:', result.id);
      return result.id;
    } catch (error) {
      console.error('Error creating customer folder:', error);
      throw new Error('Failed to create customer folder in Google Drive');
    }
  }

  async uploadFile(file: File, folderId: string, fileName?: string): Promise<DriveFile> {
    try {
      const accessToken = await this.getAccessToken();
      
      const metadata = {
        name: fileName || file.name,
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
      form.append('file', file);

      const response = await fetch(`${GOOGLE_UPLOAD_URL}/files?uploadType=multipart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: form
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('File upload failed:', errorText);
        throw new Error(`Upload failed: ${response.statusText}`);
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

  async listFiles(folderId: string): Promise<DriveFile[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `${GOOGLE_DRIVE_API_URL}/files?q='${folderId}' in parents&fields=files(id,name,mimeType,webViewLink)`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('List files failed:', errorText);
        throw new Error(`Failed to list files: ${response.statusText}`);
      }

      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${GOOGLE_DRIVE_API_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('File deletion failed:', errorText);
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      console.log('File deleted from Drive:', fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }
}

export const googleDriveService = new GoogleDriveService();
