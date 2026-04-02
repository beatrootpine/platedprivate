import { useState } from 'react'

// ─── Logo (uses actual uploaded image) ──────────────────────────────────────
export const Logo = ({ size = 'md', onClick }) => {
  const heights = { sm: 32, md: 44, lg: 72, xl: 100 }
  const h = heights[size] || heights.md
  return (
    <img
      src="/logo.png"
      alt="Plated Private"
      onClick={onClick}
      style={{
        height: h,
        width: 'auto',
        cursor: onClick ? 'pointer' : 'default',
        objectFit: 'contain',
        display: 'block'
      }}
    />
  )
}

// ─── Star Rating ────────────────────────────────────────────────────────────
export const StarRating = ({ rating, size = 14 }) => (
  <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i <= Math.round(rating) ? 'var(--gold)' : '#3a3a3a'}>
        <path d="M10 1l2.39 4.84L17.82 6.9l-3.91 3.81.92 5.39L10 13.48l-4.83 2.62.92-5.39L2.18 6.9l5.43-.79z"/>
      </svg>
    ))}
    <span style={{ color: 'var(--gold)', fontWeight: 600, marginLeft: 4, fontSize: size - 1 }}>{rating}</span>
  </span>
)

// ─── Badge ──────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'gold' }) => {
  const styles = {
    gold:  { background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold-border)' },
    green: { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' },
    red:   { background: 'var(--red-bg)',   color: 'var(--red)',   border: '1px solid var(--red-border)' },
    grey:  { background: 'rgba(255,255,255,0.06)', color: '#999', border: '1px solid rgba(255,255,255,0.1)' },
    blue:  { background: 'var(--blue-bg)',  color: 'var(--blue)',  border: '1px solid var(--blue-border)' },
  }
  return (
    <span style={{
      ...styles[variant],
      padding: '3px 10px', borderRadius: 'var(--radius-pill)',
      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      whiteSpace: 'nowrap', display: 'inline-block'
    }}>
      {children}
    </span>
  )
}

// ─── Gold Button ────────────────────────────────────────────────────────────
export const GoldButton = ({ children, onClick, style = {}, disabled = false, variant = 'filled' }) => {
  const base = variant === 'filled'
    ? { background: disabled ? '#555' : 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#0a0a0a', border: 'none' }
    : { background: 'transparent', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.4)' }
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        ...base, padding: '12px 28px', borderRadius: 'var(--radius-sm)',
        fontWeight: 700, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: 0.5, transition: 'all 0.25s ease', ...style
      }}
      onMouseEnter={e => { if (!disabled) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 20px rgba(201,168,76,0.2)'; }}}
      onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
    >
      {children}
    </button>
  )
}

// ─── Input ──────────────────────────────────────────────────────────────────
export const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</label>}
    <input {...props}
      style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-input)',
        borderRadius: 'var(--radius-sm)', padding: '12px 16px', color: '#fff',
        fontSize: 14, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit',
        ...(props.style || {})
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
    />
  </div>
)

// ─── TextArea ───────────────────────────────────────────────────────────────
export const TextArea = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</label>}
    <textarea {...props}
      style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-input)',
        borderRadius: 'var(--radius-sm)', padding: '12px 16px', color: '#fff',
        fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80,
        fontFamily: 'inherit', transition: 'border-color 0.2s', ...(props.style || {})
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
    />
  </div>
)

// ─── Tag Selector ───────────────────────────────────────────────────────────
export const TagSelector = ({ options, selected, onToggle, max }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {options.map(opt => {
      const active = selected.includes(opt)
      const atMax = max && selected.length >= max && !active
      return (
        <button key={opt} onClick={() => !atMax && onToggle(opt)}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-pill)', fontSize: 13,
            fontWeight: 500, cursor: atMax ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            border: '1px solid',
            ...(active
              ? { background: 'rgba(201,168,76,0.2)', borderColor: 'var(--gold)', color: 'var(--gold)' }
              : { background: 'rgba(255,255,255,0.03)', borderColor: 'var(--border-input)', color: atMax ? '#444' : '#888' })
          }}
        >
          {active && '✓ '}{opt}
        </button>
      )
    })}
  </div>
)

// ─── Chef Avatar ────────────────────────────────────────────────────────────
export const ChefAvatar = ({ name, size = 64 }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const colors = ['#C9A84C', '#8B6914', '#D4A843', '#B8860B', '#DAA520']
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${colors[idx]}, ${colors[(idx+1)%colors.length]})`,
      fontSize: size * 0.35, fontWeight: 800, color: '#0a0a0a', flexShrink: 0, letterSpacing: 1
    }}>
      {initials}
    </div>
  )
}

// ─── Progress Bar ───────────────────────────────────────────────────────────
export const ProgressBar = ({ step, total }) => (
  <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{
        flex: 1, height: 4, borderRadius: 2, transition: 'all 0.4s ease',
        background: i < step ? 'linear-gradient(90deg, var(--gold), var(--gold-light))'
          : i === step ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'
      }} />
    ))}
  </div>
)

// ─── Section Header ─────────────────────────────────────────────────────────
export const SectionHeader = ({ label, title, centered = true }) => (
  <div style={{ textAlign: centered ? 'center' : 'left', marginBottom: 48 }}>
    {label && (
      <div style={{
        color: 'var(--gold)', fontSize: 13, fontWeight: 700,
        letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8
      }}>{label}</div>
    )}
    <h2 style={{
      color: '#fff', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 300,
      fontFamily: 'var(--font-display)', lineHeight: 1.3
    }}>{title}</h2>
  </div>
)

// ─── Chef Profile Card ─────────────────────────────────────────────────────
export const ChefCard = ({ chef, onSelect, showSelect }) => (
  <div
    className="animate-in"
    style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 24, transition: 'all 0.3s',
      cursor: 'default', position: 'relative', overflow: 'hidden'
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    {chef.verified && (
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <Badge variant="green">✓ Verified</Badge>
      </div>
    )}
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
      <ChefAvatar name={chef.name} size={56} />
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>{chef.name}</h3>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {chef.speciality.map(s => <Badge key={s} variant="gold">{s}</Badge>)}
        </div>
      </div>
    </div>
    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' }}>{chef.bio}</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, fontSize: 13, alignItems: 'center' }}>
      <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 15 }}>R{chef.rate}/hr</div>
      <div style={{ color: '#555' }}>·</div>
      <div style={{ color: '#aaa' }}>Min {chef.minHours}hrs</div>
      <div style={{ color: '#555' }}>·</div>
      <div style={{ color: '#aaa' }}>{chef.qualified ? `🎓 ${chef.qualType}` : `🍳 ${chef.qualType}`}</div>
    </div>
    <div style={{ marginBottom: 12 }}>
      <StarRating rating={chef.rating} />
      <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>({chef.reviews} reviews)</span>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {chef.areas.slice(0, 4).map(a => (
        <span key={a} style={{
          fontSize: 11, color: '#666', background: 'rgba(255,255,255,0.04)',
          padding: '3px 10px', borderRadius: 12
        }}>
          📍 {a}
        </span>
      ))}
      {chef.areas.length > 4 && (
        <span style={{ fontSize: 11, color: '#555', padding: '3px 6px' }}>+{chef.areas.length - 4} more</span>
      )}
    </div>
    {showSelect && (
      <GoldButton onClick={() => onSelect(chef)} style={{ width: '100%', marginTop: 20, padding: '14px 28px' }}>
        Select Chef — R{chef.rate}/hr
      </GoldButton>
    )}
  </div>
)
