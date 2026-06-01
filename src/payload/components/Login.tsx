'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'

type View = 'login' | '2fa' | 'forgot' | 'forgot-sent'

export const Login: React.FC = () => {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'

  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (view === '2fa') {
        const response = await fetch('/api/users/2fa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, code }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Invalid 2FA code')
        window.location.href = redirect
      } else {
        const response = await fetch('/api/users/2fa/login-init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Login failed')
        if (data.twoFactorRequired) {
          setView('2fa')
          setLoading(false)
        } else {
          window.location.href = redirect
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to send reset email')
      }
      setView('forgot-sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
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

  const linkStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#0070f3',
    cursor: 'pointer',
    fontSize: '13px',
    padding: 0,
    textDecoration: 'underline',
  }

  const title =
    view === '2fa' ? 'Two-Factor Authentication'
    : view === 'forgot' ? 'Reset Password'
    : view === 'forgot-sent' ? 'Check your email'
    : 'Login'

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
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>{title}</h2>

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

        {/* ── Login form ── */}
        {(view === 'login' || view === '2fa') && (
          <form onSubmit={handleLogin}>
            {view === 'login' ? (
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
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                  <button
                    type="button"
                    style={linkStyle}
                    onClick={() => { setError(null); setForgotEmail(email); setView('forgot') }}
                  >
                    Forgot password?
                  </button>
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

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Loading…' : (view === '2fa' ? 'Verify' : 'Login')}
            </button>

            {view === '2fa' && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button type="button" style={linkStyle} onClick={() => { setError(null); setView('login') }}>
                  ← Back to login
                </button>
              </div>
            )}
          </form>
        )}

        {/* ── Forgot password form ── */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <p style={{ fontSize: '14px', marginBottom: '20px', color: '#666' }}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                autoFocus
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button type="button" style={linkStyle} onClick={() => { setError(null); setView('login') }}>
                ← Back to login
              </button>
            </div>
          </form>
        )}

        {/* ── Confirmation screen ── */}
        {view === 'forgot-sent' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              If an account exists for <strong>{forgotEmail}</strong>, a password reset link has been sent.<br />
              Check your inbox (and spam folder).
            </p>
            <button
              type="button"
              style={{ ...buttonStyle, backgroundColor: '#0070f3' }}
              onClick={() => { setError(null); setView('login') }}
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
