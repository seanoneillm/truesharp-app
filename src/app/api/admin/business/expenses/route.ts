import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
];

interface ExpenseData {
  description: string;
  amount: number;
  expense_date: string;
  category: 'development' | 'operations' | 'marketing' | 'general';
  subcategory?: string;
  is_recurring: boolean;
  recurring_interval?: 'monthly' | 'quarterly' | 'yearly';
  next_due_date?: string;
  recurring_end_date?: string;
  vendor?: string;
  receipt_url?: string;
  tax_deductible: boolean;
  notes?: string;
  entered_by_user_id: string;
  entered_by_name: string;
  created_by: string;
}

// GET: Fetch expenses with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    
    // Get filters from query params
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isRecurring = searchParams.get('isRecurring');
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('business_expenses')
      .select('*')
      .eq('status', status)
      .order('expense_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (startDate) {
      query = query.gte('expense_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }
    
    if (isRecurring !== null && isRecurring !== undefined) {
      query = query.eq('is_recurring', isRecurring === 'true');
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('business_expenses')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    return NextResponse.json({
      expenses: expenses || [],
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in expenses GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new expense
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const body = await request.json() as ExpenseData;

    // Validate required fields
    if (!body.description || !body.amount || !body.expense_date || !body.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate admin user
    if (!ADMIN_USER_IDS.includes(body.created_by)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Insert expense
    const { data: expense, error } = await supabase
      .from('business_expenses')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('Error in expenses POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update expense
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const body = await request.json();
    const { id, updated_by, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing expense ID' }, { status: 400 });
    }

    // Validate admin user
    if (!ADMIN_USER_IDS.includes(updated_by)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: expense, error } = await supabase
      .from('business_expenses')
      .update({ ...updateData, updated_by })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error('Error in expenses PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Archive expense (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const updated_by = searchParams.get('updated_by');

    if (!id) {
      return NextResponse.json({ error: 'Missing expense ID' }, { status: 400 });
    }

    // Validate admin user
    if (!updated_by || !ADMIN_USER_IDS.includes(updated_by)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('business_expenses')
      .update({ status: 'archived', updated_by })
      .eq('id', id);

    if (error) {
      console.error('Error archiving expense:', error);
      return NextResponse.json({ error: 'Failed to archive expense' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in expenses DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}