
interface GoogleDriveConfig {
  client_id: string;
  client_secret: string;
  auth_uri: string;
  token_uri: string;
}

const DRIVE_CONFIG: GoogleDriveConfig = {
  client_id: "123620047131-fs36ffg156bq2fsa183vrnd8hcd478kb.apps.googleusercontent.com",
  client_secret: "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",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token"
};

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
];

class GoogleDriveService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private mainFolderId: string | null = null;

  async initializeAuth(): Promise<void> {
    const storedToken = localStorage.getItem('google_drive_token');
    const storedExpiry = localStorage.getItem('google_drive_token_expiry');
    
    if (storedToken && storedExpiry) {
      const expiry = parseInt(storedExpiry);
      if (Date.now() < expiry) {
        this.accessToken = storedToken;
        this.tokenExpiry = expiry;
        console.log('Using stored Google Drive token');
        return;
      } else {
        console.log('Stored token expired, requesting new auth');
        localStorage.removeItem('google_drive_token');
        localStorage.removeItem('google_drive_token_expiry');
      }
    }
    
    await this.requestAuth();
  }

  private async requestAuth(): Promise<void> {
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    const authUrl = new URL(DRIVE_CONFIG.auth_uri);
    authUrl.searchParams.set('client_id', DRIVE_CONFIG.client_id);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', SCOPES.join(' '));
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    console.log('Opening Google auth window with URL:', authUrl.toString());
    
    const authWindow = window.open(
      authUrl.toString(),
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          reject(new Error('Authentication cancelled by user'));
        }
      }, 1000);

      const messageHandler = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          authWindow?.close();
          window.removeEventListener('message', messageHandler);
          
          try {
            console.log('Received auth code, exchanging for token...');
            await this.exchangeCodeForToken(event.data.code);
            resolve();
          } catch (error) {
            console.error('Token exchange failed:', error);
            reject(error);
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          authWindow?.close();
          window.removeEventListener('message', messageHandler);
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  private async exchangeCodeForToken(code: string): Promise<void> {
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    try {
      const response = await fetch(DRIVE_CONFIG.token_uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: DRIVE_CONFIG.client_id,
          client_secret: DRIVE_CONFIG.client_secret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Token exchange response:', data);
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        
        localStorage.setItem('google_drive_token', this.accessToken);
        localStorage.setItem('google_drive_token_expiry', this.tokenExpiry.toString());
        
        console.log('Google Drive token stored successfully');
      } else {
        throw new Error('No access token received from Google');
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  private async ensureMainFolder(): Promise<string> {
    if (this.mainFolderId) {
      return this.mainFolderId;
    }

    if (!this.accessToken) {
      await this.initializeAuth();
    }

    try {
      // Search for existing main folder
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='Amana Finance Documents' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!searchResponse.ok) {
        throw new Error(`Failed to search for main folder: ${searchResponse.statusText}`);
      }

      const searchResult = await searchResponse.json();
      
      if (searchResult.files && searchResult.files.length > 0) {
        this.mainFolderId = searchResult.files[0].id;
        console.log('Found existing main folder:', this.mainFolderId);
      } else {
        // Create main folder
        this.mainFolderId = await this.createFolder('Amana Finance Documents');
        console.log('Created new main folder:', this.mainFolderId);
      }

      return this.mainFolderId;
    } catch (error) {
      console.error('Error ensuring main folder:', error);
      throw error;
    }
  }

  async uploadFile(file: File, fileName: string, parentFolderId?: string): Promise<string> {
    if (!this.accessToken) {
      await this.initializeAuth();
    }

    const metadata = {
      name: fileName,
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: form,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('File uploaded successfully:', result.id);
      return result.id;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  async createFolder(name: string, parentFolderId?: string): Promise<string> {
    if (!this.accessToken) {
      await this.initializeAuth();
    }

    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Folder creation failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Folder created successfully:', result.id);
      return result.id;
    } catch (error) {
      console.error('Folder creation error:', error);
      throw error;
    }
  }

  async getOrCreateCustomerFolder(customerId: string): Promise<string> {
    try {
      const mainFolderId = await this.ensureMainFolder();
      const customerFolderName = `Customer_${customerId}`;

      // Search for existing customer folder
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${customerFolderName}' and '${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!searchResponse.ok) {
        throw new Error(`Failed to search for customer folder: ${searchResponse.statusText}`);
      }

      const searchResult = await searchResponse.json();
      
      if (searchResult.files && searchResult.files.length > 0) {
        console.log('Found existing customer folder:', searchResult.files[0].id);
        return searchResult.files[0].id;
      }

      // Create customer folder
      const folderId = await this.createFolder(customerFolderName, mainFolderId);
      console.log('Created new customer folder:', folderId);
      return folderId;
    } catch (error) {
      console.error('Error getting/creating customer folder:', error);
      throw error;
    }
  }

  async getFileLink(fileId: string): Promise<string> {
    if (!this.accessToken) {
      await this.initializeAuth();
    }

    try {
      // Make file publicly viewable
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });

      return `https://drive.google.com/file/d/${fileId}/view`;
    } catch (error) {
      console.error('Error setting file permissions:', error);
      // Return view link even if permission setting fails
      return `https://drive.google.com/file/d/${fileId}/view`;
    }
  }

  async listCustomerFiles(customerId: string): Promise<any[]> {
    try {
      const customerFolderId = await this.getOrCreateCustomerFolder(customerId);
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${customerFolderId}' in parents and trashed=false&fields=files(id,name,mimeType,createdTime,size,webViewLink)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Customer files retrieved:', result.files?.length || 0);
      return result.files || [];
    } catch (error) {
      console.error('Error listing customer files:', error);
      throw error;
    }
  }

  async getAllCustomerFolders(): Promise<any[]> {
    try {
      const mainFolderId = await this.ensureMainFolder();
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,createdTime)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list customer folders: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Customer folders retrieved:', result.files?.length || 0);
      return result.files || [];
    } catch (error) {
      console.error('Error listing customer folders:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<Blob> {
    if (!this.accessToken) {
      await this.initializeAuth();
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.accessToken) {
      await this.initializeAuth();
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      console.log('File deleted successfully:', fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    const isAuth = !!this.accessToken && !!this.tokenExpiry && Date.now() < this.tokenExpiry;
    console.log('Drive authentication status:', isAuth);
    return isAuth;
  }

  clearAuth(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.mainFolderId = null;
    localStorage.removeItem('google_drive_token');
    localStorage.removeItem('google_drive_token_expiry');
    console.log('Google Drive authentication cleared');
  }
}

export const googleDriveService = new GoogleDriveService();
