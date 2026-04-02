// Transforms Supabase chef + profile join data into the shape our UI components expect
export function normalizeChef(row) {
  if (!row) return null
  const p = row.profiles || {}
  return {
    id: row.id,
    user_id: row.user_id,
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Chef',
    avatar_url: p.avatar_url,
    city: p.city,
    email: p.email,
    phone: p.phone,
    bio: row.bio || '',
    speciality: row.specialities || [],
    rate: row.rate_per_hour || 0,
    minHours: row.min_hours || 2,
    areas: row.areas || [],
    qualified: row.qualification_type === 'formal',
    qualType: row.qualification_detail || (row.qualification_type === 'formal' ? 'Qualified' : 'Self-Taught'),
    rating: parseFloat(row.rating_avg) || 0,
    reviews: row.rating_count || 0,
    verified: row.is_verified || false,
    available: row.is_available !== false,
    status: row.status || 'active',
  }
}

// Normalize chef from match_chefs RPC (slightly different shape)
export function normalizeMatchedChef(row) {
  if (!row) return null
  return {
    id: row.chef_id,
    user_id: row.user_id,
    name: row.name || 'Chef',
    avatar_url: row.avatar_url,
    bio: row.bio || '',
    speciality: row.specialities || [],
    rate: row.rate_per_hour || 0,
    minHours: row.min_hours || 2,
    areas: row.areas || [],
    qualified: row.qualification_type === 'formal',
    qualType: row.qualification_detail || 'Self-Taught',
    rating: parseFloat(row.rating_avg) || 0,
    reviews: row.rating_count || 0,
    verified: row.is_verified || false,
    available: true,
    matchScore: row.match_score || 0,
  }
}

// Normalize admin chef view
export function normalizeAdminChef(row) {
  if (!row) return null
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name || 'Chef',
    email: row.email,
    phone: row.phone,
    speciality: row.specialities || [],
    rate: row.rate_per_hour || 0,
    minHours: row.min_hours || 2,
    areas: row.areas || [],
    qualified: row.qualification_type === 'formal',
    qualType: row.qualification_detail || 'Self-Taught',
    rating: parseFloat(row.rating_avg) || 0,
    reviews: row.rating_count || 0,
    verified: row.is_verified || false,
    available: row.is_available !== false,
    status: row.status || 'pending_review',
    totalBookings: row.total_bookings || 0,
    approvedDocs: row.approved_docs || 0,
    pendingDocs: row.pending_docs || 0,
  }
}
