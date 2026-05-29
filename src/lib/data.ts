import { supabase } from './supabase'

// Announcement operations
export const announcementService = {
  async getAll() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Transform database fields to component interface format
    return (data || []).map(item => ({
      id: item.id,
      type: item.type,
      category: item.category,
      description: item.description,
      status: item.status,
      createdAt: item.created_at,
      userEmail: item.user_email,
      fraction: item.fraction,
    }))
  },

  async create(announcement: {
    type: 'informacao' | 'sugestao' | 'queixa'
    category: string
    description: string
    user_email: string
    fraction: string
  }) {
    const { data, error } = await supabase
      .from('announcements')
      .insert([announcement])
      .select()
      .single()
    
    if (error) throw error
    
    // Transform the created item to match component interface
    return {
      id: data.id,
      type: data.type,
      category: data.category,
      description: data.description,
      status: data.status,
      createdAt: data.created_at,
      userEmail: data.user_email,
      fraction: data.fraction,
    }
  },

  async update(id: string, updates: Partial<{
    type: 'informacao' | 'sugestao' | 'queixa'
    category: string
    description: string
    status: 'active' | 'inactive'
  }>) {
    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Transform the updated item to match component interface
    return {
      id: data.id,
      type: data.type,
      category: data.category,
      description: data.description,
      status: data.status,
      createdAt: data.created_at,
      userEmail: data.user_email,
      fraction: data.fraction,
    }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Budget operations
export const budgetService = {
  async getAll() {
    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(budgetItem: {
    type: 'income' | 'expense'
    category: string
    description: string
    amount: number
    is_recurring: boolean
    start_date: string
    end_date?: string
    frequency?: 'monthly' | 'quarterly' | 'yearly'
    created_by: string
  }) {
    const { data, error } = await supabase
      .from('budget_items')
      .insert([budgetItem])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<{
    type: 'income' | 'expense'
    category: string
    description: string
    amount: number
    is_recurring: boolean
    start_date: string
    end_date?: string
    frequency?: 'monthly' | 'quarterly' | 'yearly'
  }>) {
    const { data, error } = await supabase
      .from('budget_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Payment values operations
export const paymentValueService = {
  async getAll() {
    const { data, error } = await supabase
      .from('payment_values')
      .select('*')
      .order('fraction')
    
    if (error) throw error
    return data || []
  },

  async create(paymentValue: {
    fraction: string
    amount: number
    updated_by: string
  }) {
    const { data, error } = await supabase
      .from('payment_values')
      .insert([paymentValue])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(fraction: string, updates: {
    amount: number
    updated_by: string
  }) {
    const { data, error } = await supabase
      .from('payment_values')
      .update(updates)
      .eq('fraction', fraction)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

export interface PaymentProof {
  id: string
  fraction: string
  month: number
  year: number
  fileName?: string
  fileType?: string
  fileSize?: number
  uploadedBy?: string
  uploadedAt?: string
  fileData?: string
}

/**
 * Returns the list of fractions that have payment proofs for every month from startMonth/startYear to endMonth/endYear inclusive.
 * @param paymentProofs Array of payment proofs
 * @param startMonth 0-based (0=Jan)
 * @param startYear
 * @param endMonth 0-based (0=Jan)
 * @param endYear
 * @returns Array of fraction strings (e.g. ['A', 'B'])
 */
export function getFullyPaidFractions(
  paymentProofs: PaymentProof[],
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): string[] {
  const FRACTIONS = ['A', 'B', 'C', 'D', 'E', 'F']
  
  // Create a Set for O(1) lookups: "fraction-month-year"
  const proofSet = new Set<string>()
  paymentProofs.forEach(proof => {
    proofSet.add(`${proof.fraction}-${proof.month}-${proof.year}`)
  })
  
  // For each fraction, check if it has a proof for every required period
  return FRACTIONS.filter(fraction => {
    for (let year = startYear; year <= endYear; year++) {
      const monthStart = year === startYear ? startMonth : 0
      const monthEnd = year === endYear ? endMonth : 11
      for (let month = monthStart; month <= monthEnd; month++) {
        const key = `${fraction}-${month}-${year}`
        if (!proofSet.has(key)) {
          return false // This fraction is missing a payment for this month
        }
      }
    }
    return true // This fraction has all required payments
  })
}

// User operations
export const userService = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('email, name')
    
    if (error) throw error
    return data || []
  }
} 