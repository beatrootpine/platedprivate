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

  // Sync mode/role when modal opens with new defaults
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
        setError('Please fill in all fields')
        setLoading(false)
        return
      }
      const { error } = await signUp({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role
      })
      if (error) setError(error.message)
      else setSuccess('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      padding: 24
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#FFFFFF', border: '1px solid var(--border)',
        borderRadius: 16, padding: 36, width: '100%', maxWidth: 420,
        position: 'relative'
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'none',
          border: 'none', color: '#999', fontSize: 20, cursor: 'pointer'
        }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Logo size="sm" />
          <h2 style={{
            color: 'var(--text)', fontSize: 22, fontFamily: 'var(--font-display)',
            fontWeight: 600, marginTop: 16
          }}>
            {mode === 'login' ? 'Welcome Back' : 'Join Plated Private'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account to get started'}
          </p>
        </div>

        {/* Role selector (signup only) */}
        {mode === 'signup' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[
              { val: 'client', label: '🍽️ I want to book', desc: 'Client' },
              { val: 'chef', label: '👨‍🍳 I want to cook', desc: 'Chef' }
            ].map(r => (
              <button key={r.val} onClick={() => setRole(r.val)} style={{
                flex: 1, padding: '14px 12px', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                background: role === r.val ? 'rgba(186,151,77,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${role === r.val ? 'var(--gold)' : 'var(--border-input)'}`,
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: role === r.val ? 'var(--gold)' : '#888' }}>{r.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'signup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="First Name" placeholder="Thabo" value={form.firstName} onChange={e => upd('firstName', e.target.value)} />
              <Input label="Last Name" placeholder="Molefe" value={form.lastName} onChange={e => upd('lastName', e.target.value)} />
            </div>
          )}
          <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={e => upd('email', e.target.value)} />
          <Input label="Password" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => upd('password', e.target.value)} />
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)', fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--green-bg)', border: '1px solid var(--green-border)', color: 'var(--green)', fontSize: 13 }}>
            {success}
          </div>
        )}

        <GoldButton
          onClick={handleSubmit}
          disabled={loading || !form.email || !form.password}
          style={{ width: '100%', marginTop: 20, padding: '14px 28px' }}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </GoldButton>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer' }}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
