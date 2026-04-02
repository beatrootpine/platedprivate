import { Logo } from './UI'

export default function Footer({ go }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-light)',
      padding: '48px 24px 40px',
      marginTop: 80
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 40, marginBottom: 40
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <Logo size="sm" onClick={() => go('/')} />
            <p style={{ color: '#666', fontSize: 13, lineHeight: 1.7, marginTop: 16 }}>
              South Africa's premier private chef marketplace. Exceptional dining experiences, delivered to your door.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Platform</h4>
              {[
                { label: 'Browse Chefs', path: '/chefs' },
                { label: 'Book a Chef', path: '/book' },
                { label: 'Become a Chef', path: '/join' },
              ].map(l => (
                <div key={l.path} onClick={() => go(l.path)}
                  style={{ color: '#888', fontSize: 13, marginBottom: 10, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#888'}
                >
                  {l.label}
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Company</h4>
              {['About Us', 'Terms of Service', 'Privacy Policy', 'Contact'].map(l => (
                <div key={l} style={{ color: '#888', fontSize: 13, marginBottom: 10, cursor: 'pointer' }}>{l}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border-light)', paddingTop: 24,
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'center', gap: 12
        }}>
          <p style={{ color: '#555', fontSize: 12 }}>
            © 2026 Branded SA Corporation (Pty) Ltd t/a Plated Private. All rights reserved.
          </p>
          <p style={{ color: '#444', fontSize: 11 }}>
            Built with ♥ in South Africa
          </p>
        </div>
      </div>
    </footer>
  )
}
