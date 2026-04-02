import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Logo, GoldButton, ChefAvatar } from './UI'
import AuthModal from './AuthModal'

export default function Nav({ currentPath, go }) {
  const { user, profile, isAdmin, isChef, signOut, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login', role: 'client' })

  // Build nav links based on auth state
  const links = [
    { path: '/', label: 'Home' },
    { path: '/chefs', label: 'Browse Chefs' },
    { path: '/book', label: 'Book a Chef' },
  ]
  if (!user || !isChef) links.push({ path: '/join', label: 'Become a Chef' })
  if (isAdmin) links.push({ path: '/admin', label: 'Admin' })

  const openAuth = (mode = 'login', role = 'client') => setAuthModal({ open: true, mode, role })
  const closeAuth = () => setAuthModal({ open: false, mode: 'login', role: 'client' })

  const NavLink = ({ path, label, mobile }) => (
    <button onClick={() => { go(path); if (mobile) setMobileOpen(false) }}
      style={{
        background: currentPath === path ? 'rgba(201,168,76,0.1)' : 'transparent',
        border: 'none', color: currentPath === path ? 'var(--gold)' : 'var(--text-secondary)',
        padding: mobile ? '14px 16px' : '8px 16px',
        borderRadius: 'var(--radius-sm)', fontSize: mobile ? 15 : 13,
        fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
        textAlign: mobile ? 'left' : 'center', width: mobile ? '100%' : 'auto'
      }}>
      {label}
    </button>
  )

  return (
    <>
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
          <Logo size="sm" onClick={() => go('/')} />

          {/* Desktop nav */}
          <div className="nav-desktop" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {links.map(l => <NavLink key={l.path} {...l} />)}

            {/* Auth section */}
            {!loading && (
              user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                    background: 'linear-gradient(135deg, var(--gold), #8B6914)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#0a0a0a'
                  }}>
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </div>
                  <button onClick={signOut} style={{
                    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#888', padding: '6px 14px', borderRadius: 6,
                    fontSize: 12, cursor: 'pointer'
                  }}>Sign Out</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                  <button onClick={() => openAuth('login')} style={{
                    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ccc', padding: '7px 16px', borderRadius: 6,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer'
                  }}>Sign In</button>
                  <GoldButton onClick={() => openAuth('signup')} style={{ padding: '7px 16px', fontSize: 13 }}>
                    Sign Up
                  </GoldButton>
                </div>
              )
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="nav-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'none', border: 'none', color: 'var(--gold)',
              fontSize: 26, cursor: 'pointer', display: 'none',
              width: 40, height: 40, alignItems: 'center', justifyContent: 'center'
            }}>
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
            {links.map(l => <NavLink key={l.path} {...l} mobile />)}
            {!loading && !user && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => { openAuth('login'); setMobileOpen(false) }} style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-input)',
                  color: '#ccc', padding: '12px', borderRadius: 8, fontSize: 14, cursor: 'pointer'
                }}>Sign In</button>
                <GoldButton onClick={() => { openAuth('signup'); setMobileOpen(false) }} style={{ flex: 1, padding: '12px' }}>
                  Sign Up
                </GoldButton>
              </div>
            )}
            {!loading && user && (
              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 8, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#888', fontSize: 13 }}>
                  {profile?.first_name} {profile?.last_name}
                </span>
                <button onClick={() => { signOut(); setMobileOpen(false) }} style={{
                  background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#888', padding: '6px 14px', borderRadius: 6,
                  fontSize: 12, cursor: 'pointer'
                }}>Sign Out</button>
              </div>
            )}
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={authModal.open}
        onClose={closeAuth}
        defaultMode={authModal.mode}
        defaultRole={authModal.role}
      />
    </>
  )
}
