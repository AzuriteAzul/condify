export interface User {
  id: string
  email: string
  name?: string
  fraction: string
  is_admin: boolean
  created_at: string
}

export interface AuthUser {
  id: string;
  email: string;
  fraction: string;
  is_admin: boolean;
  name?: string | null;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    [key: string]: any;
  };
  aud: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string
  type: 'informacao' | 'sugestao' | 'queixa'
  category: string
  description: string
  status: 'active' | 'inactive'
  createdAt: string
  userEmail: string
  fraction: string
}

export interface BudgetItem {
  id: string
  description: string
  amount: number
  category: string
  fraction: string
  created_at: string
}

export interface Quote {
  id: string
  description: string
  amount: number
  provider: string
  fraction: string
  status: 'pending' | 'approved' | 'rejected'
  comprovativo_url?: string
  created_at: string
}

export interface PaymentValue {
  id: string
  fraction: string
  amount: number
  last_updated: string
  updated_by: string
}

export interface Task {
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