import { useState, useEffect } from 'react'
import { Input, ChefCard, Badge } from '../components/UI'
import { MOCK_CHEFS, SPECIALITIES } from '../data/constants'
import { getActiveChefs } from '../lib/api'
import { normalizeChef } from '../lib/helpers'

export default function BrowseChefsPage() {
  const [search, setSearch] = useState('')
  const [areaSearch, setAreaSearch] = useState('')
  const [activeSpec, setActiveSpec] = useState(null)
  const [chefs, setChefs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChefs() {
      const { data, error } = await getActiveChefs()
      if (!error && data?.length > 0) {
        setChefs(data.map(normalizeChef))
      } else {
        // Fallback to mock data
        setChefs(MOCK_CHEFS)
      }
      setLoading(false)
    }
    fetchChefs()
  }, [])

  const filtered = chefs.filter(c => {
    if (activeSpec && !c.speciality.includes(activeSpec)) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.speciality.some(s => s.toLowerCase().includes(search.toLowerCase()))) return false
    if (areaSearch && !c.areas.some(a => a.toLowerCase().includes(areaSearch.toLowerCase()))) return false
    return true
  })

  return (
    <div className="container page-top">
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          color: 'var(--text)', fontSize: 'clamp(28px, 4vw, 36px)',
          fontFamily: 'var(--font-display)', fontWeight: 300, marginBottom: 8
        }}>Browse Chefs</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          Discover South Africa's finest private chefs — {chefs.filter(c => c.available).length} currently available
        </p>
      </div>

      {/* Search bar */}
      <div className="grid-2col" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 12, marginBottom: 20
      }}>
        <Input
          placeholder="Search by name or cuisine..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Input
          placeholder="Filter by area (e.g. Sandton)..."
          value={areaSearch}
          onChange={e => setAreaSearch(e.target.value)}
        />
      </div>

      {/* Quick cuisine filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 32 }}>
        <button onClick={() => setActiveSpec(null)} style={{
          padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: 12,
          fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
          border: '1px solid', background: !activeSpec ? 'rgba(184,151,47,0.2)' : 'transparent',
          borderColor: !activeSpec ? 'var(--gold)' : 'var(--border-input)',
          color: !activeSpec ? 'var(--gold)' : '#888'
        }}>All</button>
        {SPECIALITIES.slice(0, 8).map(s => (
          <button key={s} onClick={() => setActiveSpec(activeSpec === s ? null : s)} style={{
            padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: 12,
            fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
            border: '1px solid', background: activeSpec === s ? 'rgba(184,151,47,0.2)' : 'transparent',
            borderColor: activeSpec === s ? 'var(--gold)' : 'var(--border-input)',
            color: activeSpec === s ? 'var(--gold)' : '#888'
          }}>{s}</button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        Showing {filtered.length} chef{filtered.length !== 1 ? 's' : ''}
        {(search || areaSearch || activeSpec) && (
          <button onClick={() => { setSearch(''); setAreaSearch(''); setActiveSpec(null) }}
            style={{
              background: 'none', border: 'none', color: 'var(--gold)',
              cursor: 'pointer', fontSize: 12, marginLeft: 8
            }}>
            Clear filters ✕
          </button>
        )}
      </div>

      {/* Chef grid */}
      <div className="grid-chefs" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 24
      }}>
        {filtered.map(c => <ChefCard key={c.id} chef={c} />)}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h3 style={{ color: 'var(--text)', fontWeight: 400, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            No chefs found
          </h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  )
}
