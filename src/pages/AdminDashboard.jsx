import { useState } from 'react'
import { Badge, ChefAvatar, GoldButton } from '../components/UI'
import { MOCK_CHEFS, MOCK_BOOKINGS, PLATFORM_FEE } from '../data/constants'

export default function AdminDashboard() {
  const [tab, setTab] = useState('deals')
  const [chefs, setChefs] = useState(MOCK_CHEFS.map(c => ({ ...c })))

  const totalRevenue = MOCK_BOOKINGS.reduce((a, b) => a + b.total, 0)
  const totalCommission = MOCK_BOOKINGS.reduce((a, b) => a + b.commission, 0)
  const completedCount = MOCK_BOOKINGS.filter(b => b.status === 'completed').length
  const pendingCount = MOCK_BOOKINGS.filter(b => b.status === 'pending').length

  const toggleChef = (id) => {
    setChefs(prev => prev.map(c => c.id === id ? { ...c, available: !c.available } : c))
  }
  const removeChef = (id) => {
    if (confirm('Are you sure you want to remove this chef from the platform? This cannot be undone.')) {
      setChefs(prev => prev.filter(c => c.id !== id))
    }
  }

  const statusColor = (s) => s === 'completed' ? 'green' : s === 'confirmed' ? 'blue' : 'gold'

  return (
    <div className="container page-top">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{
            color: '#fff', fontSize: 'clamp(24px, 3vw, 30px)',
            fontFamily: 'var(--font-display)', fontWeight: 300
          }}>Admin Dashboard</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Platform overview and management</p>
        </div>
        <Badge variant="gold">ADMIN ACCESS</Badge>
      </div>

      {/* ─── Stats Cards ──────────────────────────────────── */}
      <div className="grid-stats" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, marginBottom: 36
      }}>
        {[
          { label: 'Total Bookings Revenue', val: `R${totalRevenue.toLocaleString()}`, color: '#fff', icon: '💳' },
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
          { key: 'deals', label: '📋 All Deals', count: MOCK_BOOKINGS.length },
          { key: 'chefs', label: '👨‍🍳 Manage Chefs', count: chefs.length }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab === t.key ? 'var(--gold)' : 'transparent'}`,
            color: tab === t.key ? 'var(--gold)' : '#888',
            padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            {t.label} <span style={{ color: '#555', fontSize: 12, marginLeft: 4 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* ─── Deals Tab ────────────────────────────────────── */}
      {tab === 'deals' && (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <table className="booking-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Booking ID', 'Client', 'Chef', 'Date', 'Hours', 'Rate', 'Total', 'Commission', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 16px', color: '#666',
                    fontWeight: 600, fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: 0.5, whiteSpace: 'nowrap',
                    borderBottom: '1px solid var(--border)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_BOOKINGS.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', color: 'var(--gold)', fontWeight: 600, fontFamily: 'monospace' }}>{b.id}</td>
                  <td style={{ padding: '14px 16px', color: '#fff' }}>{b.client}</td>
                  <td style={{ padding: '14px 16px', color: '#ddd' }}>{b.chef}</td>
                  <td style={{ padding: '14px 16px', color: '#aaa', whiteSpace: 'nowrap' }}>{b.date}</td>
                  <td style={{ padding: '14px 16px', color: '#aaa' }}>{b.hours}hrs</td>
                  <td style={{ padding: '14px 16px', color: '#aaa' }}>R{b.rate}</td>
                  <td style={{ padding: '14px 16px', color: '#fff', fontWeight: 600 }}>R{b.total.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--gold)', fontWeight: 600 }}>R{b.commission.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant={statusColor(b.status)}>{b.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                <td colSpan={6} style={{ padding: '16px', color: '#888', fontWeight: 600, fontSize: 13 }}>TOTALS</td>
                <td style={{ padding: '16px', color: '#fff', fontWeight: 800, fontSize: 16 }}>R{totalRevenue.toLocaleString()}</td>
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
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <ChefAvatar name={c.name} size={44} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                  {c.speciality.join(', ')} · R{c.rate}/hr · ⭐ {c.rating} ({c.reviews} reviews)
                </div>
              </div>
              <div className="admin-row-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="admin-row-badges" style={{ display: 'flex', gap: 6 }}>
                  <Badge variant={c.verified ? 'green' : 'grey'}>{c.verified ? 'Verified' : 'Unverified'}</Badge>
                  <Badge variant={c.available ? 'blue' : 'red'}>{c.available ? 'Active' : 'Suspended'}</Badge>
                </div>
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
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</div>
              <p>No chefs on the platform</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
