
import React, { useEffect } from 'react';

const AuthCallback: React.FC = () => {
  useEffect(() => {
    const handleCallback = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('Auth callback received:', { code: !!code, error, errorDescription });

        if (error) {
          console.error('OAuth error:', error, errorDescription);
          window.opener?.postMessage({ 
            type: 'GOOGLE_AUTH_ERROR', 
            error: errorDescription || error 
          }, window.location.origin);
        } else if (code) {
          console.log('OAuth success, sending code to parent window');
          window.opener?.postMessage({ 
            type: 'GOOGLE_AUTH_SUCCESS', 
            code: code 
          }, window.location.origin);
        } else {
          console.error('No code or error received in callback');
          window.opener?.postMessage({ 
            type: 'GOOGLE_AUTH_ERROR', 
            error: 'No authorization code received' 
          }, window.location.origin);
        }
      } catch (error) {
        console.error('Error processing auth callback:', error);
        window.opener?.postMessage({ 
          type: 'GOOGLE_AUTH_ERROR', 
          error: 'Failed to process authentication callback' 
        }, window.location.origin);
      }

      // Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1000);
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Completing Authentication</h2>
        <p className="text-gray-600 mb-4">
          Please wait while we complete the Google Drive authentication process.
        </p>
        <p className="text-sm text-gray-500">
          This window will close automatically in a moment.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
