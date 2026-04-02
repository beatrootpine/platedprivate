import { useState } from 'react'
import { GoldButton, Input, TextArea, Badge } from './UI'

const CATEGORIES = [
  { key: 'protein', label: '🥩 Protein', color: '#8B4A3A' },
  { key: 'produce', label: '🥬 Produce', color: '#4E8B3A' },
  { key: 'dairy', label: '🧀 Dairy', color: '#B8972F' },
  { key: 'pantry', label: '🫙 Pantry', color: '#8B7A3D' },
  { key: 'beverage', label: '🍷 Beverage', color: '#6B3A8B' },
  { key: 'other', label: '📦 Other', color: '#5E5E4A' },
]

const STATUS_LABELS = {
  draft: { label: 'Draft', variant: 'grey' },
  submitted: { label: 'Awaiting Approval', variant: 'gold' },
  approved: { label: 'Approved', variant: 'green' },
  revision_requested: { label: 'Revision Requested', variant: 'red' },
  revised: { label: 'Revised', variant: 'blue' },
}

// ─── Cost Breakdown Display (shared by both chef and client) ─────
const CostBreakdown = ({ estimate, items, chefRate, hours, platformFee = 0.15 }) => {
  const serviceTotal = chefRate * hours
  const commission = serviceTotal * platformFee
  const extrasTotal = estimate?.extras_subtotal || (
    (estimate?.ingredients_total || 0) +
    (estimate?.travel_fee || 0) +
    (estimate?.equipment_fee || 0) +
    (estimate?.other_fees || 0)
  )
  const grandTotal = serviceTotal + extrasTotal

  const groupedItems = (items || []).reduce((acc, item) => {
    const cat = item.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Chef Service Fee */}
      <div style={{
        background: 'var(--bg-warm)', borderRadius: 'var(--radius)',
        padding: 20, border: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
          Chef Service Fee
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
          <span style={{ color: 'var(--text-secondary)' }}>R{chefRate}/hr × {hours} hours</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>R{serviceTotal.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Platform fee (15%)</span>
          <span>R{commission.toFixed(0)}</span>
        </div>
      </div>

      {/* Ingredients (itemized) */}
      {Object.keys(groupedItems).length > 0 && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          padding: 20, border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            🛒 Ingredients & Shopping List
          </div>
          {Object.entries(groupedItems).map(([cat, catItems]) => {
            const catInfo = CATEGORIES.find(c => c.key === cat) || CATEGORIES[CATEGORIES.length - 1]
            const catTotal = catItems.reduce((a, i) => a + (i.estimated_cost || 0), 0)
            return (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{catInfo.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>R{catTotal.toLocaleString()}</span>
                </div>
                {catItems.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13
                  }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: 'var(--text)' }}>{item.item_name}</span>
                      {item.quantity && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>({item.quantity})</span>}
                      {item.notes && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{item.notes}</div>}
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 12 }}>R{(item.estimated_cost || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Fixed Extras */}
      {((estimate?.travel_fee || 0) > 0 || (estimate?.equipment_fee || 0) > 0 || (estimate?.other_fees || 0) > 0) && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          padding: 20, border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Additional Costs
          </div>
          {estimate?.travel_fee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>🚗 Travel</span>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>R{estimate.travel_fee.toLocaleString()}</span>
            </div>
          )}
          {estimate?.equipment_fee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>🍳 Equipment hire</span>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>R{estimate.equipment_fee.toLocaleString()}</span>
            </div>
          )}
          {estimate?.other_fees > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>📦 {estimate.other_fees_description || 'Other'}</span>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>R{estimate.other_fees.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Chef notes */}
      {estimate?.chef_notes && (
        <div style={{ background: 'var(--gold-dim)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--gold-border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>CHEF'S NOTE</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{estimate.chef_notes}</p>
        </div>
      )}

      {/* Grand Total */}
      <div style={{
        background: 'var(--olive-dim)', borderRadius: 'var(--radius)',
        padding: 20, border: '1px solid var(--olive-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Chef service</span>
          <span style={{ color: 'var(--text)' }}>R{serviceTotal.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Ingredients & extras</span>
          <span style={{ color: 'var(--text)' }}>R{extrasTotal.toLocaleString()}</span>
        </div>
        <div style={{ borderTop: '1px solid var(--olive-border)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>Total</span>
          <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 28, fontFamily: 'var(--font-display)' }}>
            R{grandTotal.toLocaleString()}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          💡 Platform fee (15%) applies only to chef service fee, not to ingredients or extras.
        </div>
      </div>
    </div>
  )
}

// ─── Chef: Build Estimate ────────────────────────────────────────
export const ChefEstimateBuilder = ({ booking, onSubmit }) => {
  const [items, setItems] = useState([])
  const [travel, setTravel] = useState('')
  const [equipment, setEquipment] = useState('')
  const [otherFees, setOtherFees] = useState('')
  const [otherDesc, setOtherDesc] = useState('')
  const [notes, setNotes] = useState('')
  const [newItem, setNewItem] = useState({ name: '', quantity: '', cost: '', category: 'produce', notes: '' })

  const addItem = () => {
    if (!newItem.name || !newItem.cost) return
    setItems(prev => [...prev, { ...newItem, id: Date.now(), estimated_cost: parseFloat(newItem.cost) }])
    setNewItem({ name: '', quantity: '', cost: '', category: 'produce', notes: '' })
  }

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const ingredientsTotal = items.reduce((a, i) => a + (i.estimated_cost || 0), 0)

  const estimate = {
    ingredients_total: ingredientsTotal,
    travel_fee: parseFloat(travel) || 0,
    equipment_fee: parseFloat(equipment) || 0,
    other_fees: parseFloat(otherFees) || 0,
    other_fees_description: otherDesc,
    chef_notes: notes,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--text)', fontSize: 18, fontWeight: 600 }}>Build Cost Estimate</h3>
        <Badge variant="grey">Ref: {booking?.booking_ref}</Badge>
      </div>

      {/* Add ingredient */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius)',
        padding: 20, border: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
          Add Ingredient
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setNewItem(p => ({ ...p, category: c.key }))}
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: 12,
                fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                background: newItem.category === c.key ? 'var(--gold-dim)' : 'transparent',
                border: `1px solid ${newItem.category === c.key ? 'var(--gold-border)' : 'var(--border-input)'}`,
                color: newItem.category === c.key ? 'var(--gold)' : 'var(--text-muted)'
              }}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
          <Input placeholder="Item name" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
          <Input placeholder="Qty (e.g. 2kg)" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} />
          <Input placeholder="Cost (R)" type="number" value={newItem.cost} onChange={e => setNewItem(p => ({ ...p, cost: e.target.value }))} />
        </div>
        <GoldButton onClick={addItem} disabled={!newItem.name || !newItem.cost}
          style={{ marginTop: 12, padding: '10px 20px', fontSize: 13 }}>
          + Add Item
        </GoldButton>
      </div>

      {/* Item list */}
      {items.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          padding: 20, border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Shopping List ({items.length} items · R{ingredientsTotal.toLocaleString()})
          </div>
          {items.map(item => {
            const catInfo = CATEGORIES.find(c => c.key === item.category) || CATEGORIES[CATEGORIES.length - 1]
            return (
              <div key={item.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{catInfo.label.split(' ')[0]}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{item.name}</span>
                  {item.quantity && <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>({item.quantity})</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>R{item.estimated_cost}</span>
                  <button onClick={() => removeItem(item.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Fixed costs */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius)',
        padding: 20, border: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
          Additional Costs
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="🚗 Travel (R)" type="number" placeholder="0" value={travel} onChange={e => setTravel(e.target.value)} />
          <Input label="🍳 Equipment (R)" type="number" placeholder="0" value={equipment} onChange={e => setEquipment(e.target.value)} />
          <Input label="📦 Other (R)" type="number" placeholder="0" value={otherFees} onChange={e => setOtherFees(e.target.value)} />
          <Input label="Other Description" placeholder="e.g. Specialist platters" value={otherDesc} onChange={e => setOtherDesc(e.target.value)} />
        </div>
      </div>

      {/* Notes */}
      <TextArea label="Notes to Client" placeholder="Any notes about ingredients, substitutions, or the menu plan..." value={notes} onChange={e => setNotes(e.target.value)} />

      {/* Preview */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
          Preview — What the Client Will See
        </div>
        <CostBreakdown
          estimate={estimate}
          items={items}
          chefRate={booking?.rate_per_hour || booking?.rate || 0}
          hours={booking?.hours || 3}
        />
      </div>

      <GoldButton
        onClick={() => onSubmit && onSubmit({ estimate, items })}
        disabled={items.length === 0}
        style={{ width: '100%', padding: '16px 28px', fontSize: 16 }}
      >
        Submit Estimate to Client →
      </GoldButton>
    </div>
  )
}

// ─── Client: Review & Approve Estimate ───────────────────────────
export const ClientEstimateReview = ({ estimate, items, booking, onApprove, onRequestRevision }) => {
  const [revisionNotes, setRevisionNotes] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const status = STATUS_LABELS[estimate?.status] || STATUS_LABELS.draft

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--text)', fontSize: 18, fontWeight: 600 }}>Cost Estimate</h3>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <CostBreakdown
        estimate={estimate}
        items={items}
        chefRate={booking?.rate_per_hour || booking?.rate || 0}
        hours={booking?.hours || 3}
      />

      {/* Client notes from chef */}
      {estimate?.client_notes && (
        <div style={{ background: 'var(--red-bg)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--red-border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>YOUR PREVIOUS NOTE</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{estimate.client_notes}</p>
        </div>
      )}

      {/* Action buttons */}
      {(estimate?.status === 'submitted' || estimate?.status === 'revised') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GoldButton onClick={onApprove} style={{ width: '100%', padding: '16px 28px', fontSize: 16 }}>
            ✓ Approve Estimate
          </GoldButton>

          {!showRevisionForm ? (
            <GoldButton onClick={() => setShowRevisionForm(true)} variant="outline" style={{ width: '100%' }}>
              Request Changes
            </GoldButton>
          ) : (
            <div style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius)',
              padding: 20, border: '1px solid var(--border)'
            }}>
              <TextArea
                label="What would you like changed?"
                placeholder="e.g. Can we substitute the lamb for chicken? Can you use a cheaper wine? Travel seems high — I'm only 10 min away..."
                value={revisionNotes}
                onChange={e => setRevisionNotes(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <GoldButton
                  onClick={() => { onRequestRevision(revisionNotes); setShowRevisionForm(false); setRevisionNotes('') }}
                  disabled={!revisionNotes}
                  style={{ padding: '10px 20px', fontSize: 13 }}
                >
                  Send Revision Request
                </GoldButton>
                <GoldButton onClick={() => setShowRevisionForm(false)} variant="outline" style={{ padding: '10px 20px', fontSize: 13 }}>
                  Cancel
                </GoldButton>
              </div>
            </div>
          )}
        </div>
      )}

      {estimate?.status === 'approved' && (
        <div style={{
          textAlign: 'center', padding: 20, background: 'var(--green-bg)',
          borderRadius: 'var(--radius)', border: '1px solid var(--green-border)'
        }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>✅</div>
          <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: 14 }}>Estimate Approved</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            Your chef will now prepare for your event
          </div>
        </div>
      )}
    </div>
  )
}

export { CostBreakdown }
export default CostBreakdown
