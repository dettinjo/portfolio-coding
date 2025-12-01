import type { PayloadRequest } from 'payload'
import { cookies } from 'next/headers'
import { generateTOTPSecret, generateQRCode, generateBackupCodes, hashBackupCode, encryptSecret, verifyTOTP } from '../utils/2fa'

// Temporary storage for passwords during 2FA flow (in-memory, not persistent)
const pendingLogins = new Map<string, { password: string, timestamp: number }>()

// Clean up old pending logins every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  for (const [email, data] of pendingLogins.entries()) {
    if (data.timestamp < fiveMinutesAgo) {
      pendingLogins.delete(email)
    }
  }
}, 5 * 60 * 1000)

/**
 * POST /api/users/2fa/setup
 * Generate TOTP secret and QR code for 2FA enrollment
 */
export const setup2FAHandler = async (req: PayloadRequest): Promise<Response> => {
  const { payload, user } = req
  console.log('setup2FAHandler called', { user: user?.email })

  // Check if user is authenticated
  if (!user || !user.email) {
    console.log('setup2FAHandler: Unauthorized')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      console.log('setup2FAHandler: 2FA already enabled')
      return Response.json({ error: '2FA is already enabled for this account' }, { status: 400 })
    }

    // Generate TOTP secret
    console.log('setup2FAHandler: Generating secret')
    const secret = generateTOTPSecret()
    
    // Generate QR code
    console.log('setup2FAHandler: Generating QR code')
    const qrCode = await generateQRCode(user.email, secret)
    
    // Generate backup codes
    console.log('setup2FAHandler: Generating backup codes')
    const backupCodes = generateBackupCodes(10)
    
    // Hash backup codes for storage
    const hashedBackupCodes = backupCodes.map(code => ({
      code: hashBackupCode(code),
      used: false,
    }))

    // Store encrypted secret and hashed backup codes (but don't enable 2FA yet)
    // User must verify TOTP code first before 2FA is fully enabled
    console.log('setup2FAHandler: Updating user')
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        twoFactorSecret: encryptSecret(secret),
        twoFactorBackupCodes: hashedBackupCodes,
      },
    })

    console.log('setup2FAHandler: Success')
    // Return QR code and backup codes to user
    // The backup codes are shown only once during setup
    return Response.json({
      qrCode,
      secret, // For manual entry
      backupCodes, // Unhashed codes for user to save
    }, { status: 200 })
  } catch (error) {
    console.error('2FA setup error:', error)
    return Response.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }
}

/**
 * POST /api/users/2fa/enable
 * Verify TOTP code and enable 2FA
 */
export const enable2FAHandler = async (req: PayloadRequest): Promise<Response> => {
  const { payload, user } = req
  console.log('enable2FAHandler called', { user: user?.email })

  if (!user) {
    console.log('enable2FAHandler: Unauthorized')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Try to get data from req.data (Payload) or parse json (Web API)
  let data = req.data
  if (!data && req.json) {
    try {
      data = await req.json()
      console.log('enable2FAHandler: Parsed JSON body', data)
    } catch (e) {
      console.log('enable2FAHandler: Failed to parse JSON body', e)
    }
  } else {
    console.log('enable2FAHandler: Using req.data', data)
  }

  const { code } = data || {}
  console.log('enable2FAHandler: Verification code received', { code })

  if (!code) {
    console.log('enable2FAHandler: Code missing')
    return Response.json({ error: 'Verification code is required' }, { status: 400 })
  }

  try {
    // Get user's secret
    console.log('enable2FAHandler: Fetching user doc', { id: user.id })
    const userDoc = await payload.findByID({
      collection: 'users',
      id: user.id,
    })

    if (!userDoc.twoFactorSecret) {
      console.log('enable2FAHandler: Secret missing on user doc')
      return Response.json({ error: '2FA setup not initiated. Please call /api/users/2fa/setup first' }, { status: 400 })
    }

    // Verify the TOTP code
    const { decryptSecret } = await import('../utils/2fa')
    const secret = decryptSecret(userDoc.twoFactorSecret)
    console.log('enable2FAHandler: Verifying TOTP')
    const isValid = verifyTOTP(code, secret)
    console.log('enable2FAHandler: Verification result', { isValid })

    if (!isValid) {
      return Response.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Enable 2FA
    console.log('enable2FAHandler: Enabling 2FA')
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        twoFactorEnabled: true,
        twoFactorEnrolledAt: new Date().toISOString(),
      },
    })

    console.log('enable2FAHandler: Success')
    return Response.json({
      success: true,
      message: '2FA has been enabled successfully',
    }, { status: 200 })
  } catch (error) {
    console.error('2FA enable error:', error)
    return Response.json({ error: 'Failed to enable 2FA' }, { status: 500 })
  }
}

/**
 * POST /api/users/2fa/verify
 * Verify TOTP code during login
 */
export const verify2FAHandler = async (req: PayloadRequest): Promise<Response> => {
  const { payload } = req
  
  // Try to get data from req.data (Payload) or parse json (Web API)
  let data = req.data
  if (!data && req.json) {
    try {
      data = await req.json()
    } catch (e) {
      console.log('verify2FAHandler: Failed to parse JSON body', e)
    }
  }

  const { email, code } = data || {}
  console.log('verify2FAHandler called', { email })

  if (!email || !code) {
    console.log('verify2FAHandler: Missing email or code')
    return Response.json({ error: 'Email and code are required' }, { status: 400 })
  }

  try {
    // Find user by email
    console.log('verify2FAHandler: Finding user')
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
    })

    if (!users.docs || users.docs.length === 0) {
      console.log('verify2FAHandler: User not found')
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = users.docs[0]

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      console.log('verify2FAHandler: 2FA not enabled for user')
      return Response.json({ error: '2FA is not enabled for this account' }, { status: 400 })
    }

    // Decrypt secret and verify TOTP
    const { decryptSecret, verifyBackupCode } = await import('../utils/2fa')
    const secret = decryptSecret(user.twoFactorSecret)
    
    console.log('verify2FAHandler: Verifying code')
    let isValid = verifyTOTP(code, secret)
    let usedBackupCode = false

    // If TOTP fails, check if it's a backup code
    if (!isValid && user.twoFactorBackupCodes) {
      console.log('verify2FAHandler: Checking backup codes')
      for (const backupCode of user.twoFactorBackupCodes) {
        if (!backupCode.used && verifyBackupCode(code, backupCode.code)) {
          isValid = true
          usedBackupCode = true
          
          // Mark backup code as used
          const updatedBackupCodes = user.twoFactorBackupCodes.map((bc: { code: string; used: boolean }) =>
            bc.code === backupCode.code ? { ...bc, used: true } : bc
          )
          
          await payload.update({
            collection: 'users',
            id: user.id,
            data: {
              twoFactorBackupCodes: updatedBackupCodes,
            },
          })
          break
        }
      }
    }

    if (!isValid) {
      console.log('verify2FAHandler: Invalid code')
      return Response.json({ error: 'Invalid verification code' }, { status: 401 })
    }

    // Get stored password for this user
    const pendingLogin = pendingLogins.get(email)
    
    if (!pendingLogin) {
      console.log('verify2FAHandler: No pending login found')
      return Response.json({ error: 'Session expired. Please login again.' }, { status: 401 })
    }

    // Create proper Payload session using payload.login
    console.log('verify2FAHandler: Creating Payload session')
    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: email,
        password: pendingLogin.password,
      },
      req,
    })

    // Clean up stored password
    pendingLogins.delete(email)

    // Explicitly set the cookie using Next.js headers
    // This fixes the redirection loop issue where the cookie wasn't being persisted
    if (loginResult?.token) {
      const cookieStore = await cookies()
      
      cookieStore.set({
        name: 'payload-token',
        value: loginResult.token,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: loginResult.exp ? new Date(loginResult.exp * 1000) : undefined,
      })

      console.log('verify2FAHandler: Cookie set successfully via next/headers')
    }

    console.log('verify2FAHandler: Success, session created')
    
    return Response.json({
      success: true,
      user: { id: user.id, email: user.email },
      usedBackupCode,
    }, { status: 200 })

  } catch (error) {
    console.error('2FA verification error:', error)
    return Response.json({ error: 'Failed to verify 2FA code' }, { status: 500 })
  }
}

/**
 * POST /api/users/2fa/disable
 * Disable 2FA for the current user
 */
export const disable2FAHandler = async (req: PayloadRequest): Promise<Response> => {
  const { payload, user } = req
  console.log('disable2FAHandler called', { user: user?.email })

  if (!user || !user.email) {
    console.log('disable2FAHandler: Unauthorized')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Try to get data from req.data (Payload) or parse json (Web API)
  let data = req.data
  if (!data && req.json) {
    try {
      data = await req.json()
      console.log('disable2FAHandler: Parsed JSON body')
    } catch (e) {
      console.log('disable2FAHandler: Failed to parse JSON body', e)
    }
  }

  const { password } = data || {}

  if (!password) {
    console.log('disable2FAHandler: Password missing')
    return Response.json({ error: 'Password confirmation is required' }, { status: 400 })
  }

  try {
    // Verify password
    console.log('disable2FAHandler: Verifying password')
    const isValidPassword = await payload.login({
      collection: 'users',
      data: {
        email: user.email,
        password,
      },
    })

    if (!isValidPassword) {
      console.log('disable2FAHandler: Invalid password')
      return Response.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Disable 2FA and clear all related fields
    console.log('disable2FAHandler: Disabling 2FA')
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorEnrolledAt: null,
      },
    })

    console.log('disable2FAHandler: Success')
    return Response.json({
      success: true,
      message: '2FA has been disabled successfully',
    }, { status: 200 })
  } catch (error) {
    console.error('2FA disable error:', error)
    return Response.json({ error: 'Failed to disable 2FA' }, { status: 500 })
  }
}

/**
 * POST /api/users/2fa/login-init
 * Initialize login: verify credentials and check if 2FA is required
 */
export const loginInitHandler = async (req: PayloadRequest): Promise<Response> => {
  const { payload } = req
  
  // Try to get data from req.data (Payload) or parse json (Web API)
  let data = req.data
  if (!data && req.json) {
    try {
      data = await req.json()
    } catch (e) {
      console.log('loginInitHandler: Failed to parse JSON body', e)
    }
  }

  const { email, password } = data || {}

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 })
  }

  try {
    // Find user by email to check if 2FA is enabled (before attempting login)
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
      depth: 0,
    })

    if (!users.docs || users.docs.length === 0) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = users.docs[0]

    // Check if 2FA is enabled BEFORE logging in
    if (user.twoFactorEnabled) {
      // For 2FA users: verify password without creating a session cookie
      // We do this by calling login without passing the req (which has the response)
      try {
        await payload.login({
          collection: 'users',
          data: {
            email,
            password,
          },
          // Don't pass req here - this prevents session cookie from being set
        })
      } catch {
        // Password is invalid
        return Response.json({ error: 'Invalid credentials' }, { status: 401 })
      }
      
      // Password is valid, store it temporarily for 2FA verification step
      pendingLogins.set(email, {
        password,
        timestamp: Date.now(),
      })
      
      // Return 2FA required, session will be created after 2FA verification
      return Response.json({ 
        twoFactorRequired: true,
      }, { status: 200 })
    }

    // No 2FA required, verify password and create session with cookies
    try {
      await payload.login({
        collection: 'users',
        data: {
          email,
          password,
        },
        req, // Pass req to set session cookies
      })
    } catch {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // User is logged in successfully
    return Response.json({ 
      twoFactorRequired: false,
      success: true,
    }, { status: 200 })

  } catch (error) {
    console.error('Login init error:', error)
    return Response.json({ error: 'Login failed' }, { status: 500 })
  }
}

/**
 * POST /api/users/2fa/regenerate-backup-codes
 * Regenerate backup codes for the current user
 */
export const regenerateBackupCodesHandler = async (req: PayloadRequest): Promise<Response> => {
  const { payload, user } = req
  console.log('regenerateBackupCodesHandler called', { user: user?.email })

  if (!user || !user.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user.twoFactorEnabled) {
    return Response.json({ error: '2FA is not enabled' }, { status: 400 })
  }

  // Try to get data from req.data (Payload) or parse json (Web API)
  let data = req.data
  if (!data && req.json) {
    try {
      data = await req.json()
    } catch (e) {
      console.log('regenerateBackupCodesHandler: Failed to parse JSON body', e)
    }
  }

  const { password } = data || {}

  if (!password) {
    return Response.json({ error: 'Password confirmation is required' }, { status: 400 })
  }

  try {
    // Verify password
    const isValidPassword = await payload.login({
      collection: 'users',
      data: {
        email: user.email,
        password,
      },
    })

    if (!isValidPassword) {
      return Response.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(10)
    const hashedBackupCodes = backupCodes.map(code => ({
      code: hashBackupCode(code),
      used: false,
    }))

    // Update user with new backup codes
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        twoFactorBackupCodes: hashedBackupCodes,
      },
    })

    return Response.json({
      success: true,
      backupCodes,
    }, { status: 200 })
  } catch (error) {
    console.error('Backup codes regeneration error:', error)
    return Response.json({ error: 'Failed to regenerate backup codes' }, { status: 500 })
  }
}