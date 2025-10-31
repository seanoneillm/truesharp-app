-- Business Expenses Table Schema
-- Run this in your Supabase SQL Editor

-- Create business_expenses table
CREATE TABLE IF NOT EXISTS public.business_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Basic expense info
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('development', 'operations', 'marketing', 'general')),
  subcategory TEXT, -- Optional: for more granular categorization
  
  -- Recurring expenses
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_interval TEXT CHECK (recurring_interval IN ('monthly', 'quarterly', 'yearly') OR recurring_interval IS NULL),
  next_due_date DATE, -- For recurring expenses
  recurring_end_date DATE, -- When recurring expense stops
  
  -- User tracking
  entered_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  entered_by_name TEXT NOT NULL, -- Store name for historical purposes
  
  -- Additional metadata
  vendor TEXT, -- Who was paid
  receipt_url TEXT, -- Link to receipt/invoice
  tax_deductible BOOLEAN DEFAULT TRUE,
  notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'cancelled')),
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_expenses_date ON business_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_business_expenses_category ON business_expenses(category);
CREATE INDEX IF NOT EXISTS idx_business_expenses_recurring ON business_expenses(is_recurring, next_due_date) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_business_expenses_status ON business_expenses(status);

-- Enable RLS
ALTER TABLE business_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only access - update these UUIDs to match your admin user IDs)
CREATE POLICY "Admin users can manage business expenses" ON business_expenses
  FOR ALL USING (
    auth.uid() IN (
      '28991397-dae7-42e8-a822-0dffc6ff49b7'::uuid,
      '0e16e4f5-f206-4e62-8282-4188ff8af48a'::uuid,
      'dfd44121-8e88-4c83-ad95-9fb8a4224908'::uuid
    )
  );

-- Create or replace update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update trigger
DROP TRIGGER IF EXISTS update_business_expenses_updated_at ON business_expenses;
CREATE TRIGGER update_business_expenses_updated_at 
  BEFORE UPDATE ON business_expenses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'business_expenses' AND table_schema = 'public'
ORDER BY ordinal_position;