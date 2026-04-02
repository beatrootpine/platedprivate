import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { GoldButton, Badge, ChefAvatar } from '../components/UI'
import { ClientEstimateReview } from '../components/CostEstimate'
import { getBookingsByClient, getEstimateByBooking, getEstimateItems, approveEstimate, requestEstimateRevision } from '../lib/api'

export default function ClientDashboard({ go }) {
  const { user, profile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [estimates, setEstimates] = useState({}) // keyed by booking id
  const [estimateItems, setEstimateItems] = useState({}) // keyed by estimate id
  const [expandedBooking, setExpandedBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadBookings()
  }, [user])

  async function loadBookings() {
    setLoading(true)
    const { data } = await getBookingsByClient(user.id)
    if (data) {
      setBookings(data)
      // Load estimates for confirmed bookings
      for (const b of data) {
        if (b.status === 'confirmed' || b.status === 'completed' || b.estimate_status) {
          try {
            const { data: est } = await getEstimateByBooking(b.id)
            if (est) {
              setEstimates(prev => ({ ...prev, [b.id]: est }))
              const { data: items } = await getEstimateItems(est.id)
              if (items) setEstimateItems(prev => ({ ...prev, [est.id]: items }))
            }
          } catch (e) { /* no estimate yet */ }
        }
      }
    }
    setLoading(false)
  }

  if (!user) return null

  const statusColor = (s) => {
    const map = { pending: 'gold', confirmed: 'blue', completed: 'green', cancelled: 'red' }
    return map[s] || 'grey'
  }

  const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending')
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')

  return (
    <div className="container page-top" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: 'var(--text)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Hi, {profile?.first_name} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Manage your bookings and find your next private chef
        </p>
      </div>

      {/* Quick action */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(186,151,77,0.08), rgba(65,65,60,0.04))',
        borderRadius: 'var(--radius)', padding: 28,
        border: '1px solid var(--border)', marginBottom: 32,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            Ready for your next experience?
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Tell us about your event and we'll match you with the perfect chef
          </div>
        </div>
        <GoldButton onClick={() => go('/book')} style={{ padding: '12px 28px' }}>
          Book a Chef →
        </GoldButton>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{
            width: 36, height: 36, margin: '0 auto 16px',
            border: '3px solid var(--border)', borderTopColor: 'var(--gold)',
            borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading your bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <h3 style={{ color: 'var(--text)', fontWeight: 500, fontSize: 18, marginBottom: 8 }}>
            No bookings yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Book your first private chef experience — it only takes 2 minutes
          </p>
          <GoldButton onClick={() => go('/book')}>Find a Chef</GoldButton>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ color: 'var(--text)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                Upcoming ({upcoming.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.map(b => {
                  const chef = b.chefs || {}
                  const chefProfile = chef.profiles || {}
                  const chefName = `${chefProfile.first_name || ''} ${chefProfile.last_name || ''}`.trim() || 'Chef'
                  const estimate = estimates[b.id]
                  const items = estimate ? (estimateItems[estimate.id] || []) : []
                  const isExpanded = expandedBooking === b.id
                  const hasEstimate = !!estimate && estimate.status !== 'draft'

                  return (
                    <div key={b.id} style={{
                      background: 'var(--bg-card)', borderRadius: 'var(--radius)',
                      padding: 20, border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <ChefAvatar name={chefName} size={40} />
                          <div>
                            <div style={{ color: 'var(--text)', fontWeight: 600 }}>{chefName}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                              {(chef.specialities || []).join(', ')}
                            </div>
                          </div>
                        </div>
                        <Badge variant={statusColor(b.status)}>{b.status}</Badge>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <span>📅 {b.event_date}</span>
                        <span>⏰ {b.event_time}</span>
                        <span>👥 {b.guest_count} guests</span>
                        <span>⏱ {b.hours} hours</span>
                        {b.location_area && <span>📍 {b.location_area}</span>}
                      </div>

                      {/* Status flow */}
                      <div style={{
                        display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap'
                      }}>
                        <StatusStep label="Request sent" done={true} />
                        <StatusStep label="Chef accepted" done={b.status === 'confirmed'} />
                        <StatusStep label="Estimate sent" done={hasEstimate} active={b.status === 'confirmed' && !hasEstimate} />
                        <StatusStep label="You approved" done={estimate?.status === 'approved'} active={hasEstimate && estimate?.status !== 'approved'} />
                      </div>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)',
                        flexWrap: 'wrap', gap: 8
                      }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            Ref: <strong style={{ color: 'var(--text-secondary)' }}>{b.booking_ref}</strong>
                          </span>
                          <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 16, marginLeft: 16 }}>
                            R{(b.grand_total || b.subtotal || 0).toLocaleString()}
                          </span>
                        </div>
                        {hasEstimate && (
                          <GoldButton
                            onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                            variant={isExpanded ? 'outline' : 'filled'}
                            style={{ padding: '8px 18px', fontSize: 12 }}
                          >
                            {isExpanded ? '✕ Close' : estimate.status === 'approved' ? '✓ View Estimate' : '🛒 Review Cost Estimate'}
                          </GoldButton>
                        )}
                        {!hasEstimate && b.status === 'confirmed' && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            ⏳ Waiting for chef to send cost estimate...
                          </span>
                        )}
                      </div>

                      {/* Expanded: Estimate Review */}
                      {isExpanded && estimate && (
                        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                          <ClientEstimateReview
                            estimate={estimate}
                            items={items}
                            booking={b}
                            onApprove={async () => {
                              await approveEstimate(estimate.id)
                              setExpandedBooking(null)
                              loadBookings()
                            }}
                            onRequestRevision={async (notes) => {
                              await requestEstimateRevision(estimate.id, notes)
                              setExpandedBooking(null)
                              loadBookings()
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 style={{ color: 'var(--text)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                Past Bookings ({past.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {past.map(b => {
                  const chef = b.chefs || {}
                  const chefProfile = chef.profiles || {}
                  const chefName = `${chefProfile.first_name || ''} ${chefProfile.last_name || ''}`.trim() || 'Chef'
                  return (
                    <div key={b.id} style={{
                      background: 'var(--bg-card)', borderRadius: 'var(--radius)',
                      padding: 16, border: '1px solid var(--border)',
                      opacity: b.status === 'cancelled' ? 0.6 : 1
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <ChefAvatar name={chefName} size={32} />
                          <div>
                            <span style={{ color: 'var(--text)', fontWeight: 500, fontSize: 14 }}>{chefName}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{b.event_date}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14 }}>
                            R{(b.subtotal || 0).toLocaleString()}
                          </span>
                          <Badge variant={statusColor(b.status)}>{b.status}</Badge>
                        </div>
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

// ─── Status Step Indicator ───────────────────────────
function StatusStep({ label, done, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 600,
      background: done ? 'var(--green-bg)' : active ? 'var(--gold-dim)' : 'var(--bg-warm)',
      color: done ? 'var(--green)' : active ? 'var(--gold)' : 'var(--text-dim)',
      border: `1px solid ${done ? 'var(--green-border)' : active ? 'var(--gold-border)' : 'var(--border-light)'}`
    }}>
      {done ? '✓' : active ? '●' : '○'} {label}
    </div>
  )
}
