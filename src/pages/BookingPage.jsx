import { useState } from 'react'
import { GoldButton, Input, TextArea, TagSelector, ChefCard, ChefAvatar, Logo } from '../components/UI'
import { MOCK_CHEFS, SPECIALITIES } from '../data/constants'
import { useAuth } from '../context/AuthContext'
import { matchChefs, matchChefsFallback, createBooking } from '../lib/api'
import { normalizeMatchedChef, normalizeChef } from '../lib/helpers'

export default function BookingPage({ go }) {
  const { user, profile } = useAuth()
  const [step, setStep] = useState(0)
  const [booking, setBooking] = useState({
    name: '', email: '', phone: '', date: '', time: '18:00',
    guests: '4', hours: '3', cuisine: [], dietary: '', area: '', notes: ''
  })
  const [matchedChefs, setMatchedChefs] = useState([])
  const [selectedChef, setSelectedChef] = useState(null)

  const upd = (f, v) => setBooking(p => ({ ...p, [f]: v }))
  const toggleCuisine = (v) => setBooking(p => ({
    ...p,
    cuisine: p.cuisine.includes(v)
      ? p.cuisine.filter(c => c !== v)
      : p.cuisine.length < 3 ? [...p.cuisine, v] : p.cuisine
  }))

  const findChefs = async () => {
    setStep(1)
    const hrs = parseInt(booking.hours) || 3

    try {
      // Try smart matching via Supabase RPC
      const { data, error } = await matchChefs({
        area: booking.area,
        cuisines: booking.cuisine,
        hours: hrs,
        limit: 3
      })

      if (!error && data?.length > 0) {
        setMatchedChefs(data.map(normalizeMatchedChef))
        setStep(2)
        return
      }

      // Fallback: direct query
      const { data: fallbackData } = await matchChefsFallback({
        area: booking.area,
        cuisines: booking.cuisine,
        hours: hrs
      })

      if (fallbackData?.length > 0) {
        setMatchedChefs(fallbackData.map(normalizeChef))
        setStep(2)
        return
      }
    } catch (e) {
      console.log('Supabase not available, using mock data')
    }

    // Final fallback: mock data
    let matches = MOCK_CHEFS.filter(c => c.available)
    if (booking.area) {
      matches = matches.filter(c =>
        c.areas.some(a => a.toLowerCase().includes(booking.area.toLowerCase()))
      )
    }
    if (booking.cuisine.length > 0) {
      matches.sort((a, b) => {
        const aMatch = a.speciality.filter(s => booking.cuisine.includes(s)).length
        const bMatch = b.speciality.filter(s => booking.cuisine.includes(s)).length
        return bMatch - aMatch
      })
    }
    matches = matches.filter(c => c.minHours <= hrs)
    setMatchedChefs(matches.slice(0, 3))
    setStep(2)
  }

  const confirmBooking = async (chef) => {
    setSelectedChef(chef)

    // Try to save booking to Supabase if user is logged in
    if (user && chef.id) {
      try {
        await createBooking({
          client_id: user.id,
          chef_id: chef.id,
          event_date: booking.date,
          event_time: booking.time,
          guest_count: parseInt(booking.guests) || 4,
          hours: parseInt(booking.hours) || 3,
          location_area: booking.area,
          cuisine_preferences: booking.cuisine,
          dietary_requirements: booking.dietary,
          special_requests: booking.notes,
          rate_per_hour: chef.rate,
        })
      } catch (e) {
        console.log('Could not save booking:', e)
      }
    }

    setStep(3)
  }

  // ─── Matching Animation ───────────────────────────────
  if (step === 1) {
    return (
      <div style={{
        maxWidth: 600, margin: '0 auto', padding: '160px 24px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
          <Logo size="md" />
        </div>
        <div style={{
          width: 64, height: 64, margin: '0 auto 28px',
          border: '3px solid rgba(184,151,47,0.2)', borderTopColor: 'var(--gold)',
          borderRadius: '50%', animation: 'spin 1s linear infinite'
        }} />
        <h2 style={{
          color: 'var(--text)', fontFamily: 'var(--font-display)',
          fontWeight: 300, fontSize: 28, marginBottom: 12
        }}>Finding your perfect chefs...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Matching based on {booking.cuisine.length > 0 ? booking.cuisine.join(', ') : 'your preferences'},
          {' '}{booking.area || 'your area'}, and availability
        </p>
        <div style={{
          margin: '36px auto', width: 240, height: 3,
          background: 'var(--border)', borderRadius: 2, overflow: 'hidden'
        }}>
          <div style={{
            width: '40%', height: '100%',
            background: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
            animation: 'shimmer 1.5s infinite', borderRadius: 2
          }} />
        </div>
      </div>
    )
  }

  // ─── Chef Results ─────────────────────────────────────
  if (step === 2) {
    return (
      <div className="container page-top">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            color: 'var(--text)', fontSize: 'clamp(26px, 4vw, 34px)',
            fontFamily: 'var(--font-display)', fontWeight: 300, marginBottom: 12
          }}>Your Chef Matches</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            📅 {booking.date} · ⏰ {booking.time} · 👥 {booking.guests} guests
            · ⏱ {booking.hours} hours
            {booking.cuisine.length > 0 && ` · 🍽️ ${booking.cuisine.join(', ')}`}
          </p>
        </div>

        {matchedChefs.length > 0 ? (
          <div className="grid-chefs" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: 24
          }}>
            {matchedChefs.map(c => (
              <ChefCard key={c.id} chef={c} showSelect onSelect={confirmBooking} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
            <h3 style={{ color: 'var(--text)', fontWeight: 400, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
              No chefs available for your criteria
            </h3>
            <p style={{ marginBottom: 24 }}>Try adjusting your area, hours, or cuisine preferences</p>
            <GoldButton onClick={() => setStep(0)}>Edit Booking Details</GoldButton>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <GoldButton onClick={() => setStep(0)} variant="outline">← Change Details</GoldButton>
        </div>
      </div>
    )
  }

  // ─── Confirmation ─────────────────────────────────────
  if (step === 3) {
    const hours = parseInt(booking.hours) || 3
    const total = selectedChef.rate * hours
    return (
      <div style={{
        maxWidth: 560, margin: '0 auto', padding: '120px 24px 60px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h1 style={{
          color: 'var(--text)', fontSize: 32,
          fontFamily: 'var(--font-display)', fontWeight: 300, marginBottom: 8
        }}>Booking Confirmed!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Your request has been sent to {selectedChef.name}. They'll confirm within 2 hours.
        </p>

        <div style={{
          background: 'var(--bg-card)', borderRadius: 16, padding: 32,
          border: '1px solid var(--border)', textAlign: 'left'
        }}>
          {/* Chef info */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
            <ChefAvatar name={selectedChef.name} size={52} />
            <div>
              <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 16 }}>{selectedChef.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{selectedChef.speciality.join(' · ')}</div>
            </div>
          </div>

          {/* Booking details grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14
          }}>
            {[
              { label: 'Date', val: booking.date },
              { label: 'Time', val: booking.time },
              { label: 'Guests', val: booking.guests },
              { label: 'Duration', val: `${booking.hours} hours` },
              { label: 'Location', val: booking.area },
              { label: 'Rate', val: `R${selectedChef.rate}/hr` },
            ].map(r => (
              <div key={r.label}>
                <span style={{ color: 'var(--text-muted)' }}>{r.label}: </span>
                <span style={{ color: 'var(--text)' }}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{
            borderTop: '1px solid var(--border-light)', marginTop: 24, paddingTop: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Total Estimate</span>
            <span style={{ color: 'var(--gold)', fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              R{total.toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
          <GoldButton onClick={() => go('/')} variant="outline">Back to Home</GoldButton>
          <GoldButton onClick={() => { setStep(0); setSelectedChef(null) }}>Book Another Chef</GoldButton>
        </div>
      </div>
    )
  }

  // ─── Step 0: Booking Form ─────────────────────────────
  const formValid = booking.name && booking.email && booking.date && booking.area

  return (
    <div className="container-sm page-top">
      <h1 style={{
        color: 'var(--text)', fontSize: 'clamp(26px, 4vw, 32px)',
        fontFamily: 'var(--font-display)', fontWeight: 300, marginBottom: 8
      }}>Book a Private Chef</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 15 }}>
        Tell us about your event and we'll match you with 3 perfect chefs
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Contact details */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Your Name" placeholder="Full name" value={booking.name} onChange={e => upd('name', e.target.value)} />
          <Input label="Email" type="email" placeholder="email@example.com" value={booking.email} onChange={e => upd('email', e.target.value)} />
        </div>
        <Input label="Phone" type="tel" placeholder="082 123 4567" value={booking.phone} onChange={e => upd('phone', e.target.value)} />

        {/* Date & Time */}
        <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Event Date" type="date" value={booking.date} onChange={e => upd('date', e.target.value)} />
          <Input label="Start Time" type="time" value={booking.time} onChange={e => upd('time', e.target.value)} />
        </div>

        {/* Guests selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Number of Guests
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['2', '4', '6', '8', '10', '12+'].map(g => (
              <button key={g} onClick={() => upd('guests', g)} style={{
                flex: '1 1 60px', padding: '11px 4px', borderRadius: 'var(--radius-sm)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: booking.guests === g ? 'rgba(184,151,47,0.2)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${booking.guests === g ? 'var(--gold)' : 'var(--border-input)'}`,
                color: booking.guests === g ? 'var(--gold)' : '#888'
              }}>{g}</button>
            ))}
          </div>
        </div>

        {/* Hours selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Hours Needed
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['2', '3', '4', '5', '6+'].map(h => (
              <button key={h} onClick={() => upd('hours', h)} style={{
                flex: '1 1 60px', padding: '11px 4px', borderRadius: 'var(--radius-sm)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: booking.hours === h ? 'rgba(184,151,47,0.2)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${booking.hours === h ? 'var(--gold)' : 'var(--border-input)'}`,
                color: booking.hours === h ? 'var(--gold)' : '#888'
              }}>{h}hrs</button>
            ))}
          </div>
        </div>

        {/* Cuisine tags */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Cuisine Preference (up to 3 — optional)
          </label>
          <TagSelector options={SPECIALITIES} selected={booking.cuisine} onToggle={toggleCuisine} max={3} />
        </div>

        <Input label="Your Area *" placeholder="e.g. Sandton, Fourways, Centurion..." value={booking.area} onChange={e => upd('area', e.target.value)} />
        <TextArea label="Special Requirements / Dietary Needs" placeholder="Allergies, dietary restrictions, event theme, special requests..." value={booking.dietary} onChange={e => upd('dietary', e.target.value)} />
      </div>

      <GoldButton
        onClick={findChefs}
        disabled={!formValid}
        style={{ width: '100%', marginTop: 36, padding: '16px 28px', fontSize: 16 }}
      >
        Find My Perfect Chef →
      </GoldButton>
      <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, marginTop: 12 }}>
        No payment required at this stage. You'll only pay once your chef confirms.
      </p>
    </div>
  )
}
