'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export const Login: React.FC = () => {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (show2FA) {
        // Verify 2FA
        const response = await fetch('/api/users/2fa/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies in request
          body: JSON.stringify({ email, code }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Invalid 2FA code')
        }

        // Use full page redirect to ensure auth state is updated
        window.location.href = redirect
      } else {
        // Initial login attempt
        const response = await fetch('/api/users/2fa/login-init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Include cookies in request/response
          body: JSON.stringify({ email, password }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Login failed')
        }
        
        if (data.twoFactorRequired) {
          setShow2FA(true)
          setLoading(false) // Reset loading for 2FA input
        } else {
          // Use full page redirect to ensure auth state is updated
          // Don't reset loading here - the page will navigate away
          window.location.href = redirect
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid var(--theme-border-color)',
    backgroundColor: 'var(--theme-bg-input)',
    color: 'var(--theme-text)',
    outline: 'none',
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '4px',
    border: 'none',
    backgroundColor: loading ? '#666' : '#0070f3',
    color: 'white',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    transition: 'all 0.2s ease',
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--theme-bg-html)',
      color: 'var(--theme-text)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        padding: '40px',
        backgroundColor: 'var(--theme-bg-card)',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '1px solid var(--theme-border-color)',
      }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
          {show2FA ? 'Two-Factor Authentication' : 'Login'}
        </h2>
        
        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            color: 'red',
            borderRadius: '4px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          {!show2FA ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Email</label>
                <input 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  style={inputStyle}
                />
              </div>
            </>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Authentication Code</label>
              <input 
                type="text"
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="000000"
                required
                style={inputStyle}
              />
              <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                Enter the 6-digit code from your authenticator app.
              </p>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? 'Loading...' : (show2FA ? 'Verify' : 'Login')}
          </button>
        </form>
      </div>
    </div>
  )
}
