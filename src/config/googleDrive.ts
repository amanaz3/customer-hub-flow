
// Google Drive configuration
export const GOOGLE_DRIVE_CONFIG = {
  apiUrl: 'https://www.googleapis.com/drive/v3',
  uploadUrl: 'https://www.googleapis.com/upload/drive/v3',
  bankingEmail: 'banking@amanafinanz.com',
  scopes: ['https://www.googleapis.com/auth/drive'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFileTypes: {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.txt': 'text/plain'
  }
};

// Service account configuration should be in environment variables
export const getServiceAccountConfig = () => {
  // In production, these should come from environment variables
  const config = {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID || "inbound-pattern-461813-p5",
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || "e4557508a92e7dfea6336302d941fd0329260d0d",
    private_key: process.env.GOOGLE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCrUaWzpKh/RMdz\nesazodFfPowMFvMnca8oc400izaOmhekUXvWZg9fVMpXtRbUHp0/bOSloBAMJZrr\nh/Rfp2ljhQ4ycOkq3lo/jsxVUV90SXlelzV7cH7B+l0bdyLiTq1HjCaZOo4HW49b\nCBaf/Bc1FbvcKbyghF7yP4dCPdNkSBb1H6vufI4vZxBpHk9qV/dtX5OCOLRaxUUb\nrQyjiqBEVFHmWAvQFKuidEYjmH3BSymLr+Ui4S6M9K0hYhRgQRXlVUPnnOZCUKqc\nwND4K6sCc3DX4xf38AgLE12iqle9pc4cFid9XwPgXQLRb87tqV9dcgE31BxGJHwg\nxPLLko/9AgMBAAECggEAAfeTh/8FgkSXZ6+KtYhPn6DXudHPo+3NvZCqF+bbTwLc\n76GR4vHUDluqYRxusSvS0WYeL/qpBIKwBzFN8IU7FA30jka2nqvj7GPm27nt9yda\n0ee5kPvHMNH/nK+fAms12SL2VH8UH2iBOmHa5KZf29euiwYdqNgsQOrS0kNkeHvI\nlRTc4XDgAF7R3BlIqzjQqyqW6gWIM8gIcpcl0Srf73BliWmhZC/rmW9A+TgVxd7Z\nTu8YF8AX2N4P1qhTmKj7c8kC0dlxYVfQifADedoR9Q/jUs1LvkAxT+o90vLopUoW\nQthJWX/Y7EnPC2WoNZYYuqeNu89/yML9wBjTc3BvXwKBgQDpwLlR8Qj4eO3ILxpX\nr5cigQXuWEPjSL+fNGetrkUTWphWFFDlTYyJEbqTa8rkHjMZw+6j5a2PCCkhla3F\n2H5+I2rRbUJ5EFnBF4cx0wAQMUeleKAxsWlY9zpmNwMiEiBWzVUoYutdQ1Wsxk7k\nysFBxATxy5cNvsrQdjbB5iKgEwKBgQC7n8BY3bnbB6wQSqLrevipYk/AgxtaZ4CN\nXffWQsWZu91U2PH0ZHz7Js2hjBFNcpL7nMC8RidXwAVPFfBviMEGD6nxlwK/QYwh\nOjF8fZtBTLdQqmegLbahbtUkmi5oH0ez4uT90LtKCHPqo/rGrD4/tDSgDcEFmEQ7\n4Xi9/R6xrwKBgGdbUhYLT/4d6nXjbfBrsZYOGsNCv/HVjvUkRNuk/OIL4uPc49Ag\nNA2/ixH4TaQEPnAcFH7f5Zgi8ZzqBAZBLd00Z9zmRMgnFKiucJb1R0fhol5mMd8H\nJR+zYV0k4fvErAv1irvq0UtRpKZaoTPE+yLLO6x2avom7KK0Qo4F5jWFAoGACbPI\nIZBNtRrfdfQ2GpFAXJn938mn13P0vNq4HzdSupFxb5rMYEP2BpLKHWl915BuM162\nxMWn8Sy32ZAb39iliqeytRCHDtbX5Tv6JSLlrWnHLP+y3iCfChgOI5dpgO7lKVM5\nXjq2BK0NOXwDUtTDX031TrWHXr+x/5q4QLLfLHcCgYA1jqQP1H9LZSymYSiTodY3\nhuNWhlyPdWncMxI1WnYT0R0LfSScrYW8PySfXdzeq3PVdU40sEUE3aD1sVOYGldk\nGiCcLJVs35N7sDeHWI/7FXiJoNuHZSOJyW5u+0i51HD1M08Meb8KaxY7r24+Of50\nOZiWh/G4y0GwK+OuOdJAig==\n-----END PRIVATE KEY-----\n",
    client_email: process.env.GOOGLE_CLIENT_EMAIL || "amana-912@inbound-pattern-461813-p5.iam.gserviceaccount.com",
    client_id: process.env.GOOGLE_CLIENT_ID || "103117814412564644548",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/amana-912%40inbound-pattern-461813-p5.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  };

  // Validate required configuration
  if (!config.project_id || !config.private_key || !config.client_email) {
    throw new Error('Missing required Google Drive service account configuration');
  }

  return config;
};
