-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS public.payment_values CASCADE;
DROP TABLE IF EXISTS public.payment_proofs CASCADE;
DROP TABLE IF EXISTS public.budget_items CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;

-- Create users table
CREATE TABLE public.users (
    id UUID NOT NULL,
    email TEXT NULL,
    fraction TEXT NULL DEFAULT 'N/A'::TEXT CHECK (fraction IN ('A', 'B', 'C', 'D', 'E', 'F', 'N/A')),
    is_admin BOOLEAN NULL DEFAULT FALSE,
    name TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Create announcements table
CREATE TABLE public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('informacao', 'sugestao', 'queixa')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    user_email TEXT NOT NULL,
    fraction TEXT NOT NULL CHECK (fraction IN ('A', 'B', 'C', 'D', 'E', 'F', 'N/A')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget items table
CREATE TABLE public.budget_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE,
    frequency TEXT CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment proofs table
CREATE TABLE public.payment_proofs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fraction TEXT NOT NULL CHECK (fraction IN ('A', 'B', 'C', 'D', 'E', 'F', 'N/A')),
    month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
    year INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment values table
CREATE TABLE public.payment_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fraction TEXT UNIQUE NOT NULL CHECK (fraction IN ('A', 'B', 'C', 'D', 'E', 'F', 'N/A')),
    amount DECIMAL(10,2) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- Create tasks table for Kanban board
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to TEXT,
    created_by TEXT NOT NULL,
    fraction TEXT NOT NULL CHECK (fraction IN ('A', 'B', 'C', 'D', 'E', 'F', 'N/A')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_announcements_user_email ON public.announcements(user_email);
CREATE INDEX idx_announcements_fraction ON public.announcements(fraction);
CREATE INDEX idx_budget_items_created_by ON public.budget_items(created_by);
CREATE INDEX idx_payment_proofs_fraction ON public.payment_proofs(fraction);
CREATE INDEX idx_payment_proofs_uploaded_by ON public.payment_proofs(uploaded_by);
CREATE INDEX idx_payment_values_fraction ON public.payment_values(fraction);

-- Function to check if current user exists in users table
CREATE OR REPLACE FUNCTION user_exists()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = auth.jwt() ->> 'email' 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

-- Admin policies for users table
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete any user" ON public.users
    FOR DELETE USING (is_admin());

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (is_admin());

-- Announcements table policies
CREATE POLICY "Users can view all announcements" ON public.announcements
    FOR SELECT USING (true);

CREATE POLICY "Users can create announcements" ON public.announcements
    FOR INSERT WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own announcements" ON public.announcements
    FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own announcements" ON public.announcements
    FOR DELETE USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Admins can delete any announcement" ON public.announcements
    FOR DELETE USING (is_admin());

-- Budget items table policies
CREATE POLICY "All users can view budget items" ON public.budget_items
    FOR SELECT USING (true);

CREATE POLICY "Users can create budget items" ON public.budget_items
    FOR INSERT WITH CHECK (created_by = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own budget items" ON public.budget_items
    FOR UPDATE USING (created_by = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own budget items" ON public.budget_items
    FOR DELETE USING (created_by = auth.jwt() ->> 'email');

CREATE POLICY "Admins can manage all budget items" ON public.budget_items
    FOR ALL USING (is_admin());

-- Payment proofs table policies (simplified)
CREATE POLICY "Users can view all payment proofs" ON public.payment_proofs
    FOR SELECT USING (true);

CREATE POLICY "Users can create payment proofs" ON public.payment_proofs
    FOR INSERT WITH CHECK (uploaded_by = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own proofs" ON public.payment_proofs
    FOR DELETE USING (uploaded_by = auth.jwt() ->> 'email');

-- Payment values table policies
CREATE POLICY "Users can view payment values" ON public.payment_values
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage payment values" ON public.payment_values
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.email = auth.jwt() ->> 'email' 
            AND users.is_admin = true
        )
    );

-- Insert default payment values
INSERT INTO public.payment_values (fraction, amount, updated_by) VALUES
('A', 150.00, 'system'),
('B', 150.00, 'system'),
('C', 150.00, 'system'),
('D', 150.00, 'system'),
('E', 150.00, 'system'),
('F', 150.00, 'system')
ON CONFLICT (fraction) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON public.budget_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for tasks
CREATE POLICY "Users can view all tasks" ON public.tasks
    FOR SELECT USING (true);

CREATE POLICY "Users can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = created_by
    );

CREATE POLICY "Users can update tasks they created or are assigned to" ON public.tasks
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = created_by OR
        auth.jwt() ->> 'email' = assigned_to
    );

CREATE POLICY "Users can delete tasks they created" ON public.tasks
    FOR DELETE USING (
        auth.jwt() ->> 'email' = created_by
    );

-- Admin policies for tasks table
CREATE POLICY "Admins can manage all tasks" ON public.tasks
    FOR ALL USING (is_admin());

-- Explicit admin policies for tasks (redundant but clear)
CREATE POLICY "Admins can view all tasks" ON public.tasks
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all tasks" ON public.tasks
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete all tasks" ON public.tasks
    FOR DELETE USING (is_admin());

CREATE POLICY "Admins can insert tasks" ON public.tasks
    FOR INSERT WITH CHECK (is_admin()); 