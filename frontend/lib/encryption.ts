import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    // Fallback for dev/build without env var, but warn
    // console.warn('ENCRYPTION_KEY not set, using unsafe default');
    // return crypto.createHash('sha256').update('unsafe-default-key').digest();
    throw new Error('ENCRYPTION_KEY is not defined');
  }
  // Ensure 32 bytes using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(text: string): string {
  if (!text) return '';
  try {
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key as any, iv as any);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('base64')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }
    
    const [ivB64, authTagB64, encryptedB64] = parts;
    const key = getKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key as any, iv as any);
    decipher.setAuthTag(authTag as any);
    
    let decrypted = decipher.update(encryptedB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return ''; // Return empty string on failure to avoid crashing
  }
}
