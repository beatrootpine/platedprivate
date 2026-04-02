import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { GoldButton, Input, Logo } from './UI'

export default function AuthModal({ isOpen, onClose, defaultMode = 'login', defaultRole = 'client' }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState(defaultMode)
  const [role, setRole] = useState(defaultRole)
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode)
      setRole(defaultRole)
      setError('')
      setSuccess('')
    }
  }, [isOpen, defaultMode, defaultRole])

  const upd = (f, v) => setForm(p => ({ ...p, [f]: v }))

  if (!isOpen) return null

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn({ email: form.email, password: form.password })
      if (error) setError(error.message)
      else onClose()
    } else {
      if (!form.firstName || !form.lastName) {
        setError('Please fill in your name')
        setLoading(false)
        return
      }
      const { data, error } = await signUp({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role
      })
      if (error) {
        setError(error.message)
      } else if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists')
      } else if (data?.session) {
        // Auto-confirmed — close modal
        onClose()
      } else {
        setSuccess('Account created! Check your email to confirm, then sign in.')
      }
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && form.email && form.password) handleSubmit()
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setError('')
    setSuccess('')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(42,42,38,0.5)', backdropFilter: 'blur(12px)',
      padding: 20
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown} style={{
        background: '#FFFFFF', borderRadius: 20, width: '100%', maxWidth: 400,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        {/* Gold accent bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--gold), var(--gold-light))' }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 18, right: 18, background: 'var(--bg-warm)',
            border: 'none', color: 'var(--text-muted)', width: 32, height: 32,
            borderRadius: '50%', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              color: 'var(--text)', fontSize: 24, fontWeight: 700, marginBottom: 4
            }}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {mode === 'login'
                ? 'Welcome back to Plated Private'
                : 'Join South Africa\'s private chef marketplace'}
            </p>
          </div>

          {/* Role toggle (signup only) */}
          {mode === 'signup' && (
            <div style={{
              display: 'flex', background: 'var(--bg-warm)', borderRadius: 10,
              padding: 4, marginBottom: 24
            }}>
              {[
                { val: 'client', label: 'I\'m booking a chef' },
                { val: 'chef', label: 'I\'m a chef' }
              ].map(r => (
                <button key={r.val} onClick={() => setRole(r.val)} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', border: 'none',
                  background: role === r.val ? '#FFFFFF' : 'transparent',
                  color: role === r.val ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: role === r.val ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                }}>
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input label="First name" placeholder="Thabo" value={form.firstName} onChange={e => upd('firstName', e.target.value)} />
                <Input label="Last name" placeholder="Molefe" value={form.lastName} onChange={e => upd('lastName', e.target.value)} />
              </div>
            )}
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={e => upd('email', e.target.value)} />
            <Input label="Password" type="password" placeholder={mode === 'login' ? 'Your password' : 'Min 6 characters'} value={form.password} onChange={e => upd('password', e.target.value)} />
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 10,
              background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, lineHeight: 1.5
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 10,
              background: 'var(--green-bg)', color: 'var(--green)', fontSize: 13, lineHeight: 1.5
            }}>{success}</div>
          )}

          {/* Submit */}
          <GoldButton
            onClick={handleSubmit}
            disabled={loading || !form.email || !form.password}
            style={{ width: '100%', marginTop: 20, padding: '14px 28px', borderRadius: 10 }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </GoldButton>

          {/* Divider + Toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginTop: 22
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <button onClick={switchMode} style={{
              background: 'none', border: 'none', color: 'var(--gold)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              {mode === 'login' ? 'Create an account' : 'Sign in instead'}
            </button>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
