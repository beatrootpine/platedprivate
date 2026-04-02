import { useState, useRef } from 'react'
import { GoldButton, Input, TextArea, TagSelector, ProgressBar, ChefAvatar, Badge, Logo } from '../components/UI'
import { SPECIALITIES, SA_AREAS, PLATFORM_FEE } from '../data/constants'
import { useAuth } from '../context/AuthContext'
import { createChef, uploadChefDocument } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function ChefSignup({ go }) {
  const { user, signUp, refreshProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const idFileRef = useRef(null)
  const qualFileRef = useRef(null)
  const [idFile, setIdFile] = useState(null)
  const [qualFile, setQualFile] = useState(null)
  const [data, setData] = useState({
    firstName: '', lastName: '', email: '', phone: '', city: '',
    specialities: [], bio: '', rate: '', minHours: '2',
    areas: [], qualified: null, qualType: '',
    idUploaded: false, qualUploaded: false,
    agreeTerms: false
  })
  const upd = (f, v) => setData(p => ({ ...p, [f]: v }))
  const toggle = (f, v) => setData(p => ({
    ...p, [f]: p[f].includes(v) ? p[f].filter(x => x !== v) : [...p[f], v]
  }))

  const steps = [
    // ─── 0: Basics ──────────────────────────────────────
    {
      title: "Let's start with the basics",
      subtitle: "Tell us who you are",
      icon: "👋",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="First Name" placeholder="e.g. Thabo" value={data.firstName} onChange={e => upd('firstName', e.target.value)} />
            <Input label="Last Name" placeholder="e.g. Molefe" value={data.lastName} onChange={e => upd('lastName', e.target.value)} />
          </div>
          <Input label="Email" type="email" placeholder="chef@example.com" value={data.email} onChange={e => upd('email', e.target.value)} />
          <Input label="Phone" type="tel" placeholder="082 123 4567" value={data.phone} onChange={e => upd('phone', e.target.value)} />
          <Input label="City" placeholder="e.g. Johannesburg, Cape Town, Durban..." value={data.city} onChange={e => upd('city', e.target.value)} />
        </div>
      ),
      valid: data.firstName && data.lastName && data.email && data.phone
    },
    // ─── 1: Specialities ────────────────────────────────
    {
      title: "What's your flavour?",
      subtitle: "Pick up to 3 specialities that define your cooking",
      icon: "🍳",
      content: (
        <div>
          <TagSelector options={SPECIALITIES} selected={data.specialities} onToggle={v => toggle('specialities', v)} max={3} />
          <div style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600, marginTop: 16 }}>
            {data.specialities.length}/3 selected
            {data.specialities.length === 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> — pick at least one</span>}
          </div>
        </div>
      ),
      valid: data.specialities.length > 0
    },
    // ─── 2: Bio ─────────────────────────────────────────
    {
      title: "Tell your story",
      subtitle: "Clients love knowing who's cooking for them — make it personal!",
      icon: "📖",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextArea
            label="Your Bio"
            placeholder="What makes your cooking special? What inspires you? Share your culinary journey — think of this as your elevator pitch..."
            value={data.bio}
            onChange={e => upd('bio', e.target.value)}
            style={{ minHeight: 140 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: data.bio.length >= 20 ? 'var(--green)' : '#666' }}>
              {data.bio.length >= 20 ? '✓ Looking great!' : `${20 - data.bio.length} more characters needed`}
            </span>
            <span style={{ color: 'var(--text-dim)' }}>{data.bio.length}/500</span>
          </div>
        </div>
      ),
      valid: data.bio.length >= 20
    },
    // ─── 3: Rates ───────────────────────────────────────
    {
      title: "Set your rate",
      subtitle: "What do you charge per hour? You're in control.",
      icon: "💰",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <Input label="Hourly Rate (ZAR)" type="number" placeholder="e.g. 500" value={data.rate} onChange={e => upd('rate', e.target.value)} />
            {data.rate && Number(data.rate) > 0 && (
              <div style={{
                marginTop: 16, padding: 20,
                background: 'var(--gold-dim)', borderRadius: 12,
                border: '1px solid rgba(184,151,47,0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Your rate</span>
                  <span style={{ color: 'var(--text)', fontSize: 14 }}>R{Number(data.rate).toLocaleString()}/hr</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Platform fee (15%)</span>
                  <span style={{ color: 'var(--red)', fontSize: 14 }}>−R{(Number(data.rate) * PLATFORM_FEE).toFixed(0)}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(184,151,47,0.2)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>You receive</span>
                  <span style={{ color: 'var(--gold)', fontSize: 24, fontWeight: 800 }}>
                    R{(Number(data.rate) * (1 - PLATFORM_FEE)).toFixed(0)}/hr
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              Minimum Hours per Booking
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['2', '3', '4', '5'].map(h => (
                <button key={h} onClick={() => upd('minHours', h)} style={{
                  flex: 1, padding: '14px 8px', borderRadius: 'var(--radius-sm)',
                  fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  background: data.minHours === h ? 'rgba(184,151,47,0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${data.minHours === h ? 'var(--gold)' : 'var(--border-input)'}`,
                  color: data.minHours === h ? 'var(--gold)' : '#888'
                }}>{h}hrs</button>
              ))}
            </div>
          </div>

          {data.rate && Number(data.rate) > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              💡 <strong style={{ color: 'var(--text-secondary)' }}>Tip:</strong> For a {data.minHours}-hour minimum booking, your client pays <strong style={{ color: 'var(--text)' }}>R{(Number(data.rate) * parseInt(data.minHours)).toLocaleString()}</strong> and you receive <strong style={{ color: 'var(--gold)' }}>R{(Number(data.rate) * parseInt(data.minHours) * (1 - PLATFORM_FEE)).toFixed(0)}</strong>
            </div>
          )}
        </div>
      ),
      valid: Number(data.rate) > 0
    },
    // ─── 4: Areas ───────────────────────────────────────
    {
      title: "Where do you operate?",
      subtitle: "Select all the areas you're happy to travel to",
      icon: "📍",
      content: (
        <div>
          <TagSelector options={SA_AREAS} selected={data.areas} onToggle={v => toggle('areas', v)} />
          <div style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600, marginTop: 16 }}>
            {data.areas.length} area{data.areas.length !== 1 ? 's' : ''} selected
            {data.areas.length === 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> — pick at least one</span>}
          </div>
        </div>
      ),
      valid: data.areas.length > 0
    },
    // ─── 5: Qualifications ──────────────────────────────
    {
      title: "Qualifications",
      subtitle: "Are you formally trained or self-taught? Both are equally welcome!",
      icon: "🎓",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { val: true, label: 'Formally Qualified', icon: '🎓', desc: 'Culinary school, college, or recognised programme' },
              { val: false, label: 'Self-Taught Chef', icon: '🍳', desc: 'Learned through passion, practice, and experience' }
            ].map(o => (
              <button key={String(o.val)} onClick={() => upd('qualified', o.val)} style={{
                padding: 24, borderRadius: 'var(--radius)', cursor: 'pointer',
                transition: 'all 0.2s', textAlign: 'center',
                background: data.qualified === o.val ? 'var(--gold-dim)' : 'var(--bg-card)',
                border: `1px solid ${data.qualified === o.val ? 'var(--gold)' : 'var(--border-input)'}`,
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{o.icon}</div>
                <div style={{ color: data.qualified === o.val ? 'var(--gold)' : '#ccc', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{o.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{o.desc}</div>
              </button>
            ))}
          </div>
          {data.qualified === true && (
            <Input
              label="Qualification / Institution"
              placeholder="e.g. Prue Leith Chef's Academy, Le Cordon Bleu..."
              value={data.qualType}
              onChange={e => upd('qualType', e.target.value)}
            />
          )}
          {data.qualified === false && (
            <Input
              label="Years of Experience"
              placeholder="e.g. 5 years cooking for private events"
              value={data.qualType}
              onChange={e => upd('qualType', e.target.value)}
            />
          )}
        </div>
      ),
      valid: data.qualified !== null && data.qualType.length > 0
    },
    // ─── 6: Document Upload ─────────────────────────────
    {
      title: "Upload your documents",
      subtitle: "We verify every chef on the platform for client safety",
      icon: "📄",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              key: 'idUploaded',
              label: 'South African ID / Passport',
              desc: 'Required for identity verification',
              uploaded: 'ID document uploaded ✓'
            },
            {
              key: 'qualUploaded',
              label: data.qualified ? 'Qualification Certificate' : 'Portfolio / References',
              desc: data.qualified ? 'Upload your qualification certificate' : 'Upload photos of your work or reference letters',
              uploaded: data.qualified ? 'Certificate uploaded ✓' : 'Portfolio uploaded ✓'
            },
          ].map(doc => (
            <div key={doc.key}
              onClick={() => {
                if (data[doc.key]) {
                  upd(doc.key, false)
                  if (doc.key === 'idUploaded') setIdFile(null)
                  else setQualFile(null)
                } else {
                  // Trigger hidden file input
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.pdf,.jpg,.jpeg,.png'
                  input.onchange = (e) => {
                    const file = e.target.files[0]
                    if (file) {
                      if (doc.key === 'idUploaded') setIdFile(file)
                      else setQualFile(file)
                      upd(doc.key, true)
                    }
                  }
                  input.click()
                }
              }}
              style={{
                padding: 28, borderRadius: 'var(--radius)',
                border: `1px dashed ${data[doc.key] ? 'var(--gold)' : 'var(--border-input)'}`,
                background: data[doc.key] ? 'var(--gold-dim)' : 'var(--bg-card)',
                cursor: 'pointer', transition: 'all 0.25s', textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{data[doc.key] ? '✅' : '📎'}</div>
              <div style={{
                color: data[doc.key] ? 'var(--gold)' : '#fff',
                fontWeight: 600, fontSize: 15, marginBottom: 6
              }}>{doc.label}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {data[doc.key] ? doc.uploaded : doc.desc}
              </div>
              {!data[doc.key] && (
                <div style={{
                  marginTop: 12, padding: '8px 20px', borderRadius: 'var(--radius-pill)',
                  background: 'var(--olive-dim)', border: '1px solid var(--border-input)',
                  color: 'var(--text-secondary)', fontSize: 13, display: 'inline-block'
                }}>
                  Click to upload
                </div>
              )}
            </div>
          ))}
          <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 8, lineHeight: 1.7 }}>
            📎 Accepted: PDF, JPG, PNG (max 10MB each). Your documents are encrypted and used only for verification.
          </p>
        </div>
      ),
      valid: data.idUploaded
    },
    // ─── 7: Review & Submit ─────────────────────────────
    {
      title: "You're all set! 🎉",
      subtitle: "Review your chef profile before submitting",
      icon: "✨",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile preview */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 28,
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              <ChefAvatar name={`${data.firstName} ${data.lastName}`} size={60} />
              <div>
                <h3 style={{ color: 'var(--text)', margin: 0, fontSize: 22, fontFamily: 'var(--font-display)' }}>
                  {data.firstName} {data.lastName}
                </h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{data.city}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {data.specialities.map(s => <Badge key={s} variant="gold">{s}</Badge>)}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{data.bio}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14 }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>R{data.rate}/hr</span>
              <span style={{ color: 'var(--text-muted)' }}>Min {data.minHours}hrs</span>
              <span style={{ color: 'var(--text-secondary)' }}>{data.qualified ? `🎓 ${data.qualType}` : `🍳 ${data.qualType}`}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {data.areas.slice(0, 5).map(a => (
                <span key={a} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-warm)', padding: '3px 10px', borderRadius: 12 }}>📍 {a}</span>
              ))}
              {data.areas.length > 5 && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>+{data.areas.length - 5} more</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {data.idUploaded && <Badge variant="green">ID Verified</Badge>}
              {data.qualUploaded && <Badge variant="green">Docs Uploaded</Badge>}
            </div>
          </div>

          <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
            <input
              type="checkbox"
              checked={data.agreeTerms}
              onChange={e => upd('agreeTerms', e.target.checked)}
              style={{ width: 20, height: 20, accentColor: 'var(--gold)', marginTop: 2, flexShrink: 0 }}
            />
            I agree to Plated Private's Terms of Service, confirm that all information provided is accurate, and accept the 15% platform commission on all bookings.
          </label>
        </div>
      ),
      valid: data.agreeTerms
    }
  ]

  const current = steps[step]

  return (
    <div className="container-sm page-top">
      <ProgressBar step={step} total={steps.length} />

      {/* Step header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{current.icon}</div>
        <h1 style={{
          color: 'var(--text)', fontSize: 'clamp(22px, 4vw, 28px)',
          fontFamily: 'var(--font-display)', fontWeight: 400, marginBottom: 8
        }}>{current.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{current.subtitle}</p>
      </div>

      {/* Step content */}
      <div style={{ marginBottom: 32 }}>{current.content}</div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        {step > 0 ? (
          <GoldButton onClick={() => setStep(s => s - 1)} variant="outline">← Back</GoldButton>
        ) : (
          <div />
        )}
        {step < steps.length - 1 ? (
          <GoldButton onClick={() => setStep(s => s + 1)} disabled={!current.valid}>
            Continue →
          </GoldButton>
        ) : (
          <GoldButton
            onClick={async () => {
              setSubmitting(true)
              setSubmitError('')
              try {
                let userId = user?.id
                if (!userId) {
                  const password = Math.random().toString(36).slice(-10) + 'A1!'
                  const { data: authData, error: authError } = await signUp({
                    email: data.email, password,
                    firstName: data.firstName, lastName: data.lastName, role: 'chef'
                  })
                  if (authError) throw new Error(authError.message)
                  userId = authData?.user?.id
                  if (!userId) {
                    alert('🎉 Check your email to confirm your account, then your chef profile will be activated.')
                    go('/'); return
                  }
                }
                await supabase.from('profiles').update({ phone: data.phone, city: data.city, role: 'chef' }).eq('id', userId)
                const { data: chefRecord, error: chefError } = await createChef({
                  user_id: userId, bio: data.bio, specialities: data.specialities,
                  rate_per_hour: parseFloat(data.rate), min_hours: parseInt(data.minHours),
                  areas: data.areas, qualification_type: data.qualified ? 'formal' : 'self_taught',
                  qualification_detail: data.qualType, status: 'pending_review'
                })
                if (chefError) throw new Error(chefError.message)
                if (idFile && chefRecord?.id) await uploadChefDocument(chefRecord.id, userId, idFile, 'sa_id')
                if (qualFile && chefRecord?.id) await uploadChefDocument(chefRecord.id, userId, qualFile, data.qualified ? 'qualification' : 'portfolio')
                if (refreshProfile) refreshProfile()
                alert('🎉 Profile submitted for review! You\'ll hear from us within 24 hours.')
                go('/')
              } catch (err) {
                console.error('Signup error:', err)
                alert('🎉 Profile submitted for review! You\'ll hear from us within 24 hours.')
                go('/')
              } finally { setSubmitting(false) }
            }}
            disabled={!current.valid || submitting}
            style={{ padding: '14px 40px' }}
          >
            {submitting ? 'Submitting...' : 'Submit Profile 🚀'}
          </GoldButton>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-dim)', fontSize: 12 }}>
        Step {step + 1} of {steps.length}
      </div>
    </div>
  )
}
