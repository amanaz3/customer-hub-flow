import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Encryption helper functions using Web Crypto API
async function encrypt(text: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Convert to base64
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const encrypted = btoa(String.fromCharCode(...encryptedArray));
  const ivBase64 = btoa(String.fromCharCode(...iv));
  
  return { encrypted, iv: ivBase64 };
}

async function decrypt(encrypted: string, iv: string, key: CryptoKey): Promise<string> {
  // Decode from base64
  const encryptedArray = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivArray },
    key,
    encryptedArray
  );
  
  // Convert to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get('FTA_ENCRYPTION_KEY');
  if (!keyString) {
    throw new Error('FTA_ENCRYPTION_KEY not configured');
  }
  
  // Convert key string to proper format
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString.padEnd(32, '0').slice(0, 32)); // Ensure 32 bytes for AES-256
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, password, encrypted, iv } = await req.json();
    
    console.log('FTA Credentials operation:', action);
    
    const key = await getEncryptionKey();
    
    if (action === 'encrypt') {
      if (!password) {
        throw new Error('Password is required for encryption');
      }
      
      const result = await encrypt(password, key);
      console.log('Successfully encrypted FTA password');
      
      return new Response(
        JSON.stringify({ 
          encrypted: result.encrypted, 
          iv: result.iv 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    else if (action === 'decrypt') {
      if (!encrypted || !iv) {
        throw new Error('Encrypted data and IV are required for decryption');
      }
      
      const decrypted = await decrypt(encrypted, iv, key);
      console.log('Successfully decrypted FTA password');
      
      return new Response(
        JSON.stringify({ password: decrypted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    else {
      throw new Error('Invalid action. Use "encrypt" or "decrypt"');
    }
    
  } catch (error) {
    console.error('Error in encrypt-fta-credentials:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
