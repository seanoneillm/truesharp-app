import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload image endpoint called')

    const supabase = await createServerClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    console.log('Auth check:', { user: user?.id, authError })

    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'profile' or 'banner'

    console.log('Form data received:', { fileName: file?.name, fileSize: file?.size, type })

    if (!file || !file.name) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type || !['profile', 'banner'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "profile" or "banner"' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      )
    }

    // Generate unique filename with proper extension
    const fileExt = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const fileName = `${user.id}_${type}_${timestamp}.${fileExt}`

    console.log('Attempting upload:', { fileName, bucket: 'seller-profiles' })

    // For now, let's use a placeholder approach until storage is properly configured
    // In a real app, you would upload to your storage service here

    // Create a data URL for the image (this works for demo purposes)
    const fileBuffer = await file.arrayBuffer()
    const base64String = Buffer.from(fileBuffer).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64String}`

    // For production, you would upload to Supabase storage like this:
    /*
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('seller-profiles')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('seller-profiles')
      .getPublicUrl(fileName)

    const imageUrl = publicUrlData.publicUrl
    */

    const imageUrl = dataUrl
    console.log('Using data URL for image preview')

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
        path: fileName,
        type,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/seller-profile/upload-image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
