import { supabase } from './supabase'

// ─────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────

export async function signUp({ email, password, firstName, lastName, role = 'client' }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, role }
    }
  })
  return { data, error }
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}


// ─────────────────────────────────────────────────────────────────────
// CHEFS
// ─────────────────────────────────────────────────────────────────────

export async function getActiveChefs() {
  const { data, error } = await supabase
    .from('chefs')
    .select(`
      *,
      profiles!chefs_user_id_fkey ( first_name, last_name, email, phone, avatar_url, city )
    `)
    .eq('status', 'active')
    .eq('is_available', true)
    .order('rating_avg', { ascending: false })
  return { data, error }
}

export async function getAllChefs() {
  const { data, error } = await supabase
    .from('chefs')
    .select(`
      *,
      profiles!chefs_user_id_fkey ( first_name, last_name, email, phone, avatar_url, city )
    `)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getChefById(chefId) {
  const { data, error } = await supabase
    .from('chefs')
    .select(`
      *,
      profiles!chefs_user_id_fkey ( first_name, last_name, email, phone, avatar_url, city )
    `)
    .eq('id', chefId)
    .single()
  return { data, error }
}

export async function getChefByUserId(userId) {
  const { data, error } = await supabase
    .from('chefs')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

export async function createChef(chefData) {
  const { data, error } = await supabase
    .from('chefs')
    .insert(chefData)
    .select()
    .single()
  return { data, error }
}

export async function updateChef(chefId, updates) {
  const { data, error } = await supabase
    .from('chefs')
    .update(updates)
    .eq('id', chefId)
    .select()
    .single()
  return { data, error }
}

// Smart chef matching using the database function
export async function matchChefs({ area, cuisines = [], hours = 3, limit = 3 }) {
  const { data, error } = await supabase
    .rpc('match_chefs', {
      p_area: area || '',
      p_cuisines: cuisines,
      p_hours: hours,
      p_limit: limit
    })
  return { data, error }
}

// Fallback: client-side matching if RPC isn't available yet
export async function matchChefsFallback({ area, cuisines = [], hours = 3 }) {
  let query = supabase
    .from('chefs')
    .select(`
      *,
      profiles!chefs_user_id_fkey ( first_name, last_name, avatar_url, city )
    `)
    .eq('status', 'active')
    .eq('is_available', true)
    .lte('min_hours', hours)

  if (area) {
    query = query.contains('areas', [area])
  }

  const { data, error } = await query
    .order('rating_avg', { ascending: false })
    .limit(3)

  return { data, error }
}


// ─────────────────────────────────────────────────────────────────────
// CHEF DOCUMENTS
// ─────────────────────────────────────────────────────────────────────

export async function uploadChefDocument(chefId, userId, file, docType) {
  // Upload file to storage
  const fileExt = file.name.split('.').pop()
  const filePath = `${userId}/${docType}_${Date.now()}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chef-documents')
    .upload(filePath, file, { upsert: false })

  if (uploadError) return { data: null, error: uploadError }

  // Create document record
  const { data, error } = await supabase
    .from('chef_documents')
    .insert({
      chef_id: chefId,
      doc_type: docType,
      file_name: file.name,
      file_url: filePath,
      file_size: file.size,
      mime_type: file.type
    })
    .select()
    .single()

  return { data, error }
}

export async function getChefDocuments(chefId) {
  const { data, error } = await supabase
    .from('chef_documents')
    .select('*')
    .eq('chef_id', chefId)
    .order('uploaded_at', { ascending: false })
  return { data, error }
}

export async function uploadAvatar(userId, file) {
  const fileExt = file.name.split('.').pop()
  const filePath = `${userId}/avatar.${fileExt}`

  const { data, error } = await supabase.storage
    .from('chef-avatars')
    .upload(filePath, file, { upsert: true })

  if (error) return { url: null, error }

  const { data: urlData } = supabase.storage
    .from('chef-avatars')
    .getPublicUrl(filePath)

  // Update profile
  await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', userId)

  return { url: urlData.publicUrl, error: null }
}


// ─────────────────────────────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────────────────────────────

export async function createBooking(bookingData) {
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single()
  return { data, error }
}

export async function getBookingsByClient(clientId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      chefs (
        id, specialities, rate_per_hour,
        profiles!chefs_user_id_fkey ( first_name, last_name, avatar_url )
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getBookingsByChef(chefId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      profiles!bookings_client_id_fkey ( first_name, last_name, email, phone )
    `)
    .eq('chef_id', chefId)
    .order('event_date', { ascending: false })
  return { data, error }
}

export async function updateBookingStatus(bookingId, status) {
  const updates = { status }
  if (status === 'confirmed') updates.confirmed_at = new Date().toISOString()
  if (status === 'completed') updates.completed_at = new Date().toISOString()
  if (status === 'cancelled') updates.cancelled_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select()
    .single()
  return { data, error }
}


// ─────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────

export async function getChefReviews(chefId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles!reviews_client_id_fkey ( first_name, last_name )
    `)
    .eq('chef_id', chefId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createReview(reviewData) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single()
  return { data, error }
}


// ─────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────

export async function getAdminBookings() {
  const { data, error } = await supabase
    .from('admin_bookings_view')
    .select('*')
  return { data, error }
}

export async function getAdminRevenue() {
  const { data, error } = await supabase
    .from('admin_revenue_view')
    .select('*')
    .single()
  return { data, error }
}

export async function getAdminChefs() {
  const { data, error } = await supabase
    .from('admin_chefs_view')
    .select('*')
  return { data, error }
}

export async function suspendChef(chefId, reason = '') {
  const { data, error } = await supabase
    .from('chefs')
    .update({ status: 'suspended', is_available: false, suspended_reason: reason })
    .eq('id', chefId)
    .select()
    .single()
  return { data, error }
}

export async function reactivateChef(chefId) {
  const { data, error } = await supabase
    .from('chefs')
    .update({ status: 'active', is_available: true, suspended_reason: null })
    .eq('id', chefId)
    .select()
    .single()
  return { data, error }
}

export async function removeChef(chefId) {
  const { data, error } = await supabase
    .from('chefs')
    .update({ status: 'removed', is_available: false })
    .eq('id', chefId)
    .select()
    .single()
  return { data, error }
}

export async function approveDocument(docId, reviewerId) {
  const { data, error } = await supabase
    .from('chef_documents')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq('id', docId)
    .select()
    .single()
  return { data, error }
}

export async function rejectDocument(docId, reviewerId, reason) {
  const { data, error } = await supabase
    .from('chef_documents')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: reviewerId, rejection_reason: reason })
    .eq('id', docId)
    .select()
    .single()
  return { data, error }
}


// ─────────────────────────────────────────────────────────────────────
// ADMIN SETUP (claim admin access via setup key)
// ─────────────────────────────────────────────────────────────────────

export async function claimAdmin(setupKey) {
  // Try the Supabase RPC function first
  try {
    const { data, error } = await supabase.rpc('claim_admin', { p_setup_key: setupKey })
    if (!error && data?.success) return { success: true, error: null }
    if (data?.error) return { success: false, error: data.error }
  } catch (e) {
    // RPC not available, try direct update with client-side key check
  }

  // Fallback: client-side key verification + direct profile update
  const expectedKey = import.meta.env.VITE_ADMIN_SETUP_KEY
  if (setupKey !== expectedKey) {
    return { success: false, error: 'Invalid setup key' }
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return { success: false, error: 'Please sign in first' }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', session.user.id)

  if (error) return { success: false, error: error.message }
  return { success: true, error: null }
}


// ─────────────────────────────────────────────────────────────────────
// BOOKING ESTIMATES (ingredients, travel, extras)
// ─────────────────────────────────────────────────────────────────────

export async function getEstimateByBooking(bookingId) {
  const { data, error } = await supabase
    .from('booking_estimates')
    .select('*')
    .eq('booking_id', bookingId)
    .order('revision_number', { ascending: false })
    .limit(1)
    .single()
  return { data, error }
}

export async function getEstimateItems(estimateId) {
  const { data, error } = await supabase
    .from('estimate_items')
    .select('*')
    .eq('estimate_id', estimateId)
    .order('sort_order')
  return { data, error }
}

export async function createEstimate(estimateData) {
  const { data, error } = await supabase
    .from('booking_estimates')
    .insert(estimateData)
    .select()
    .single()
  return { data, error }
}

export async function updateEstimate(estimateId, updates) {
  const { data, error } = await supabase
    .from('booking_estimates')
    .update(updates)
    .eq('id', estimateId)
    .select()
    .single()
  return { data, error }
}

export async function addEstimateItem(item) {
  const { data, error } = await supabase
    .from('estimate_items')
    .insert(item)
    .select()
    .single()
  return { data, error }
}

export async function removeEstimateItem(itemId) {
  const { error } = await supabase
    .from('estimate_items')
    .delete()
    .eq('id', itemId)
  return { error }
}

// Chef submits estimate to client
export async function submitEstimate(estimateId) {
  return updateEstimate(estimateId, { status: 'submitted' })
}

// Client approves estimate
export async function approveEstimate(estimateId) {
  return updateEstimate(estimateId, {
    status: 'approved',
    approved_at: new Date().toISOString()
  })
}

// Client requests revision
export async function requestEstimateRevision(estimateId, clientNotes) {
  return updateEstimate(estimateId, {
    status: 'revision_requested',
    client_notes: clientNotes
  })
}
