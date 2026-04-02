import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { GoldButton, Badge, ChefAvatar } from '../components/UI'
import { ClientEstimateReview } from '../components/CostEstimate'
import { getBookingsByClient, getEstimateByBooking, getEstimateItems, approveEstimate, requestEstimateRevision } from '../lib/api'

export default function ClientDashboard({ go }) {
  const { user, profile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [estimates, setEstimates] = useState({})
  const [estItems, setEstItems] = useState({})
  const [expandedBooking, setExpandedBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadBookings() }, [user])

  async function loadBookings() {
    setLoading(true)
    const { data } = await getBookingsByClient(user.id)
    if (data) {
      setBookings(data)
      for (const b of data) {
        try {
          const { data: est } = await getEstimateByBooking(b.id)
          if (est) {
            setEstimates(prev => ({ ...prev, [b.id]: est }))
            const { data: items } = await getEstimateItems(est.id)
            if (items) setEstItems(prev => ({ ...prev, [est.id]: items }))
          }
        } catch (e) {}
      }
    }
    setLoading(false)
  }

  if (!user) return null

  const getPhase = (b) => {
    const est = estimates[b.id]
    if (b.status === 'pending') return { step: 1, label: 'Waiting for chef to accept', color: 'gold', action: null }
    if (b.status === 'cancelled') return { step: 0, label: 'Cancelled', color: 'red', action: null }
    if (b.status === 'completed') return { step: 4, label: 'Completed', color: 'green', action: null }
    if (!est) return { step: 2, label: 'Chef is preparing cost estimate', color: 'blue', action: null }
    if (est.status === 'submitted' || est.status === 'revised') return { step: 3, label: 'Cost estimate ready — review now', color: 'gold', action: 'review' }
    if (est.status === 'approved') return { step: 4, label: 'All approved — chef is preparing!', color: 'green', action: 'view' }
    if (est.status === 'revision_requested') return { step: 3, label: 'Waiting for chef to revise estimate', color: 'blue', action: null }
    return { step: 2, label: 'Confirmed', color: 'blue', action: null }
  }

  const upcoming = bookings.filter(b => ['pending','confirmed'].includes(b.status))
  const past = bookings.filter(b => ['completed','cancelled'].includes(b.status))

  return (
    <div className="container page-top" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: 'var(--text)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Hi, {profile?.first_name} 👋</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage your bookings and track your dining experiences</p>
      </div>

      {/* Quick book CTA */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(186,151,77,0.08), rgba(65,65,60,0.04))',
        borderRadius: 'var(--radius)', padding: 24, border: '1px solid var(--border)', marginBottom: 32,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Ready for your next experience?</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Tell us about your event and we'll find the perfect chef</div>
        </div>
        <GoldButton onClick={() => go('/book')} style={{ padding: '12px 28px' }}>Book a Chef →</GoldButton>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 36, height: 36, margin: '0 auto 16px', border: '3px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <h3 style={{ color: 'var(--text)', fontWeight: 500, fontSize: 18, marginBottom: 8 }}>No bookings yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Book your first private chef — it only takes 2 minutes</p>
          <GoldButton onClick={() => go('/book')}>Find a Chef</GoldButton>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ color: 'var(--text)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Upcoming ({upcoming.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {upcoming.map(b => {
                  const chef = b.chefs || {}
                  const cp = chef.profiles || {}
                  const chefName = `${cp.first_name || ''} ${cp.last_name || ''}`.trim() || 'Chef'
                  const phase = getPhase(b)
                  const est = estimates[b.id]
                  const items = est ? (estItems[est.id] || []) : []
                  const isExpanded = expandedBooking === b.id

                  return (
                    <div key={b.id} style={{
                      background: 'var(--bg-card)', borderRadius: 'var(--radius)',
                      border: `1px solid ${phase.action === 'review' ? 'var(--gold-border)' : 'var(--border)'}`,
                      overflow: 'hidden'
                    }}>
                      {/* Action banner */}
                      {phase.action === 'review' && (
                        <div style={{ padding: '8px 20px', fontSize: 12, fontWeight: 700, background: 'var(--gold-dim)', color: 'var(--gold)', letterSpacing: 0.3 }}>
                          🛒 COST ESTIMATE READY — Review & Approve
                        </div>
                      )}

                      <div style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <ChefAvatar name={chefName} size={40} />
                            <div>
                              <div style={{ color: 'var(--text)', fontWeight: 600 }}>{chefName}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{(chef.specialities || []).join(', ')}</div>
                            </div>
                          </div>
                          <Badge variant={phase.color}>{phase.label}</Badge>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
                          <span>📅 {b.event_date}</span>
                          <span>⏰ {b.event_time}</span>
                          <span>👥 {b.guest_count} guests</span>
                          <span>⏱ {b.hours}hrs</span>
                          {b.location_area && <span>📍 {b.location_area}</span>}
                        </div>

                        {/* Progress steps */}
                        <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
                          {['Requested', 'Accepted', 'Estimate', 'Approved'].map((s, i) => (
                            <div key={s} style={{
                              flex: 1, textAlign: 'center', padding: '6px 0', fontSize: 10, fontWeight: 600,
                              borderRadius: 4, letterSpacing: 0.3,
                              background: i < phase.step ? 'var(--green-bg)' : i === phase.step ? 'var(--gold-dim)' : 'var(--bg-warm)',
                              color: i < phase.step ? 'var(--green)' : i === phase.step ? 'var(--gold)' : 'var(--text-dim)',
                              border: `1px solid ${i < phase.step ? 'var(--green-border)' : i === phase.step ? 'var(--gold-border)' : 'var(--border-light)'}`
                            }}>{i < phase.step ? '✓ ' : ''}{s}</div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          paddingTop: 14, marginTop: 14, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: 8
                        }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            Ref: <strong>{b.booking_ref}</strong>
                            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16, marginLeft: 12 }}>
                              R{(b.grand_total || b.subtotal || 0).toLocaleString()}
                            </span>
                          </span>
                          {phase.action === 'review' && (
                            <GoldButton onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                              style={{ padding: '9px 20px', fontSize: 13 }}>
                              {isExpanded ? '✕ Close' : '🛒 Review & Approve'}
                            </GoldButton>
                          )}
                          {phase.action === 'view' && (
                            <GoldButton onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                              variant="outline" style={{ padding: '9px 20px', fontSize: 13 }}>
                              {isExpanded ? '✕ Close' : '📋 View Estimate'}
                            </GoldButton>
                          )}
                        </div>

                        {/* Expanded estimate */}
                        {isExpanded && est && (
                          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                            <ClientEstimateReview
                              estimate={est} items={items} booking={b}
                              onApprove={async () => {
                                await approveEstimate(est.id)
                                setExpandedBooking(null); loadBookings()
                              }}
                              onRequestRevision={async (notes) => {
                                await requestEstimateRevision(est.id, notes)
                                setExpandedBooking(null); loadBookings()
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 style={{ color: 'var(--text)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Past ({past.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {past.map(b => {
                  const cp = (b.chefs?.profiles) || {}
                  const name = `${cp.first_name || ''} ${cp.last_name || ''}`.trim() || 'Chef'
                  return (
                    <div key={b.id} style={{
                      background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 16,
                      border: '1px solid var(--border)', opacity: b.status === 'cancelled' ? 0.6 : 1,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8
                    }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <ChefAvatar name={name} size={32} />
                        <div>
                          <span style={{ color: 'var(--text)', fontWeight: 500, fontSize: 14 }}>{name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{b.event_date}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14 }}>R{(b.grand_total || b.subtotal || 0).toLocaleString()}</span>
                        <Badge variant={b.status === 'completed' ? 'green' : 'red'}>{b.status}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
