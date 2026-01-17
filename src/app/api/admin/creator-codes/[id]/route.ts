import { createServiceRoleClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// DELETE - Delete a creator code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Missing code ID' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    console.log(`🗑️ Deleting creator code: ${id}`)

    const { error: deleteError } = await supabase
      .from('creator_codes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ Error deleting creator code:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log(`✅ Deleted creator code: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Creator code deleted successfully'
    })

  } catch (error) {
    console.error('❌ Creator Codes DELETE Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// PATCH - Toggle active status of a creator code
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing code ID' }, { status: 400 })
    }

    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    console.log(`🔄 Updating creator code ${id} active status to: ${is_active}`)

    const { data: updatedCode, error: updateError } = await supabase
      .from('creator_codes')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating creator code:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`✅ Updated creator code: ${updatedCode.code}`)

    return NextResponse.json({
      success: true,
      data: updatedCode,
      message: `Creator code ${is_active ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error) {
    console.error('❌ Creator Codes PATCH Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
