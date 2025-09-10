import { NextRequest, NextResponse } from 'next/server'

// GET /api/sharpsports/books - Fetch books with SDK support information
export async function GET(request: NextRequest) {
  try {
    console.log('📚 Fetching SharpSports books with SDK support info')

    // Get API key from environment
    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('Books - SHARPSPORTS_API_KEY not configured')
      return NextResponse.json({ 
        error: 'SharpSports API key not configured' 
      }, { status: 500 })
    }

    // Fetch books with support information
    const response = await fetch('https://api.sharpsports.io/v1/book?support=true', {
      method: 'GET',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `❌ Books - Failed to fetch books: ${response.status}`,
        errorText
      )
      return NextResponse.json({
        error: `Failed to fetch books: HTTP ${response.status}`,
        details: errorText,
      }, { status: response.status })
    }

    const booksData = await response.json()
    console.log(`✅ Books - Successfully fetched ${booksData.length || 0} books`)

    // Transform the data to highlight SDK requirements
    const transformedBooks = booksData.map((book: any) => ({
      ...book,
      requiresExtension: Boolean(book.sdkRequired) && 
        Boolean(book.sdkSupport?.webBrowserExtension?.platforms?.some((p: any) => p.supported)),
      mobileOnly: Boolean(book.mobileOnly),
      desktopSupported: !book.mobileOnly && (!book.sdkRequired || 
        Boolean(book.sdkSupport?.webBrowserExtension?.platforms?.some((p: any) => p.supported))),
    }))

    return NextResponse.json({
      success: true,
      books: transformedBooks,
      summary: {
        total: transformedBooks.length,
        requiresExtension: transformedBooks.filter((b: any) => b.requiresExtension).length,
        mobileOnly: transformedBooks.filter((b: any) => b.mobileOnly).length,
        desktopSupported: transformedBooks.filter((b: any) => b.desktopSupported).length,
      }
    })
  } catch (error) {
    console.error('Books - Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}