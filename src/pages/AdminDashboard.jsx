import { useState, useEffect } from 'react'
import { Badge, ChefAvatar, GoldButton, Input, Logo } from '../components/UI'
import { MOCK_CHEFS, MOCK_BOOKINGS, PLATFORM_FEE } from '../data/constants'
import { useAuth } from '../context/AuthContext'
import { getAdminBookings, getAdminRevenue, getAdminChefs, suspendChef, reactivateChef, removeChef as removeChefApi, claimAdmin } from '../lib/api'
import { normalizeAdminChef } from '../lib/helpers'
import { supabase } from '../lib/supabase'

export default function AdminDashboard() {
  const { user, isAdmin, refreshProfile } = useAuth()
  const [tab, setTab] = useState('deals')
  const [chefs, setChefs] = useState([])
  const [bookings, setBookings] = useState([])
  const [revenue, setRevenue] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Try Supabase admin views
      const [bookRes, revRes, chefRes] = await Promise.all([
        getAdminBookings(),
        getAdminRevenue(),
        getAdminChefs()
      ])

      if (!bookRes.error && bookRes.data?.length > 0) {
        setBookings(bookRes.data)
      } else {
        setBookings(MOCK_BOOKINGS)
      }

      if (!revRes.error && revRes.data) {
        setRevenue(revRes.data)
      }

      if (!chefRes.error && chefRes.data?.length > 0) {
        setChefs(chefRes.data.map(normalizeAdminChef))
      } else {
        setChefs(MOCK_CHEFS.map(c => ({ ...c })))
      }
    } catch (e) {
      // Fallback to mock
      setBookings(MOCK_BOOKINGS)
      setChefs(MOCK_CHEFS.map(c => ({ ...c })))
    }
    setLoading(false)
  }

  // Compute stats from bookings (works for both real and mock data)
  const totalRevenue = revenue?.total_revenue || bookings.reduce((a, b) => a + (b.total || b.subtotal || 0), 0)
  const totalCommission = revenue?.total_commission || bookings.reduce((a, b) => a + (b.commission || b.platform_fee || 0), 0)
  const completedCount = revenue?.completed_bookings || bookings.filter(b => b.status === 'completed').length
  const pendingCount = revenue?.pending_bookings || bookings.filter(b => b.status === 'pending').length

  const toggleChef = async (id) => {
    const chef = chefs.find(c => c.id === id)
    if (!chef) return
    try {
      if (chef.available) {
        await suspendChef(id, 'Suspended by admin')
      } else {
        await reactivateChef(id)
      }
    } catch (e) { /* fallback */ }
    setChefs(prev => prev.map(c => c.id === id ? { ...c, available: !c.available, status: c.available ? 'suspended' : 'active' } : c))
  }

  const removeChef = async (id) => {
    if (!confirm('Are you sure you want to remove this chef from the platform? This cannot be undone.')) return
    try {
      await removeChefApi(id)
    } catch (e) { /* fallback */ }
    setChefs(prev => prev.filter(c => c.id !== id))
  }

  const statusColor = (s) => s === 'completed' ? 'green' : s === 'confirmed' ? 'blue' : 'gold'

  // ─── Admin Setup Gate ──────────────────────────────────
  const [setupKey, setSetupKey] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupError, setSetupError] = useState('')

  const handleAdminClaim = async () => {
    setSetupLoading(true)
    setSetupError('')
    const { success, error } = await claimAdmin(setupKey)
    if (success) {
      if (refreshProfile) await refreshProfile()
      window.location.reload()
    } else {
      setSetupError(error || 'Invalid key. Please try again.')
    }
    setSetupLoading(false)
  }

  // Show setup screen if not admin
  if (!isAdmin) {
    return (
      <div className="container-sm page-top" style={{ textAlign: 'center', paddingTop: 160 }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 48, maxWidth: 440, margin: '0 auto'
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
          <h1 style={{
            color: 'var(--text)', fontSize: 24,
            fontFamily: 'var(--font-display)', fontWeight: 400, marginBottom: 8
          }}>Admin Access</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            {user
              ? 'Enter the admin setup key to access the dashboard.'
              : 'Please sign in first, then enter your admin setup key.'}
          </p>
          {user ? (
            <>
              <Input
                label="Setup Key"
                type="password"
                placeholder="Enter admin setup key"
                value={setupKey}
                onChange={e => setSetupKey(e.target.value)}
              />
              {setupError && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)', fontSize: 13 }}>
                  {setupError}
                </div>
              )}
              <GoldButton
                onClick={handleAdminClaim}
                disabled={!setupKey || setupLoading}
                style={{ width: '100%', marginTop: 20, padding: '14px 28px' }}
              >
                {setupLoading ? 'Verifying...' : 'Unlock Dashboard'}
              </GoldButton>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Use the Sign In button in the navigation bar to continue.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container page-top">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{
            color: 'var(--text)', fontSize: 'clamp(24px, 3vw, 30px)',
            fontFamily: 'var(--font-display)', fontWeight: 300
          }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Platform overview and management</p>
        </div>
        <Badge variant="gold">ADMIN ACCESS</Badge>
      </div>

      {/* ─── Stats Cards ──────────────────────────────────── */}
      <div className="grid-stats" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, marginBottom: 36
      }}>
        {[
          { label: 'Total Bookings Revenue', val: `R${totalRevenue.toLocaleString()}`, color: 'var(--text)', icon: '💳' },
          { label: 'Platform Commission (15%)', val: `R${totalCommission.toLocaleString()}`, color: 'var(--gold)', icon: '✨' },
          { label: 'Active Chefs', val: `${chefs.filter(c => c.available).length} / ${chefs.length}`, color: 'var(--green)', icon: '👨‍🍳' },
          { label: 'Pending Bookings', val: pendingCount, color: 'var(--blue)', icon: '⏳' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 24,
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                color: 'var(--text-muted)', fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, lineHeight: 1.4
              }}>{s.label}</div>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ─── Tab Navigation ───────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        borderBottom: '1px solid var(--border-light)', paddingBottom: 2
      }}>
        {[
          { key: 'deals', label: '📋 All Deals', count: bookings.length },
          { key: 'chefs', label: '👨‍🍳 Manage Chefs', count: chefs.length }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab === t.key ? 'var(--gold)' : 'transparent'}`,
            color: tab === t.key ? 'var(--gold)' : '#888',
            padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            {t.label} <span style={{ color: 'var(--text-dim)', fontSize: 12, marginLeft: 4 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* ─── Deals Tab ────────────────────────────────────── */}
      {tab === 'deals' && (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <table className="booking-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-warm)' }}>
                {['Booking ID', 'Client', 'Chef', 'Date', 'Hours', 'Rate', 'Total', 'Commission', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 16px', color: 'var(--text-muted)',
                    fontWeight: 600, fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: 0.5, whiteSpace: 'nowrap',
                    borderBottom: '1px solid var(--border)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id || b.booking_ref} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-warm)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', color: 'var(--gold)', fontWeight: 600, fontFamily: 'monospace' }}>{b.booking_ref || b.id}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text)' }}>{b.client_name || b.client}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text)' }}>{b.chef_name || b.chef}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{b.event_date || b.date}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{b.hours}hrs</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>R{b.chef_rate || b.rate}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text)', fontWeight: 600 }}>R{(b.subtotal || b.total || 0).toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--gold)', fontWeight: 600 }}>R{(b.platform_fee || b.commission || 0).toLocaleString()}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant={statusColor(b.status)}>{b.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                <td colSpan={6} style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>TOTALS</td>
                <td style={{ padding: '16px', color: 'var(--text)', fontWeight: 800, fontSize: 16 }}>R{totalRevenue.toLocaleString()}</td>
                <td style={{ padding: '16px', color: 'var(--gold)', fontWeight: 800, fontSize: 16 }}>R{totalCommission.toLocaleString()}</td>
                <td style={{ padding: '16px' }}>
                  <Badge variant="green">{completedCount} done</Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ─── Chef Management Tab ──────────────────────────── */}
      {tab === 'chefs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chefs.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: 20,
              borderRadius: 'var(--radius)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              flexWrap: 'wrap', transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-border)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <ChefAvatar name={c.name} size={44} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                  {c.speciality.join(', ')} · R{c.rate}/hr · ⭐ {c.rating} ({c.reviews} reviews)
                </div>
              </div>
              <div className="admin-row-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="admin-row-badges" style={{ display: 'flex', gap: 6 }}>
                  <Badge variant={c.verified ? 'green' : 'grey'}>{c.verified ? 'Verified' : 'Unverified'}</Badge>
                  <Badge variant={c.available ? 'blue' : c.status === 'pending_review' ? 'gold' : 'red'}>
                    {c.status === 'pending_review' ? 'Pending Review' : c.available ? 'Active' : 'Suspended'}
                  </Badge>
                </div>
                {/* Verify / Unverify */}
                <button onClick={async () => {
                  try {
                    await supabase.from('chefs').update({ is_verified: !c.verified, verified_at: !c.verified ? new Date().toISOString() : null }).eq('id', c.id)
                  } catch(e) {}
                  setChefs(prev => prev.map(ch => ch.id === c.id ? { ...ch, verified: !ch.verified } : ch))
                }} style={{
                  background: c.verified ? 'var(--olive-dim)' : 'var(--green-bg)',
                  border: `1px solid ${c.verified ? 'var(--olive-border)' : 'var(--green-border)'}`,
                  color: c.verified ? 'var(--olive)' : 'var(--green)',
                  padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}>
                  {c.verified ? '✕ Unverify' : '✓ Verify'}
                </button>
                {/* Approve (for pending chefs) */}
                {c.status === 'pending_review' && (
                  <button onClick={async () => {
                    try {
                      await supabase.from('chefs').update({ status: 'active', is_available: true }).eq('id', c.id)
                    } catch(e) {}
                    setChefs(prev => prev.map(ch => ch.id === c.id ? { ...ch, status: 'active', available: true } : ch))
                  }} style={{
                    background: 'var(--green-bg)', border: '1px solid var(--green-border)',
                    color: 'var(--green)', padding: '7px 16px', borderRadius: 6,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}>
                    ✓ Approve
                  </button>
                )}
                <button onClick={() => toggleChef(c.id)} style={{
                  background: c.available ? 'var(--red-bg)' : 'var(--green-bg)',
                  border: `1px solid ${c.available ? 'var(--red-border)' : 'var(--green-border)'}`,
                  color: c.available ? 'var(--red)' : 'var(--green)',
                  padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  {c.available ? '⏸ Suspend' : '▶ Reactivate'}
                </button>
                <button onClick={() => removeChef(c.id)} style={{
                  background: 'var(--red-bg)', border: '1px solid var(--red-border)',
                  color: 'var(--red)', padding: '7px 16px', borderRadius: 6,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  🗑 Remove
                </button>
              </div>
            </div>
          ))}

          {chefs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</div>
              <p>No chefs on the platform</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
