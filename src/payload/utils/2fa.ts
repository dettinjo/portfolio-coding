import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret()
}

/**
 * Generate a QR code data URL for TOTP setup
 */
export async function generateQRCode(email: string, secret: string): Promise<string> {
  const appName = 'Portfolio Admin'
  const otpauth = authenticator.keyuri(email, appName, secret)
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauth)
    return qrCodeDataURL
  } catch {
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch {
    return false
  }
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    // Generate random 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  
  return codes
}

/**
 * Hash a backup code for secure storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/**
 * Verify a backup code against a hashed code
 */
export function verifyBackupCode(code: string, hashedCode: string): boolean {
  const hashedInput = hashBackupCode(code)
  return hashedInput === hashedCode
}

/**
 * Encrypt the TOTP secret before storing in database
 */
export function encryptSecret(secret: string): string {
  // For production, use proper encryption with a key from environment variables
  // For now, we'll use base64 encoding (NOT SECURE FOR PRODUCTION)
  // TODO: Implement proper encryption with crypto.createCipheriv
  return Buffer.from(secret).toString('base64')
}

/**
 * Decrypt the TOTP secret from database
 */
export function decryptSecret(encryptedSecret: string): string {
  // For production, use proper decryption
  // For now, we'll use base64 decoding
  // TODO: Implement proper decryption with crypto.createDecipheriv
  return Buffer.from(encryptedSecret, 'base64').toString('utf-8')
}
