
import React, { useEffect } from 'react';

const AuthCallback: React.FC = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error }, window.location.origin);
    } else if (code) {
      window.opener?.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', code }, window.location.origin);
    }

    // Close the popup
    window.close();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
        <p className="text-gray-600">Please wait while we complete the authentication process.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
