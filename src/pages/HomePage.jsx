import { useState, useEffect } from 'react'
import { Logo, GoldButton, SectionHeader, ChefCard } from '../components/UI'
import { MOCK_CHEFS } from '../data/constants'
import { getActiveChefs } from '../lib/api'
import { normalizeChef } from '../lib/helpers'

export default function HomePage({ go }) {
  const [featuredChefs, setFeaturedChefs] = useState([])

  useEffect(() => {
    async function load() {
      const { data, error } = await getActiveChefs()
      if (!error && data?.length > 0) {
        setFeaturedChefs(data.map(normalizeChef).slice(0, 3))
      } else {
        setFeaturedChefs(MOCK_CHEFS.filter(c => c.available).slice(0, 3))
      }
    }
    load()
  }, [])

  return (
    <div>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <div style={{
        minHeight: '92vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 24px 80px',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.07,
          background: 'radial-gradient(ellipse 800px 600px at 50% 30%, var(--gold) 0%, transparent 70%)'
        }} />
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(184,151,47,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(184,151,47,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }} className="animate-in">
          {/* Actual Logo — on dark container for contrast */}
          <div style={{
            marginBottom: 32, display: 'flex', justifyContent: 'center'
          }}>
            <div style={{
              background: '#1A1A18', borderRadius: 16, padding: '20px 36px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <Logo size="xl" />
            </div>
          </div>

          <p style={{
            fontSize: 'clamp(16px, 3vw, 21px)', color: 'var(--text-secondary)',
            maxWidth: 560, margin: '0 auto 44px', lineHeight: 1.7, fontWeight: 300
          }}>
            South Africa's premier private chef marketplace.<br />
            Exceptional dining experiences, delivered to your door.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <GoldButton onClick={() => go('/book')} style={{ padding: '16px 44px', fontSize: 16 }}>
              Book a Private Chef
            </GoldButton>
            <GoldButton onClick={() => go('/join')} variant="outline" style={{ padding: '16px 44px', fontSize: 16 }}>
              Join as a Chef
            </GoldButton>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          animation: 'pulse 2s infinite'
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1 }}>SCROLL</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <rect x="1" y="1" width="14" height="22" rx="7" />
            <circle cx="8" cy="8" r="2" fill="var(--text-muted)" />
          </svg>
        </div>
      </div>

      {/* ─── How It Works ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px' }}>
        <SectionHeader label="How It Works" title="Three simple steps to an unforgettable meal" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24
        }}>
          {[
            { num: '01', icon: '📋', title: 'Tell Us About Your Event', desc: 'Share your date, guest count, cuisine preferences, and any dietary needs. It takes under 2 minutes.' },
            { num: '02', icon: '👨‍🍳', title: 'Choose Your Chef', desc: 'We match you with 3 perfect chefs. Browse profiles, read reviews, check qualifications, and pick your favourite.' },
            { num: '03', icon: '🍽️', title: 'Enjoy the Experience', desc: 'Your chef arrives with ingredients, cooks, serves, and cleans up. You just sit back and enjoy.' },
          ].map((s, i) => (
            <div key={s.num} className={`animate-in animate-in-delay-${i+1}`} style={{
              padding: 32, background: 'var(--bg-card)', borderRadius: 16,
              border: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: -10, right: -5, fontSize: 80,
                fontWeight: 900, color: 'rgba(184,151,47,0.1)',
                fontFamily: 'var(--font-display)', lineHeight: 1
              }}>{s.num}</div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{s.icon}</div>
              <h4 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 600, marginBottom: 10 }}>{s.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Featured Chefs ───────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
        <SectionHeader label="Featured Chefs" title="Meet some of our culinary artists" />
        <div className="grid-chefs" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: 24
        }}>
          {featuredChefs.map(c => (
            <ChefCard key={c.id} chef={c} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <GoldButton onClick={() => go('/chefs')} variant="outline">View All Chefs →</GoldButton>
        </div>
      </div>

      {/* ─── For Chefs CTA ────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(94,107,58,0.06) 0%, rgba(184,151,47,0.04) 100%)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '80px 24px'
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            color: 'var(--olive)', fontSize: 14, fontWeight: 700,
            letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8
          }}>For Chefs</h2>
          <h3 style={{
            color: 'var(--text)', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 300,
            fontFamily: 'var(--font-display)', marginBottom: 16
          }}>Turn your talent into a thriving business</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Whether you're classically trained or self-taught, Plated Private connects you with clients looking for exactly what you offer. Set your own rates, choose your areas, and build your reputation.
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            {[
              { val: 'R0', label: 'Sign-up cost' },
              { val: '15%', label: 'Platform fee only' },
              { val: 'You', label: 'Set your own rates' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <GoldButton onClick={() => go('/join')} style={{ padding: '16px 44px', fontSize: 16 }}>
            Create Your Chef Profile →
          </GoldButton>
        </div>
      </div>

      {/* ─── Stats ────────────────────────────────────────────── */}
      <div style={{ padding: '56px 24px' }}>
        <div className="grid-stats" style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 32, textAlign: 'center'
        }}>
          {[
            { val: '150+', label: 'Verified Chefs' },
            { val: '2,400+', label: 'Meals Served' },
            { val: '4.8★', label: 'Avg Rating' },
            { val: '9', label: 'Provinces Covered' },
          ].map(s => (
            <div key={s.label}>
              <div style={{
                fontSize: 32, fontWeight: 800, color: 'var(--gold)',
                fontFamily: 'var(--font-display)'
              }}>{s.val}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
