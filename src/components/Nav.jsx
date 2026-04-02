import { useState } from 'react'
import { Logo, GoldButton } from './UI'

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/chefs', label: 'Browse Chefs' },
  { path: '/book', label: 'Book a Chef' },
  { path: '/join', label: 'Become a Chef' },
  { path: '/admin', label: 'Admin' },
]

export default function Nav({ currentPath, go }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-light)'
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 'var(--nav-height)'
      }}>
        {/* Logo — actual PNG */}
        <Logo size="sm" onClick={() => go('/')} />

        {/* Desktop nav */}
        <div className="nav-desktop" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {NAV_LINKS.map(l => (
            <button key={l.path} onClick={() => go(l.path)}
              style={{
                background: currentPath === l.path ? 'rgba(201,168,76,0.1)' : 'transparent',
                border: 'none', color: currentPath === l.path ? 'var(--gold)' : 'var(--text-secondary)',
                padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13,
                fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button className="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: 'none', border: 'none', color: 'var(--gold)',
            fontSize: 26, cursor: 'pointer', display: 'none',
            width: 40, height: 40, alignItems: 'center', justifyContent: 'center'
          }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="nav-mobile-menu" style={{
          background: 'rgba(10,10,10,0.98)',
          borderTop: '1px solid var(--border-light)',
          padding: 16, display: 'flex', flexDirection: 'column', gap: 4
        }}>
          {NAV_LINKS.map(l => (
            <button key={l.path}
              onClick={() => { go(l.path); setMobileOpen(false) }}
              style={{
                background: currentPath === l.path ? 'rgba(201,168,76,0.1)' : 'transparent',
                border: 'none', color: currentPath === l.path ? 'var(--gold)' : 'var(--text-secondary)',
                padding: '14px 16px', borderRadius: 'var(--radius-sm)', fontSize: 15,
                fontWeight: 500, cursor: 'pointer', textAlign: 'left'
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
