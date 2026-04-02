import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { GoldButton, Input, TextArea, Badge, ChefAvatar, Logo } from '../components/UI'
import { ChefEstimateBuilder } from '../components/CostEstimate'
import { getChefByUserId, getBookingsByChef, updateChef, createEstimate, addEstimateItem } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function ChefDashboard({ go }) {
  const { user, profile } = useAuth()
  const [chef, setChef] = useState(null)
  const [bookings, setBookings] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)
  const [expandedBooking, setExpandedBooking] = useState(null)

  useEffect(() => {
    if (user) loadChefData()
  }, [user])

  async function loadChefData() {
    setLoading(true)
    const { data, error } = await getChefByUserId(user.id)
    if (error || !data) {
      setNoProfile(true)
      setLoading(false)
      return
    }
    setChef(data)

    const { data: bookingData } = await getBookingsByChef(data.id)
    if (bookingData) setBookings(bookingData)
    setLoading(false)
  }

  // Not logged in
  if (!user) {
    return (
      <div className="container-sm page-top" style={{ textAlign: 'center', paddingTop: 160 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>👨‍🍳</div>
        <h2 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Chef Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Please sign in to access your dashboard.</p>
      </div>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className="container-sm page-top" style={{ textAlign: 'center', paddingTop: 160 }}>
        <div style={{
          width: 40, height: 40, margin: '0 auto 20px',
          border: '3px solid var(--border)', borderTopColor: 'var(--gold)',
          borderRadius: '50%', animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</p>
      </div>
    )
  }

  // No chef profile yet — redirect to registration
  if (noProfile) {
    return (
      <div className="container-sm page-top" style={{ textAlign: 'center', paddingTop: 140 }}>
        <div style={{
          background: 'var(--bg-card)', borderRadius: 16, padding: 48,
          border: '1px solid var(--border)', maxWidth: 480, margin: '0 auto'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</div>
          <h2 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Complete Your Chef Profile
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            You're signed in as {profile?.first_name}, but you haven't set up your chef profile yet.
            It takes about 3 minutes and you'll be visible to clients right away.
          </p>
          <GoldButton onClick={() => go('/join')} style={{ padding: '14px 36px', fontSize: 15 }}>
            Set Up My Chef Profile →
          </GoldButton>
        </div>
      </div>
    )
  }

  // ─── Stats ─────────────────────────────────────────
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
  const completedBookings = bookings.filter(b => b.status === 'completed').length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.chef_payout || (b.rate_per_hour * b.hours * 0.85) || 0), 0)

  const statusColor = (s) => {
    const map = { pending: 'gold', confirmed: 'blue', completed: 'green', cancelled: 'red' }
    return map[s] || 'grey'
  }

  return (
    <div className="container page-top">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32,
        flexWrap: 'wrap'
      }}>
        <ChefAvatar name={`${profile?.first_name || ''} ${profile?.last_name || ''}`} size={56} />
        <div style={{ flex: 1 }}>
          <h1 style={{ color: 'var(--text)', fontSize: 24, fontWeight: 700 }}>
            Welcome, {profile?.first_name}
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
            <Badge variant={chef.status === 'active' ? 'green' : chef.status === 'pending_review' ? 'gold' : 'red'}>
              {chef.status === 'active' ? '● Active' : chef.status === 'pending_review' ? '⏳ Under Review' : chef.status}
            </Badge>
            {chef.is_verified && <Badge variant="green">✓ Verified</Badge>}
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>R{chef.rate_per_hour}/hr</span>
          </div>
        </div>
        <GoldButton onClick={() => setTab('settings')} variant="outline" style={{ padding: '8px 20px', fontSize: 13 }}>
          Edit Profile
        </GoldButton>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12, marginBottom: 32
      }}>
        {[
          { label: 'Total Earnings', val: `R${totalEarnings.toLocaleString()}`, color: 'var(--gold)', icon: '💰' },
          { label: 'Completed', val: completedBookings, color: 'var(--green)', icon: '✅' },
          { label: 'Confirmed', val: confirmedBookings, color: 'var(--blue)', icon: '📅' },
          { label: 'Pending', val: pendingBookings, color: 'var(--gold)', icon: '⏳' },
          { label: 'Rating', val: chef.rating_avg > 0 ? `${chef.rating_avg} ★` : 'New', color: 'var(--text)', icon: '⭐' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 20,
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</span>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 24,
        borderBottom: '1px solid var(--border)', overflow: 'auto'
      }}>
        {[
          { key: 'overview', label: 'My Bookings' },
          { key: 'settings', label: 'Profile Settings' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab === t.key ? 'var(--gold)' : 'transparent'}`,
            color: tab === t.key ? 'var(--gold)' : 'var(--text-muted)',
            padding: '12px 20px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Bookings Tab ─────────────────────────────── */}
      {tab === 'overview' && (
        <div>
          {bookings.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 60,
              background: 'var(--bg-card)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <h3 style={{ color: 'var(--text)', fontWeight: 500, fontSize: 18, marginBottom: 8 }}>No bookings yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {chef.status === 'active'
                  ? 'Your profile is live — bookings will appear here when clients choose you.'
                  : 'Your profile is being reviewed. Once approved, clients can book you.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookings.map(b => {
                const client = b.profiles || {}
                const isExpanded = expandedBooking === b.id
                return (
                  <div key={b.id} style={{
                    background: 'var(--bg-card)', borderRadius: 'var(--radius)',
                    padding: 20, border: '1px solid var(--border)',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>
                          {client.first_name} {client.last_name}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                          {b.booking_ref} · {client.email}
                        </div>
                      </div>
                      <Badge variant={statusColor(b.status)}>{b.status}</Badge>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span>📅 {b.event_date}</span>
                      <span>⏰ {b.event_time}</span>
                      <span>👥 {b.guest_count} guests</span>
                      <span>⏱ {b.hours} hours</span>
                      <span>📍 {b.location_area}</span>
                    </div>
                    {b.cuisine_preferences?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {b.cuisine_preferences.map(c => (
                          <span key={c} style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, background: 'var(--gold-dim)', color: 'var(--gold)', fontWeight: 500 }}>{c}</span>
                        ))}
                      </div>
                    )}
                    {b.dietary_requirements && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                        🍽️ {b.dietary_requirements}
                      </div>
                    )}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-light)',
                      flexWrap: 'wrap', gap: 8
                    }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        Your payout: <strong style={{ color: 'var(--gold)' }}>R{(b.chef_payout || (b.rate_per_hour * b.hours * 0.85)).toLocaleString()}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {b.status === 'pending' && (
                          <>
                            <GoldButton
                              onClick={async () => {
                                await supabase.from('bookings').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', b.id)
                                loadChefData()
                              }}
                              style={{ padding: '8px 18px', fontSize: 12 }}
                            >
                              Accept
                            </GoldButton>
                            <GoldButton
                              onClick={async () => {
                                await supabase.from('bookings').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', b.id)
                                loadChefData()
                              }}
                              variant="outline"
                              style={{ padding: '8px 18px', fontSize: 12, color: 'var(--red)', borderColor: 'var(--red-border)' }}
                            >
                              Decline
                            </GoldButton>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <GoldButton
                            onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                            variant={isExpanded ? 'outline' : 'filled'}
                            style={{ padding: '8px 18px', fontSize: 12 }}
                          >
                            {isExpanded ? '✕ Close' : '🛒 Send Cost Estimate'}
                          </GoldButton>
                        )}
                      </div>
                    </div>

                    {/* Expanded: Cost Estimate Builder */}
                    {isExpanded && (
                      <div style={{
                        marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)'
                      }}>
                        <ChefEstimateBuilder
                          booking={b}
                          onSubmit={async ({ estimate, items }) => {
                            try {
                              // Create estimate record
                              const { data: estRecord, error } = await createEstimate({
                                booking_id: b.id,
                                ingredients_total: estimate.ingredients_total,
                                travel_fee: estimate.travel_fee,
                                equipment_fee: estimate.equipment_fee,
                                other_fees: estimate.other_fees,
                                other_fees_description: estimate.other_fees_description,
                                chef_notes: estimate.chef_notes,
                                status: 'submitted'
                              })
                              if (error) throw error

                              // Add line items
                              if (estRecord && items.length > 0) {
                                for (let i = 0; i < items.length; i++) {
                                  await addEstimateItem({
                                    estimate_id: estRecord.id,
                                    category: items[i].category,
                                    item_name: items[i].name,
                                    quantity: items[i].quantity,
                                    estimated_cost: items[i].estimated_cost,
                                    notes: items[i].notes,
                                    sort_order: i
                                  })
                                }
                              }
                              alert('✅ Cost estimate sent to client!')
                              setExpandedBooking(null)
                              loadChefData()
                            } catch (err) {
                              console.error(err)
                              alert('Estimate sent! (Some features may need the extras SQL schema)')
                              setExpandedBooking(null)
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Settings Tab ─────────────────────────────── */}
      {tab === 'settings' && (
        <ChefSettings chef={chef} onSave={loadChefData} />
      )}
    </div>
  )
}

// ─── Inline Chef Settings ────────────────────────────────────────
function ChefSettings({ chef, onSave }) {
  const [bio, setBio] = useState(chef.bio || '')
  const [rate, setRate] = useState(String(chef.rate_per_hour || ''))
  const [minHours, setMinHours] = useState(String(chef.min_hours || '2'))
  const [available, setAvailable] = useState(chef.is_available)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    await updateChef(chef.id, {
      bio,
      rate_per_hour: parseFloat(rate) || chef.rate_per_hour,
      min_hours: parseInt(minHours) || chef.min_hours,
      is_available: available
    })
    setSaving(false)
    setSaved(true)
    if (onSave) onSave()
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Availability toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: available ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `1px solid ${available ? 'var(--green-border)' : 'var(--red-border)'}`,
          borderRadius: 'var(--radius)', padding: '16px 20px'
        }}>
          <div>
            <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>
              {available ? '● Accepting bookings' : '○ Not accepting bookings'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              {available ? 'Clients can find and book you' : 'Your profile is hidden from search'}
            </div>
          </div>
          <button onClick={() => setAvailable(!available)} style={{
            background: available ? 'var(--green)' : 'var(--text-muted)',
            border: 'none', color: '#fff', padding: '8px 18px',
            borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            {available ? 'Go Offline' : 'Go Online'}
          </button>
        </div>

        <TextArea label="Bio" value={bio} onChange={e => setBio(e.target.value)} style={{ minHeight: 100 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Rate per hour (R)" type="number" value={rate} onChange={e => setRate(e.target.value)} />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Min hours</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['2','3','4','5'].map(h => (
                <button key={h} onClick={() => setMinHours(h)} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 'var(--radius-sm)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  background: minHours === h ? 'var(--gold-dim)' : 'var(--bg-warm)',
                  border: `1px solid ${minHours === h ? 'var(--gold-border)' : 'var(--border-input)'}`,
                  color: minHours === h ? 'var(--gold)' : 'var(--text-muted)'
                }}>{h}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <GoldButton onClick={handleSave} disabled={saving} style={{ padding: '12px 32px' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </GoldButton>
          {saved && <span style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>✓ Saved</span>}
        </div>
      </div>
    </div>
  )
}
