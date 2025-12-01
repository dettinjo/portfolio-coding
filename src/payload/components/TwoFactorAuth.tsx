'use client'

import React, { useState } from 'react'
import { useAuth } from '@payloadcms/ui'

export const TwoFactorAuth: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Setup state
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  
  // Disable state
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  
  // Regenerate backup codes state
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [regeneratePassword, setRegeneratePassword] = useState('')
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])

  const is2FAEnabled = user?.twoFactorEnabled || false

  const handleSetup2FA = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/users/2fa/setup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup 2FA')
      }

      setQrCode(data.qrCode)
      setSecret(data.secret)
      setBackupCodes(data.backupCodes)
      setSuccess('2FA setup initiated. Scan the QR code with your authenticator app.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/users/2fa/enable', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enable 2FA')
      }

      setSuccess('2FA has been enabled successfully! Please save your backup codes.')
      setVerificationCode('')
      
      // Reload page to update user state
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/users/2fa/disable', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: disablePassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA')
      }

      setSuccess('2FA has been disabled successfully!')
      setDisablePassword('')
      setShowDisableConfirm(false)
      
      // Reload page to update user state
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateBackupCodes = async () => {
    if (!regeneratePassword) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/users/2fa/regenerate-backup-codes', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: regeneratePassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate backup codes')
      }

      setNewBackupCodes(data.backupCodes)
      setSuccess('New backup codes generated successfully! Please save them.')
      setRegeneratePassword('')
      setShowRegenerateConfirm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
    setTimeout(() => setSuccess(null), 2000)
  }

  const downloadBackupCodes = (codes: string[]) => {
    const text = codes.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '2fa-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
        Two-Factor Authentication
      </h2>

      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          backgroundColor: '#efe', 
          border: '1px solid #cfc',
          borderRadius: '4px',
          color: '#060'
        }}>
          {success}
        </div>
      )}

      {!is2FAEnabled ? (
        <div>
          <p style={{ marginBottom: '20px' }}>
            Two-factor authentication adds an extra layer of security to your account.
            You&apos;ll need to enter a code from your authenticator app when logging in.
          </p>

          {!qrCode ? (
            <button
              onClick={handleSetup2FA}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
              }}
            >
              {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
            </button>
          ) : (
            <div>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                Step 1: Scan QR Code
              </h3>
              <p style={{ marginBottom: '12px' }}>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
              </p>
              
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '300px' }} />
              </div>

              <p style={{ marginBottom: '8px' }}>Or enter this key manually:</p>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <code>{secret}</code>
                <button
                  onClick={() => copyToClipboard(secret || '')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Copy
                </button>
              </div>

              <h3 style={{ marginTop: '32px', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                Step 2: Save Backup Codes
              </h3>
              <p style={{ marginBottom: '12px' }}>
                Save these backup codes in a secure place. You can use them to access your account if you lose your phone:
              </p>
              
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                marginBottom: '12px'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '8px',
                  fontFamily: 'monospace'
                }}>
                  {backupCodes.map((code, index) => (
                    <div key={index}>{code}</div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => downloadBackupCodes(backupCodes)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '32px',
                }}
              >
                Download Backup Codes
              </button>

              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                Step 3: Verify Setup
              </h3>
              <p style={{ marginBottom: '12px' }}>
                You&apos;ll need to enter a code from your authenticator app when logging in.
              </p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  style={{
                    padding: '10px',
                    fontSize: '18px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    width: '150px',
                    fontFamily: 'monospace',
                    letterSpacing: '4px',
                  }}
                />
                <button
                  onClick={handleEnable2FA}
                  disabled={loading || verificationCode.length !== 6}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: verificationCode.length === 6 ? '#0070f3' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: verificationCode.length === 6 && !loading ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                  }}
                >
                  {loading ? 'Verifying...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#efe', 
            border: '1px solid #cfc',
            borderRadius: '4px',
            marginBottom: '32px'
          }}>
            <p style={{ fontWeight: '600', color: '#060' }}>
              ✓ Two-factor authentication is enabled
            </p>
            <p style={{ fontSize: '14px', marginTop: '4px', color: '#060' }}>
              Your account is protected with 2FA
            </p>
          </div>

          {/* Regenerate Backup Codes Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
              Backup Codes
            </h3>
            
            {!showRegenerateConfirm ? (
              <button
                onClick={() => setShowRegenerateConfirm(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Regenerate Backup Codes
              </button>
            ) : (
              <div>
                <p style={{ marginBottom: '12px' }}>
                  Enter your password to regenerate backup codes. This will invalidate your old codes.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="password"
                    value={regeneratePassword}
                    onChange={(e) => setRegeneratePassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      flex: 1,
                    }}
                  />
                  <button
                    onClick={handleRegenerateBackupCodes}
                    disabled={loading || !regeneratePassword}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: regeneratePassword ? '#0070f3' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: regeneratePassword && !loading ? 'pointer' : 'not-allowed',
                      fontSize: '16px',
                    }}
                  >
                    {loading ? 'Regenerating...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRegenerateConfirm(false)
                      setRegeneratePassword('')
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ccc',
                      color: '#333',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {newBackupCodes.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  New Backup Codes
                </h4>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '4px',
                  marginBottom: '12px'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '8px',
                    fontFamily: 'monospace'
                  }}>
                    {newBackupCodes.map((code, index) => (
                      <div key={index}>{code}</div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => downloadBackupCodes(newBackupCodes)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Download Backup Codes
                </button>
              </div>
            )}
          </div>

          {/* Disable 2FA Section */}
          <div>
            <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
              Disable Two-Factor Authentication
            </h3>
            
            {!showDisableConfirm ? (
              <button
                onClick={() => setShowDisableConfirm(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Disable 2FA
              </button>
            ) : (
              <div>
                <p style={{ marginBottom: '12px', color: '#c00' }}>
                  <strong>Warning:</strong> Disabling 2FA will make your account less secure.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  Enter your password to confirm:
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      flex: 1,
                    }}
                  />
                  <button
                    onClick={handleDisable2FA}
                    disabled={loading || !disablePassword}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: disablePassword ? '#dc3545' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: disablePassword && !loading ? 'pointer' : 'not-allowed',
                      fontSize: '16px',
                    }}
                  >
                    {loading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDisableConfirm(false)
                      setDisablePassword('')
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ccc',
                      color: '#333',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
