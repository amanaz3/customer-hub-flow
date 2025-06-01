
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
        return;
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
    
    const authWindow = window.open(
      authUrl.toString(),
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);

      window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          authWindow?.close();
          
          try {
            await this.exchangeCodeForToken(event.data.code);
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  private async exchangeCodeForToken(code: string): Promise<void> {
    const redirectUri = `${window.location.origin}/auth/callback`;
    
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

    const data = await response.json();
    
    if (data.access_token) {
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      localStorage.setItem('google_drive_token', this.accessToken);
      localStorage.setItem('google_drive_token_expiry', this.tokenExpiry.toString());
    } else {
      throw new Error('Failed to obtain access token');
    }
  }

  private async ensureMainFolder(): Promise<string> {
    if (this.mainFolderId) {
      return this.mainFolderId;
    }

    if (!this.accessToken) {
      await this.initializeAuth();
    }

    // Search for existing main folder
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='Amana Finance Documents' and mimeType='application/vnd.google-apps.folder'`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    const searchResult = await searchResponse.json();
    
    if (searchResult.files && searchResult.files.length > 0) {
      this.mainFolderId = searchResult.files[0].id;
    } else {
      // Create main folder
      this.mainFolderId = await this.createFolder('Amana Finance Documents');
    }

    return this.mainFolderId;
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

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;
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

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`Folder creation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  }

  async getOrCreateCustomerFolder(customerId: string): Promise<string> {
    const mainFolderId = await this.ensureMainFolder();
    const customerFolderName = `Customer_${customerId}`;

    // Search for existing customer folder
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${customerFolderName}' and '${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    const searchResult = await searchResponse.json();
    
    if (searchResult.files && searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }

    // Create customer folder
    return await this.createFolder(customerFolderName, mainFolderId);
  }

  async getFileLink(fileId: string): Promise<string> {
    if (!this.accessToken) {
      await this.initializeAuth();
    }

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
  }

  async listCustomerFiles(customerId: string): Promise<any[]> {
    const customerFolderId = await this.getOrCreateCustomerFolder(customerId);
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${customerFolderId}' in parents&fields=files(id,name,mimeType,createdTime,size,webViewLink)`,
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
    return result.files || [];
  }

  async getAllCustomerFolders(): Promise<any[]> {
    const mainFolderId = await this.ensureMainFolder();
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder'&fields=files(id,name,createdTime)`,
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
    return result.files || [];
  }

  async downloadFile(fileId: string): Promise<Blob> {
    if (!this.accessToken) {
      await this.initializeAuth();
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.accessToken) {
      await this.initializeAuth();
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.tokenExpiry && Date.now() < this.tokenExpiry;
  }
}

export const googleDriveService = new GoogleDriveService();
