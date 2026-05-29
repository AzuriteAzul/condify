import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('Supabase client created successfully')

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          fraction: string
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          fraction: string
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          fraction?: string
          is_admin?: boolean
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string;
          type: 'informacao' | 'sugestao' | 'queixa';
          category: string;
          description: string;
          status: 'active' | 'inactive';
          user_email: string;
          fraction: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'informacao' | 'sugestao' | 'queixa';
          category: string;
          description: string;
          status?: 'active' | 'inactive';
          user_email: string;
          fraction: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'informacao' | 'sugestao' | 'queixa';
          category?: string;
          description?: string;
          status?: 'active' | 'inactive';
          user_email?: string;
          fraction?: string;
          created_at?: string;
        };
      }
      payment_proofs: {
        Row: {
          id: string
          fraction: string
          month: number
          year: number
          file_name: string
          file_type: string
          file_size: number
          file_url?: string
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          fraction: string
          month: number
          year: number
          file_name: string
          file_type: string
          file_size: number
          file_url?: string
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          fraction?: string
          month?: number
          year?: number
          file_name?: string
          file_type?: string
          file_size?: number
          file_url?: string
          uploaded_by?: string
          uploaded_at?: string
        }
      }
      payment_values: {
        Row: {
          id: string
          fraction: string
          amount: number
          last_updated: string
          updated_by: string
        }
        Insert: {
          id?: string
          fraction: string
          amount: number
          last_updated?: string
          updated_by: string
        }
        Update: {
          id?: string
          fraction?: string
          amount?: number
          last_updated?: string
          updated_by?: string
        }
      }
      budget_items: {
        Row: {
          id: string
          description: string
          amount: number
          category: string
          fraction: string
          created_at: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          category: string
          fraction: string
          created_at?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          category?: string
          fraction?: string
          created_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          description: string
          amount: number
          provider: string
          fraction: string
          status: 'pending' | 'approved' | 'rejected'
          comprovativo_url?: string
          created_at: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          provider: string
          fraction: string
          status?: 'pending' | 'approved' | 'rejected'
          comprovativo_url?: string
          created_at?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          provider?: string
          fraction?: string
          status?: 'pending' | 'approved' | 'rejected'
          comprovativo_url?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          status: 'todo' | 'in_progress' | 'done'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string
          created_by: string
          fraction: string
          due_date?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: 'todo' | 'in_progress' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string
          created_by: string
          fraction: string
          due_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'todo' | 'in_progress' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string
          created_by?: string
          fraction?: string
          due_date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 